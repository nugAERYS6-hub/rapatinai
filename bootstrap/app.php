<?php

use App\Http\Middleware\EnsureApiAuthorized;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'api.auth' => EnsureApiAuthorized::class,
        ]);

        // Aktifkan sesi dan enkripsi cookie pada grup rute API
        // untuk mendukung autentikasi sesi SPA berbasis CSRF
        $middleware->api(prepend: [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        ]);

        // Pengecualian validasi CSRF global Laravel hanya untuk rute API eksternal;
        // verifikasi CSRF untuk browser SPA dikelola secara selektif oleh EnsureApiAuthorized
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Respons JSON seragam untuk error rute API saat APP_DEBUG=false
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) {
                    return $e->getResponse();
                }

                $status = ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface)
                    ? $e->getStatusCode()
                    : 500;
                
                if ($status === 429 || $status === 422 || $status === 419 || $status === 403 || $status === 401) {
                    return null;
                }

                $isDebug = (bool) config('app.debug', false);

                return response()->json([
                    'success' => false,
                    'pesan'   => $isDebug ? $e->getMessage() : ($status === 404 ? 'Sumber daya API tidak ditemukan.' : 'Terjadi kesalahan pada server. Silakan hubungi administrator.'),
                ], $status);
            }
        });
    })->create();
