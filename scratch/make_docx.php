<?php
require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\Style\Font;

$mdFile = __DIR__ . '/../PANDUAN_PENGGUNAAN_NIPW.md';
$docxFile = __DIR__ . '/../PANDUAN_PENGGUNAAN_NIPW.docx';

if (!file_exists($mdFile)) {
    die("File MD tidak ditemukan\n");
}

$lines = file($mdFile, FILE_IGNORE_NEW_LINES);

$phpWord = new PhpWord();
$phpWord->setDefaultFontName('Calibri');
$phpWord->setDefaultFontSize(11);

// Definisi Style
$phpWord->addTitleStyle(1, ['name' => 'Calibri', 'size' => 18, 'bold' => true, 'color' => '1B365D'], ['spaceAfter' => 140, 'spaceBefore' => 240]);
$phpWord->addTitleStyle(2, ['name' => 'Calibri', 'size' => 14, 'bold' => true, 'color' => '2C5282'], ['spaceAfter' => 100, 'spaceBefore' => 180]);
$phpWord->addTitleStyle(3, ['name' => 'Calibri', 'size' => 12, 'bold' => true, 'color' => '2B6CB0'], ['spaceAfter' => 80, 'spaceBefore' => 140]);

$section = $phpWord->addSection([
    'marginTop' => 1134,
    'marginBottom' => 1134,
    'marginLeft' => 1134,
    'marginRight' => 1134,
]);

$inTable = false;
$tableRows = [];

function flushTable(&$section, &$tableRows) {
    if (empty($tableRows)) return;
    
    $tableStyle = [
        'borderSize' => 6,
        'borderColor' => 'CCCCCC',
        'cellMargin' => 80,
    ];
    $firstRowStyle = ['bgColor' => 'F0F4F8'];
    $table = $section->addTable($tableStyle);
    
    $isHeader = true;
    foreach ($tableRows as $row) {
        $table->addRow(null, $isHeader ? $firstRowStyle : []);
        foreach ($row as $cell) {
            $table->addCell(3000)->addText($cell, $isHeader ? ['bold' => true, 'color' => '1A365D'] : []);
        }
        $isHeader = false;
    }
    $section->addTextBreak(1);
    $tableRows = [];
}

foreach ($lines as $line) {
    $trimmed = trim($line);
    
    // Check table row
    if (str_starts_with($trimmed, '|')) {
        // Table line
        if (preg_match('/^\|[\s\-:]+\|/', $trimmed)) {
            // separator row like |---|---|
            continue;
        }
        $inTable = true;
        $cells = array_values(array_filter(array_map('trim', explode('|', $trimmed)), function($c) {
            return $c !== '';
        }));
        if (!empty($cells)) {
            $tableRows[] = $cells;
        }
        continue;
    } else {
        if ($inTable) {
            flushTable($section, $tableRows);
            $inTable = false;
        }
    }
    
    if ($trimmed === '' || $trimmed === '---') {
        if ($trimmed === '---') {
            $section->addTextBreak(1);
        }
        continue;
    }
    
    // Heading 1
    if (str_starts_with($trimmed, '# ')) {
        $section->addTitle(substr($trimmed, 2), 1);
        continue;
    }
    // Heading 2
    if (str_starts_with($trimmed, '## ')) {
        $section->addTitle(substr($trimmed, 3), 2);
        continue;
    }
    // Heading 3
    if (str_starts_with($trimmed, '### ')) {
        $section->addTitle(substr($trimmed, 4), 3);
        continue;
    }
    // Heading 4
    if (str_starts_with($trimmed, '#### ')) {
        $section->addText(substr($trimmed, 5), ['bold' => true, 'size' => 11, 'color' => '2D3748'], ['spaceBefore' => 100, 'spaceAfter' => 40]);
        continue;
    }
    
    // Screenshot Placeholder or Blockquote
    if (str_starts_with($trimmed, '> 📸') || str_starts_with($trimmed, '> *Petunjuk') || str_starts_with($trimmed, '> ###') || str_starts_with($trimmed, '>')) {
        $calloutText = trim(ltrim($trimmed, '> '));
        // Add a styled callout box / cell
        $calloutTable = $section->addTable(['borderSize' => 12, 'borderColor' => '3182CE', 'cellMargin' => 100]);
        $calloutTable->addRow();
        $cell = $calloutTable->addCell(9000, ['bgColor' => 'EBF8FF']);
        
        $isBold = str_contains($calloutText, '📸') || str_contains($calloutText, '###');
        $cell->addText($calloutText, [
            'name' => 'Calibri',
            'size' => 10,
            'bold' => $isBold,
            'italic' => str_starts_with($calloutText, '*'),
            'color' => '2B6CB0'
        ], ['spaceAfter' => 40]);
        
        $section->addTextBreak(1);
        continue;
    }
    
    // Bullet list
    if (str_starts_with($trimmed, '* ') || str_starts_with($trimmed, '- ')) {
        $bulletText = substr($trimmed, 2);
        $section->addListItem($bulletText, 0, ['size' => 10.5], null, ['spaceAfter' => 40]);
        continue;
    }
    
    // Numbered list
    if (preg_match('/^(\d+)\.\s+(.*)$/', $trimmed, $matches)) {
        $numText = $matches[2];
        $section->addListItem($numText, 0, ['size' => 10.5], \PhpOffice\PhpWord\Style\ListItem::TYPE_NUMBER, ['spaceAfter' => 40]);
        continue;
    }
    
    // Regular paragraph
    $textRun = $section->addTextRun(['spaceAfter' => 80]);
    // Simple inline parser for bold **text**
    $parts = preg_split('/(\*\*.*?\*\*)/', $trimmed, -1, PREG_SPLIT_DELIM_CAPTURE);
    foreach ($parts as $part) {
        if (str_starts_with($part, '**') && str_ends_with($part, '**')) {
            $textRun->addText(substr($part, 2, -2), ['bold' => true]);
        } else {
            $textRun->addText($part);
        }
    }
}

if ($inTable) {
    flushTable($section, $tableRows);
}

$objWriter = IOFactory::createWriter($phpWord, 'Word2007');
$objWriter->save($docxFile);

echo "BERHASIL: File Word dibuat di $docxFile\n";
