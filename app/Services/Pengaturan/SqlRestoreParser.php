<?php

namespace App\Services\Pengaturan;

class SqlRestoreParser
{
    /**
     * Nama tabel target yang diizinkan untuk dipulihkan.
     */
    public const ALLOWED_TABLE = 'rapat';

    /**
     * Awalan pernyataan yang diizinkan dengan validasi ketat.
     */
    protected const SAFE_SET_PATTERNS = [
        '/^SET\s+NAMES\s+/i',
        '/^SET\s+FOREIGN_KEY_CHECKS\s*=\s*[01]/i',
        '/^SET\s+TIME_ZONE\s*=/i',
        '/^SET\s+SQL_MODE\s*=/i',
        '/^SET\s+CHARACTER_SET_CLIENT\s*=/i',
        '/^SET\s+CHARACTER_SET_RESULTS\s*=/i',
        '/^SET\s+COLLATION_CONNECTION\s*=/i',
    ];

    /**
     * Pola kata kunci berbahaya yang langsung ditolak.
     */
    protected const FORBIDDEN_PATTERNS = [
        '/\bINTO\s+OUTFILE\b/i',
        '/\bINTO\s+DUMPFILE\b/i',
        '/\bLOAD\s+DATA\b/i',
        '/\bINFORMATION_SCHEMA\b/i',
        '/\bPERFORMANCE_SCHEMA\b/i',
        '/\bMYSQL\./i',
        '/\bCREATE\s+USER\b/i',
        '/\bGRANT\s+/i',
        '/\bREVOKE\s+/i',
        '/\bDROP\s+DATABASE\b/i',
        '/\bCREATE\s+DATABASE\b/i',
        '/\bALTER\s+TABLE\b/i',
        '/\bTRUNCATE\s+/i',
        '/\bBENCHMARK\s*\(/i',
        '/\bSLEEP\s*\(/i',
    ];

    /**
     * Parsing dan validasi berkas dump SQL.
     * Mengembalikan daftar pernyataan SQL yang aman dan teruji.
     *
     * @param string $konten
     * @return array{statements: array<string>, total_insert: int}
     * @throws \InvalidArgumentException
     */
    public function parseAndValidate(string $konten): array
    {
        // 1. Validasi dasar konten
        if (empty(trim($konten))) {
            throw new \InvalidArgumentException('File SQL kosong, tidak ada data yang dapat dipulihkan.');
        }

        // Hapus UTF-8 BOM jika ada
        if (str_starts_with($konten, "\xEF\xBB\xBF")) {
            $konten = substr($konten, 3);
        }

        // Periksa karakter null byte (indikator berkas biner/eksekusi ilegal)
        if (str_contains($konten, "\0")) {
            throw new \InvalidArgumentException('File SQL mengandung karakter biner/null byte yang tidak valid.');
        }

        // 2. Lexer / Tokenizer berbasis State Machine
        $statements = $this->tokenizeStatements($konten);

        if (empty($statements)) {
            throw new \InvalidArgumentException('Tidak ditemukan pernyataan SQL yang valid dalam file yang diunggah.');
        }

        // 3. Validasi ketat setiap pernyataan SQL
        $validatedStatements = [];
        $totalInsert = 0;
        $hasRapatTarget = false;

        foreach ($statements as $stmt) {
            $trimmed = trim($stmt);
            if ($trimmed === '') {
                continue;
            }

            // Cek kata kunci terlarang
            foreach (self::FORBIDDEN_PATTERNS as $pattern) {
                if (preg_match($pattern, $trimmed)) {
                    throw new \InvalidArgumentException("Pernyataan SQL terlarang terdeteksi: perintah berbahaya tidak diizinkan.");
                }
            }

            // Validasi jenis pernyataan & target tabel
            $tipe = $this->validateAndClassifyStatement($trimmed);

            if ($tipe === 'INSERT') {
                $totalInsert++;
                $hasRapatTarget = true;
            } elseif ($tipe === 'TABLE_OP') {
                $hasRapatTarget = true;
            }

            $validatedStatements[] = $trimmed;
        }

        if (!$hasRapatTarget) {
            throw new \InvalidArgumentException("File SQL tidak mengandung struktur atau data untuk tabel '" . self::ALLOWED_TABLE . "'.");
        }

        return [
            'statements'   => $validatedStatements,
            'total_insert' => $totalInsert,
        ];
    }

    /**
     * Tokenizer State Machine untuk memecah string SQL menjadi daftar query lengkap.
     * Memperhitungkan string kutip tunggal, kutip ganda, backtick, dan komentar.
     *
     * @param string $sql
     * @return array<string>
     */
    protected function tokenizeStatements(string $sql): array
    {
        $len = strlen($sql);
        $statements = [];
        $current = '';

        $inSingleQuote = false;
        $inDoubleQuote = false;
        $inBacktick = false;
        $inLineComment = false;
        $inBlockComment = false;

        for ($i = 0; $i < $len; $i++) {
            $c = $sql[$i];
            $next = $i + 1 < $len ? $sql[$i + 1] : '';

            // Handle Komentar Satu Baris (-- atau #)
            if ($inLineComment) {
                if ($c === "\n") {
                    $inLineComment = false;
                }
                continue;
            }

            // Handle Komentar Multi Baris (/* ... */)
            if ($inBlockComment) {
                if ($c === '*' && $next === '/') {
                    $inBlockComment = false;
                    $i++; // Lewati '/'
                }
                continue;
            }

            // Handle String Kutip Tunggal '...'
            if ($inSingleQuote) {
                $current .= $c;
                if ($c === '\\') {
                    // Karakter escape (\', \\, dll)
                    if ($next !== '') {
                        $current .= $next;
                        $i++;
                    }
                } elseif ($c === "'") {
                    if ($next === "'") {
                        // SQL escape kutip tunggal ganda ('')
                        $current .= $next;
                        $i++;
                    } else {
                        $inSingleQuote = false;
                    }
                }
                continue;
            }

            // Handle String Kutip Ganda "..."
            if ($inDoubleQuote) {
                $current .= $c;
                if ($c === '\\') {
                    if ($next !== '') {
                        $current .= $next;
                        $i++;
                    }
                } elseif ($c === '"') {
                    if ($next === '"') {
                        $current .= $next;
                        $i++;
                    } else {
                        $inDoubleQuote = false;
                    }
                }
                continue;
            }

            // Handle Identifier Backtick `...`
            if ($inBacktick) {
                $current .= $c;
                if ($c === '`') {
                    if ($next === '`') {
                        $current .= $next;
                        $i++;
                    } else {
                        $inBacktick = false;
                    }
                }
                continue;
            }

            // Di Luar String & Komentar: Periksa apakah mulai komentar
            if ($c === '-' && $next === '-') {
                $third = $i + 2 < $len ? $sql[$i + 2] : '';
                if ($third === ' ' || $third === "\t" || $third === "\r" || $third === "\n") {
                    $inLineComment = true;
                    $i += 2;
                    continue;
                }
            }

            if ($c === '#') {
                $inLineComment = true;
                continue;
            }

            if ($c === '/' && $next === '*') {
                $inBlockComment = true;
                $i++;
                continue;
            }

            // Periksa apakah mulai string/identifier
            if ($c === "'") {
                $inSingleQuote = true;
                $current .= $c;
                continue;
            }

            if ($c === '"') {
                $inDoubleQuote = true;
                $current .= $c;
                continue;
            }

            if ($c === '`') {
                $inBacktick = true;
                $current .= $c;
                continue;
            }

            // Semicolon sebagai pembatas pernyataan SQL
            if ($c === ';') {
                $trimmed = trim($current);
                if ($trimmed !== '') {
                    $statements[] = $trimmed;
                    $current = '';
                }
                continue;
            }

            $current .= $c;
        }

        // Jika string/komentar belum ditutup sampai akhir file
        if ($inSingleQuote || $inDoubleQuote || $inBlockComment) {
            throw new \InvalidArgumentException('Format SQL tidak valid: string atau komentar tidak ditutup dengan benar.');
        }

        $trimmed = trim($current);
        if ($trimmed !== '') {
            $statements[] = $trimmed;
        }

        return $statements;
    }

    /**
     * Memvalidasi bahwa pernyataan hanya mengoperasikan tabel yang diizinkan ('rapat')
     * atau pernyataan konfigurasi sesi yang aman.
     *
     * @param string $stmt
     * @return string 'SET' | 'TABLE_OP' | 'INSERT' | 'SAFE_OP'
     * @throws \InvalidArgumentException
     */
    protected function validateAndClassifyStatement(string $stmt): string
    {
        $targetTable = self::ALLOWED_TABLE;

        // 1. Pernyataan SET
        if (preg_match('/^SET\s+/i', $stmt)) {
            $isSafeSet = false;
            foreach (self::SAFE_SET_PATTERNS as $pattern) {
                if (preg_match($pattern, $stmt)) {
                    $isSafeSet = true;
                    break;
                }
            }

            if (!$isSafeSet) {
                throw new \InvalidArgumentException("Pernyataan SET tidak diizinkan: hanya pengaturan sesi (NAMES, FOREIGN_KEY_CHECKS, TIME_ZONE) yang diperbolehkan.");
            }

            return 'SET';
        }

        // 2. Pernyataan DROP TABLE
        if (preg_match('/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:`?' . $targetTable . '`?)\s*$/i', $stmt)) {
            return 'TABLE_OP';
        } elseif (preg_match('/^DROP\s+TABLE/i', $stmt)) {
            throw new \InvalidArgumentException("Pernyataan DROP TABLE hanya diizinkan untuk tabel '{$targetTable}'.");
        }

        // 3. Pernyataan CREATE TABLE
        if (preg_match('/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?' . $targetTable . '`?)\s*\(/i', $stmt)) {
            return 'TABLE_OP';
        } elseif (preg_match('/^CREATE\s+TABLE/i', $stmt)) {
            throw new \InvalidArgumentException("Pernyataan CREATE TABLE hanya diizinkan untuk tabel '{$targetTable}'.");
        }

        // 4. Pernyataan LOCK / UNLOCK TABLES
        if (preg_match('/^LOCK\s+TABLES\s+(?:`?' . $targetTable . '`?)\s+WRITE\s*$/i', $stmt)) {
            return 'SAFE_OP';
        } elseif (preg_match('/^LOCK\s+TABLES/i', $stmt)) {
            throw new \InvalidArgumentException("Pernyataan LOCK TABLES hanya diizinkan untuk tabel '{$targetTable}'.");
        }

        if (preg_match('/^UNLOCK\s+TABLES\s*$/i', $stmt)) {
            return 'SAFE_OP';
        }

        // 5. Pernyataan INSERT INTO
        if (preg_match('/^INSERT\s+INTO\s+(?:`?' . $targetTable . '`?)\s+/i', $stmt)) {
            return 'INSERT';
        } elseif (preg_match('/^INSERT\s+INTO/i', $stmt)) {
            throw new \InvalidArgumentException("Pernyataan INSERT INTO hanya diizinkan untuk tabel '{$targetTable}'.");
        }

        // Jika ada pernyataan lain di luar whitelist (misal UPDATE, DELETE, REPLACE, dll)
        throw new \InvalidArgumentException("Pernyataan SQL tidak diizinkan: '" . substr($stmt, 0, 40) . "...'. Hanya operasi tabel '{$targetTable}' yang didukung.");
    }
}

