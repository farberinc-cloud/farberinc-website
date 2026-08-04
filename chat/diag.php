<?php
/**
 * Farber.Inc Chat — diagnostic page.
 * Visit /chat/diag.php in a browser to see exactly which sources PHP can see
 * the API key from AND dump the raw .env file content (since PHP can read it
 * even though the web can't).
 * Delete this file (chat/diag.php) after debugging.
 */
header('Content-Type: text/plain; charset=utf-8');

$env    = getenv('MINIMAX_API_KEY') ?: '';
$server = $_SERVER['MINIMAX_API_KEY'] ?? '';

$envFile = __DIR__ . '/.env';
$rawExists  = file_exists($envFile);
$rawRead    = is_readable($envFile);
$rawSize    = $rawExists ? filesize($envFile) : 0;
$rawContent = $rawRead ? file_get_contents($envFile) : '';
$rawBOM     = $rawContent !== '' && substr($rawContent, 0, 3) === "\xEF\xBB\xBF" ? 'YES' : 'no';
$dotenv = '';
$firstLine = '';
$secondLine = '';
$allKeys = [];

if ($rawContent !== '') {
    $work = $rawContent;
    if (substr($work, 0, 3) === "\xEF\xBB\xBF") $work = substr($work, 3);
    $lines = preg_split('/\r\n|\r|\n/', $work);
    $firstLine  = $lines[0] ?? '';
    $secondLine = $lines[1] ?? '';
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $eq = strpos($line, '=');
        if ($eq === false) continue;
        $k = trim(substr($line, 0, $eq));
        $v = trim(substr($line, $eq + 1));
        if (strlen($v) >= 2 && (($v[0] === '"' && substr($v, -1) === '"') || ($v[0] === "'" && substr($v, -1) === "'"))) {
            $v = substr($v, 1, -1);
        }
        $allKeys[$k] = $v;
        if ($k === 'MINIMAX_API_KEY') $dotenv = $v;
    }
}

$mask = function ($s) {
    if (!$s) return '(empty)';
    if (strlen($s) < 12) return '(set, ' . strlen($s) . ' chars)';
    return substr($s, 0, 7) . '…' . substr($s, -4) . '  (' . strlen($s) . ' chars)';
};

echo "MINIMAX_API_KEY source check\n";
echo "============================\n\n";
echo "1. getenv() ............. " . $mask($env) . "\n";
echo "2. \$_SERVER ............ " . $mask($server) . "\n";
echo "3. chat/.env file ...... " . $mask($dotenv) . "\n";
echo "\n";
echo ".env file path: $envFile\n";
echo ".env file exists: " . ($rawExists ? 'YES' : 'NO') . "\n";
echo ".env file readable: " . ($rawRead ? 'YES' : 'NO') . "\n";
echo ".env file size: $rawSize bytes\n";
echo ".env has UTF-8 BOM: $rawBOM\n";
echo ".env first line (raw, up to 200 chars):\n  " . substr($firstLine, 0, 200) . "\n";
echo ".env second line (if any):\n  " . substr($secondLine, 0, 200) . "\n";
echo ".env keys parsed: " . (empty($allKeys) ? '(none)' : implode(', ', array_keys($allKeys))) . "\n";
echo ".env MINIMAX_API_KEY length: " . strlen($dotenv) . " chars\n";
echo "\n";
echo "Expected MINIMAX_API_KEY length: ~110 chars (sk-cp-...)\n";
echo "If the parsed length is 0, the .env file is missing the key, the key has\n";
echo "a different name, or the line is being skipped. The first-line dump above\n";
echo "tells you which.\n";
echo "\n";
echo "PHP version: " . PHP_VERSION . "\n";
echo "PHP SAPI:    " . PHP_SAPI . "\n";
echo "open_basedir: " . (ini_get('open_basedir') ?: '(not set)') . "\n";
echo "\nDelete this file (chat/diag.php) once the key is detected.\n";
