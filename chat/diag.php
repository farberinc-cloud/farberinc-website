<?php
/**
 * Farber.Inc Chat — diagnostic page.
 * Visit /chat/diag.php in a browser to see exactly which sources PHP can see
 * the API key from. Delete this file after debugging (it shows nothing useful
 * to the public, but the principle is "no surface area = no surface area").
 */
header('Content-Type: text/plain; charset=utf-8');

$env    = getenv('MINIMAX_API_KEY') ?: '';
$server = $_SERVER['MINIMAX_API_KEY'] ?? '';
$dotenv = '';
$envFile = __DIR__ . '/.env';
if (is_readable($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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
        if ($k === 'MINIMAX_API_KEY') { $dotenv = $v; break; }
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
echo ".env file exists: " . (file_exists($envFile) ? 'YES' : 'NO') . "\n";
echo ".env file readable: " . (is_readable($envFile) ? 'YES' : 'NO') . "\n";
echo ".env file size: " . (file_exists($envFile) ? filesize($envFile) . ' bytes' : 'n/a') . "\n";
echo "\nPHP version: " . PHP_VERSION . "\n";
echo "PHP SAPI:    " . PHP_SAPI . "\n";
echo "open_basedir: " . (ini_get('open_basedir') ?: '(not set)') . "\n";
echo "\nDelete this file (chat/diag.php) once the key is detected.\n";
