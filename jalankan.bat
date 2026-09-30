@echo off
title RapatinAI Server Launcher
echo ====================================================
echo               MENJALANKAN RAPATINAI
echo ====================================================
echo.
echo Pastikan modul MySQL di XAMPP sudah di-START (aktif).
echo.
echo Membuka browser di http://127.0.0.1:8000 ...
start http://127.0.0.1:8000
echo.
echo Memulai server Laravel (tekan Ctrl+C untuk berhenti)...
php artisan serve --port=8000
pause
