<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        $content = file_get_contents($indexPath);
        $token = csrf_token();
        $metaTag = '<meta name="csrf-token" content="' . htmlspecialchars($token, ENT_QUOTES, 'UTF-8') . '" />';
        
        if (str_contains($content, '<meta name="csrf-token"')) {
            $content = preg_replace('/<meta\s+name="csrf-token"\s+content="[^"]*"\s*\/?>/i', $metaTag, $content);
        } else {
            $content = str_replace('<meta charset="UTF-8" />', "<meta charset=\"UTF-8\" />\n  {$metaTag}", $content);
        }

        return response($content, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }
    return view('welcome');
});
