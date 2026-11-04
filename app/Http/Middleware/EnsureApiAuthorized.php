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
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedKey = config('app.api_key', env('RAPATIN_API_KEY', 'rapatin-secure-key-malut-2026'));

        // 1. Periksa Kunci API dari Header (X-API-KEY, X-App-Key), Bearer Token, atau Query Parameter (?api_key=)
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

        if (!empty($expectedKey) && !empty($providedKey) && hash_equals((string)$expectedKey, (string)$providedKey)) {
            return $next($request);
        }

        // 2. Khusus endpoint sensitif (Backup & Restore database), WAJIB menyertakan API Key
        $isSensitiveEndpoint = $request->is('api/backup/*');
        if ($isSensitiveEndpoint) {
            return response()->json([
                'success' => false,
                'pesan'   => 'Akses ditolak: Operasi pencadangan dan pemulihan database memerlukan Kunci API yang valid (X-API-KEY).',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // 3. Untuk endpoint aplikasi internal: periksa Same-Origin dan AJAX
        $isAjax = $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest';
        $referer = (string)$request->headers->get('referer', '');
        $origin = (string)$request->headers->get('origin', '');
        $appHost = parse_url(config('app.url', 'http://localhost:8000'), PHP_URL_HOST) ?: 'localhost';
        $reqHost = $request->getHost();

        $isSameOrigin = ($reqHost === $appHost || in_array($reqHost, ['localhost', '127.0.0.1']))
            && (empty($origin) || str_contains($origin, $reqHost))
            && (empty($referer) || str_contains($referer, $reqHost));

        // Unduh PDF dan Word melalui peramban web pada host yang sama diizinkan
        $isExportDownload = $request->is('api/rapat/*/export-pdf') || $request->is('api/rapat/*/export-word');
        if ($isExportDownload && $isSameOrigin) {
            return $next($request);
        }

        if ($isAjax && $isSameOrigin) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'pesan'   => 'Akses API ditolak. Kunci API tidak valid atau otorisasi tidak ditemukan. Harap sertakan header X-API-KEY.',
        ], Response::HTTP_UNAUTHORIZED);
    }
}
