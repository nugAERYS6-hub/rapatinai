<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders([
            'X-API-KEY' => config('app.api_key', 'rapatin-secure-key-malut-2026'),
            'X-Requested-With' => 'XMLHttpRequest',
        ]);
    }
}
