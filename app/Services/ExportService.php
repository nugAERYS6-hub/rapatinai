<?php

namespace App\Services;

use App\Services\Rapat\ExportService as CoreExportService;

/**
 * Service Wrapper untuk backward compatibility.
 * Implementasi utama berada di App\Services\Rapat\ExportService.
 */
class ExportService extends CoreExportService
{
}
