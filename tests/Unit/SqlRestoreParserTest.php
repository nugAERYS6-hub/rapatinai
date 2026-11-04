<?php

namespace Tests\Unit;

use App\Services\Pengaturan\SqlRestoreParser;
use PHPUnit\Framework\TestCase;

class SqlRestoreParserTest extends TestCase
{
    protected SqlRestoreParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new SqlRestoreParser();
    }

    public function test_parse_valid_sql_dump(): void
    {
        $sql = <<<SQL
-- RapatinAI Backup
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `rapat`;
CREATE TABLE `rapat` (
  `id` VARCHAR(255) NOT NULL,
  `topik` TEXT NOT NULL
);

LOCK TABLES `rapat` WRITE;
INSERT INTO `rapat` (`id`, `topik`) VALUES ('1', 'Rapat Koordinasi Bappeda');
UNLOCK TABLES;

SET FOREIGN_KEY_CHECKS = 1;
SQL;

        $result = $this->parser->parseAndValidate($sql);

        $this->assertIsArray($result);
        $this->assertEquals(1, $result['total_insert']);
        $this->assertCount(8, $result['statements']);
    }

    public function test_parse_handles_semicolons_inside_strings(): void
    {
        // Poin pembahasan mengandung titik koma (;) yang sering merusak explode(';', ...)
        $sql = <<<SQL
SET NAMES utf8mb4;
DROP TABLE IF EXISTS `rapat`;
INSERT INTO `rapat` (`id`, `topik`, `poinPembahasan`) VALUES ('1', 'Rapat Evaluasi', 'Poin 1: Analisis data; Poin 2: Verifikasi lapangan; Poin 3: Rekomendasi final;');
SQL;

        $result = $this->parser->parseAndValidate($sql);

        $this->assertEquals(1, $result['total_insert']);
        $this->assertCount(3, $result['statements']);
        $this->assertStringContainsString('Poin 1: Analisis data; Poin 2: Verifikasi lapangan;', $result['statements'][2]);
    }

    public function test_parse_handles_escaped_quotes_and_comments(): void
    {
        $sql = <<<SQL
SET NAMES utf8mb4;
DROP TABLE IF EXISTS `rapat`;
-- Komentar satu baris
/* Komentar
   multi baris */
INSERT INTO `rapat` (`id`, `topik`) VALUES ('1', 'It\'s a test meeting -- with comments inside');
SQL;

        $result = $this->parser->parseAndValidate($sql);

        $this->assertEquals(1, $result['total_insert']);
        $this->assertCount(3, $result['statements']);
        $this->assertStringContainsString("It\\'s a test meeting -- with comments inside", $result['statements'][2]);
    }

    public function test_reject_unauthorized_table_drop(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("DROP TABLE hanya diizinkan untuk tabel 'rapat'");

        $sql = <<<SQL
SET NAMES utf8mb4;
DROP TABLE IF EXISTS `users`;
SQL;

        $this->parser->parseAndValidate($sql);
    }

    public function test_reject_unauthorized_table_insert(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("INSERT INTO hanya diizinkan untuk tabel 'rapat'");

        $sql = <<<SQL
SET NAMES utf8mb4;
DROP TABLE IF EXISTS `rapat`;
INSERT INTO `users` (`id`, `name`) VALUES ('1', 'Hacker');
SQL;

        $this->parser->parseAndValidate($sql);
    }

    public function test_reject_forbidden_keywords_outfile(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Pernyataan SQL terlarang terdeteksi");

        $sql = <<<SQL
SET NAMES utf8mb4;
SELECT * FROM `rapat` INTO OUTFILE '/tmp/hack.txt';
SQL;

        $this->parser->parseAndValidate($sql);
    }

    public function test_reject_forbidden_keywords_truncate(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Pernyataan SQL terlarang terdeteksi");

        $sql = <<<SQL
TRUNCATE TABLE `rapat`;
SQL;

        $this->parser->parseAndValidate($sql);
    }

    public function test_reject_empty_file(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("File SQL kosong");

        $this->parser->parseAndValidate("   \n\t  ");
    }

    public function test_reject_binary_or_null_bytes(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("null byte");

        $this->parser->parseAndValidate("SET NAMES utf8mb4;\0DROP TABLE rapat;");
    }

    public function test_reject_unclosed_string(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("tidak ditutup dengan benar");

        $this->parser->parseAndValidate("INSERT INTO `rapat` VALUES ('unclosed string;");
    }
}
