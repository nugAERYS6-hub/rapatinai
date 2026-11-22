<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiAuthorized
{
    /**
     * Menangani permintaan masuk ke API dan memverifikasi otorisasi.
     *
     * Mendukung 2 jalur keamanan:
     * 1. Jalur Kunci API Rahasia (External/CLI/Automasi):
     *    Menggunakan header 'X-API-KEY' atau Bearer Token yang cocok dengan RAPATIN_API_KEY di .env.
     * 2. Jalur Browser SPA Internal:
     *    Menggunakan perlindungan Same-Origin, XMLHttpRequest, dan verifikasi CSRF Token
     *    untuk setiap operasi mutasi data (POST, PUT, PATCH, DELETE).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedKey = config('app.api_key', env('RAPATIN_API_KEY'));

        // 1. Jalur Kunci API Rahasia (External API / Automasi / CLI)
        $providedKey = null;
        foreach (['X-API-KEY', 'X-App-Key'] as $header) {
            $val = $request->header($header);
            if (!empty($val)) {
                $providedKey = $val;
                break;
            }
        }

        if (empty($providedKey)) {
            $bearer = $request->bearerToken();
            $queryKey = $request->query('api_key');
            $providedKey = !empty($bearer) ? $bearer : (!empty($queryKey) ? $queryKey : null);
        }

        // Jika kunci API valid diberikan oleh klien eksternal, izinkan akses langsung
        if (!empty($expectedKey) && !empty($providedKey) && hash_equals((string)$expectedKey, (string)$providedKey)) {
            return $next($request);
        }

        // 2. Jalur Browser SPA Internal
        $reqHost = $request->getHost();
        $appHost = parse_url(config('app.url', 'http://localhost:8000'), PHP_URL_HOST) ?: 'localhost';
        $referer = (string)$request->headers->get('referer', '');
        $origin = (string)$request->headers->get('origin', '');

        $isLocalHost = in_array($reqHost, ['localhost', '127.0.0.1'], true) || $reqHost === $appHost;
        $originValid = empty($origin) || str_contains($origin, $reqHost) || str_contains($origin, $appHost);
        $refererValid = empty($referer) || str_contains($referer, $reqHost) || str_contains($referer, $appHost);

        // Jika Origin dikirimkan (CORS check), pastikan cocok dengan host yang sah
        if (!empty($origin)) {
            $originHost = parse_url($origin, PHP_URL_HOST);
            if ($originHost !== $reqHost && $originHost !== $appHost && !in_array($originHost, ['localhost', '127.0.0.1'], true)) {
                return response()->json([
                    'success' => false,
                    'pesan'   => 'Akses API ditolak: Pelanggaran asal permintaan (Cross-Origin Resource Sharing).',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        // Akses unduh berkas/pratinjau langsung lewat peramban (GET) dengan Same-Origin
        $isDownloadOrPreview = $request->is('api/rapat/*/export-pdf')
            || $request->is('api/rapat/*/export-word')
            || $request->is('api/rapat/*/lampiran/*/download')
            || $request->is('api/rapat/*/lampiran/*/preview')
            || $request->is('api/backup/mysql'); // Unduh cadangan via tombol UI

        if ($request->isMethod('GET') && $isDownloadOrPreview && $isLocalHost && $refererValid) {
            return $next($request);
        }

        $isAjax = $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest';
        $isMutating = in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true);

        // Permintaan browser internal harus memenuhi Same-Origin dan AJAX
        if ($isLocalHost && $originValid && $refererValid && $isAjax) {
            // Untuk seluruh operasi mutasi data (POST, PUT, PATCH, DELETE), WAJIB validasi CSRF
            if ($isMutating) {
                $csrfToken = $request->header('X-CSRF-TOKEN')
                    ?: $request->header('X-XSRF-TOKEN')
                    ?: $request->input('_token');

                if (empty($csrfToken) || !$this->validateCsrfToken($request, (string)$csrfToken)) {
                    return response()->json([
                        'success' => false,
                        'pesan'   => 'Token CSRF tidak valid atau telah kedaluwarsa. Silakan muat ulang halaman.',
                    ], 419); // 419 Page Expired / CSRF Token Mismatch
                }
            }

            return $next($request);
        }

        return response()->json([
            'success' => false,
            'pesan'   => 'Akses API ditolak. Kunci API tidak valid atau sesi browser tidak terverifikasi.',
        ], Response::HTTP_UNAUTHORIZED);
    }

    /**
     * Memvalidasi token CSRF terhadap sesi aktif.
     */
    protected function validateCsrfToken(Request $request, string $providedToken): bool
    {
        if (!$request->hasSession()) {
            return false;
        }

        $sessionToken = $request->session()->token();
        if (empty($sessionToken)) {
            return false;
        }

        // 1. Uji kecocokan langsung (header X-CSRF-TOKEN atau input _token)
        if (hash_equals($sessionToken, $providedToken)) {
            return true;
        }

        // 2. Uji kecocokan jika token berupa cookie terenkripsi (X-XSRF-TOKEN)
        try {
            $decrypted = app('encrypter')->decrypt($providedToken, false);
            if (is_string($decrypted) && hash_equals($sessionToken, $decrypted)) {
                return true;
            }
        } catch (\Throwable) {
            // Token bukan string terenkripsi yang valid
        }

        return false;
    }
}
