<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Rate Limiter Umum API (60 req/menit per IP)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'success'     => false,
                        'pesan'       => 'Terlalu banyak permintaan API. Silakan tunggu beberapa saat.',
                        'retry_after' => $headers['Retry-After'] ?? null,
                    ], 429, $headers);
                });
        });

        // 2. Rate Limiter Operasi CRUD Notulensi (30 req/menit per IP)
        RateLimiter::for('crud', function (Request $request) {
            return Limit::perMinute(30)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'success'     => false,
                        'pesan'       => 'Batas frekuensi penyimpanan atau perubahan notulensi tercapai. Silakan coba sesaat lagi.',
                        'retry_after' => $headers['Retry-After'] ?? null,
                    ], 429, $headers);
                });
        });

        // 3. Rate Limiter Fitur AI Gemini (10 req/menit per IP untuk mencegah kuota habis)
        RateLimiter::for('ai', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'success'     => false,
                        'pesan'       => 'Batas permintaan AI tercapai (maksimal 10 permintaan per menit). Mohon tunggu sejenak.',
                        'retry_after' => $headers['Retry-After'] ?? null,
                    ], 429, $headers);
                });
        });

        // 4. Rate Limiter Backup & Restore Database (5 req/menit per IP)
        RateLimiter::for('backup', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'success'     => false,
                        'pesan'       => 'Batas operasi cadangan dan pemulihan database tercapai (maksimal 5 kali per menit).',
                        'retry_after' => $headers['Retry-After'] ?? null,
                    ], 429, $headers);
                });
        });
    }
}
