<?php

namespace App\Services;

use App\Services\Rapat\GeminiService as CoreGeminiService;

/**
 * Service Wrapper untuk backward compatibility.
 * Implementasi utama berada di App\Services\Rapat\GeminiService.
 */
class GeminiService extends CoreGeminiService
{
}
