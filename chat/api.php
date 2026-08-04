<?php
/**
 * Farber.Inc Chatbot — Backend API
 *
 * POST /chat/api.php
 * Body: { type: "chat"|"lead"|"ping", session_id, messages?, lead?, page? }
 *
 * Endpoints:
 *   chat  -> proxies to MiniMax (model MiniMax-M3) with the brand system prompt
 *   lead  -> appends to chat/leads.json (and optionally POSTs to a webhook)
 *   ping  -> returns ok:true (used to warm up / surface config errors)
 *
 * Required environment variable (set in Hostinger hPanel → Advanced → Environment):
 *   MINIMAX_API_KEY   Subscription Key (sk-cp-…) from platform.minimax.io
 *
 * Optional environment variables:
 *   MINIMAX_BASE_URL  default: https://api.minimax.io/v1
 *   MINIMAX_MODEL     default: MiniMax-M3
 *   LEAD_WEBHOOK_URL  if set, leads are POSTed here (JSON) in addition to leads.json
 *   LEAD_EMAIL_TO     if set, leads are also emailed via PHP mail()
 *   LEAD_EMAIL_FROM   from address for mail(); default: wordpress@<host>
 *   CHAT_DEBUG        "1" to return extra debug info (don't enable in production)
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');        // never leak stack traces
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/php-error.log');

// --- CORS + content-type ---------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

// Allow same-origin only. Cross-origin would need a known list.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
$allowedOrigin = $origin && (str_ends_with($host, parse_url($origin, PHP_URL_HOST) ?: ''));
if ($allowedOrigin) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// --- Load config + system prompt -------------------------------------------
$SYSTEM_PROMPT = require __DIR__ . '/system-prompt.php';   // returns the prompt string

// Resolve MINIMAX_API_KEY from any of these sources, in order:
//   1. Real process env (set by hPanel, by Apache SetEnv, or by .user.ini)
//   2. chat/.env file (recommended for Hostinger shared PHP hosting)
//   3. A constant defined in chat/config.php (escape hatch for the adventurous)
$apiKey = getenv('MINIMAX_API_KEY') ?: ($_SERVER['MINIMAX_API_KEY'] ?? '');
if (!$apiKey) $apiKey = fi_env_read(__DIR__ . '/.env', 'MINIMAX_API_KEY');
if (!$apiKey && defined('MINIMAX_API_KEY_FALLBACK')) $apiKey = MINIMAX_API_KEY_FALLBACK;
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Server misconfigured: MINIMAX_API_KEY not set. Create chat/.env with MINIMAX_API_KEY=sk-cp-… and reload.']);
    error_log('[fi-chat] MINIMAX_API_KEY not set in env, _SERVER, or .env');
    exit;
}
$baseUrl = rtrim(fi_env('MINIMAX_BASE_URL') ?: 'https://api.minimax.io/v1', '/');
$model   = fi_env('MINIMAX_MODEL') ?: 'MiniMax-M3';
$debug   = fi_env('CHAT_DEBUG') === '1';

// --- Parse + validate input ------------------------------------------------
$raw = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body.']);
    exit;
}
$type       = isset($body['type']) ? (string)$body['type'] : '';
$sessionId  = isset($body['session_id']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', (string)$body['session_id']) : '';
$page       = isset($body['page']) ? (string)$body['page'] : '';
$messages   = isset($body['messages']) && is_array($body['messages']) ? $body['messages'] : [];
$lead       = isset($body['lead']) && is_array($body['lead']) ? $body['lead'] : null;

if (!$sessionId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing session_id.']);
    exit;
}

// --- Rate limiting (per session, file-based sliding window) ---------------
$rate = enforce_rate_limit($sessionId, $type);
if ($rate['blocked']) {
    http_response_code(429);
    echo json_encode(['error' => $rate['message']]);
    exit;
}

// --- Dispatch --------------------------------------------------------------
try {
    switch ($type) {
        case 'ping':
            echo json_encode(['ok' => true, 'model' => $model, 'ts' => time()]);
            break;

        case 'lead':
            handle_lead($sessionId, $page, $lead, $debug);
            echo json_encode(['ok' => true]);
            break;

        case 'chat':
            $reply = handle_chat($sessionId, $page, $messages, $apiKey, $baseUrl, $model, $debug);
            echo json_encode(['ok' => true, 'reply' => $reply]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unknown type. Use chat, lead, or ping.']);
    }
} catch (Throwable $e) {
    error_log('[fi-chat] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal error. Please try again.']);
}

// =============================================================================
// Handlers
// =============================================================================

/**
 * Call MiniMax /chat/completions with the system prompt + sanitized history.
 */
function handle_chat(string $sessionId, string $page, array $messages, string $apiKey, string $baseUrl, string $model, bool $debug): string {
    // Validate + sanitize messages: keep only {role, content}
    $clean = [];
    foreach ($messages as $m) {
        if (!is_array($m)) continue;
        $role = isset($m['role']) ? (string)$m['role'] : '';
        $content = isset($m['content']) ? (string)$m['content'] : '';
        if (!in_array($role, ['user', 'assistant', 'system'], true)) continue;
        if ($content === '') continue;
        if (mb_strlen($content) > 4000) $content = mb_substr($content, 0, 4000);
        $clean[] = ['role' => $role, 'content' => $content];
    }
    if (!$clean) {
        throw new RuntimeException('Empty message history.');
    }
    // Cap to the last 20 turns to keep context small
    if (count($clean) > 20) $clean = array_slice($clean, -20);

    $systemPrompt = $GLOBALS['SYSTEM_PROMPT'];

    $payload = [
        'model'       => $model,
        'messages'    => array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $clean
        ),
        'temperature' => 0.55,
        'max_tokens'  => 1100,
    ];

    $ch = curl_init($baseUrl . '/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'Accept: application/json',
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $respBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($respBody === false) {
        error_log("[fi-chat] curl error: $curlErr (session=$sessionId)");
        throw new RuntimeException('Upstream call failed: ' . $curlErr);
    }
    $resp = json_decode($respBody, true);

    if ($httpCode >= 400 || !is_array($resp)) {
        error_log("[fi-chat] upstream http=$httpCode body=" . substr((string)$respBody, 0, 500) . " session=$sessionId");
        $apiMsg = is_array($resp) && isset($resp['error']['message']) ? $resp['error']['message'] : "HTTP $httpCode";
        throw new RuntimeException('Upstream error: ' . $apiMsg);
    }

    $reply = $resp['choices'][0]['message']['content'] ?? '';
    if (!is_string($reply) || $reply === '') {
        throw new RuntimeException('Empty upstream reply.');
    }

    // Strip any leaked <think>...</think> blocks (some reasoning models return them)
    $reply = preg_replace('/<think>[\s\S]*?<\/think>/i', '', $reply);
    $reply = trim($reply);

    // Log conversation (best-effort, append-only)
    @file_put_contents(
        __DIR__ . '/conversations.log',
        json_encode([
            'ts'         => date('c'),
            'session'    => $sessionId,
            'page'       => $page,
            'ip'         => client_ip(),
            'user'       => end($clean)['content'] ?? '',
            'reply_len'  => strlen($reply),
        ], JSON_UNESCAPED_UNICODE) . "\n",
        FILE_APPEND | LOCK_EX
    );

    return $reply;
}

/**
 * Persist a lead locally; optionally POST to webhook; optionally email.
 */
function handle_lead(string $sessionId, string $page, ?array $lead, bool $debug): void {
    if (!$lead) return;

    $name  = trim((string)($lead['name']  ?? ''));
    $email = trim((string)($lead['email'] ?? ''));
    if (!$email && !$name) return;
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) return;

    $record = [
        'ts'         => date('c'),
        'session'    => $sessionId,
        'page'       => $page,
        'ip'         => client_ip(),
        'user_agent' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200),
        'name'       => $name,
        'email'      => $email,
    ];

    // 1) Local JSON store
    $storeFile = __DIR__ . '/leads.json';
    $fp = @fopen($storeFile, 'c+');
    if ($fp) {
        flock($fp, LOCK_EX);
        rewind($fp);
        $existing = stream_get_contents($fp);
        if ($existing === '' || $existing === false) $existing = '[]';
        $list = json_decode($existing, true);
        if (!is_array($list)) $list = [];
        $list[] = $record;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        @chmod($storeFile, 0640);
    }

    // 2) Optional webhook (Slack/Discord/CRM/Zapier/Make/etc.)
    $webhook = getenv('LEAD_WEBHOOK_URL');
    if ($webhook) {
        $ch = curl_init($webhook);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode($record, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT        => 5,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }

    // 3) Optional email
    $to = getenv('LEAD_EMAIL_TO');
    if ($to && $email) {
        $from = getenv('LEAD_EMAIL_FROM') ?: ('wordpress@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        $subj = '[Farber.Inc] New chat lead: ' . ($name ?: $email);
        $body = "New lead from farberinc.media chat\n\n"
              . "Name:  $name\n"
              . "Email: $email\n"
              . "Page:  $page\n"
              . "When:  {$record['ts']}\n"
              . "IP:    {$record['ip']}\n";
        @mail($to, $subj, $body, "From: $from\r\nReply-To: $email\r\n");
    }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Cache for .env values, loaded lazily on first call.
 * @var array<string,string>
 */
$fiEnvCache = null;

/**
 * Look up a value: env var first, then .env file fallback.
 */
function fi_env(string $name): string {
    $v = getenv($name);
    if ($v !== false && $v !== '') return $v;
    if (isset($_SERVER[$name]) && $_SERVER[$name] !== '') return (string)$_SERVER[$name];
    return fi_env_read(__DIR__ . '/.env', $name);
}

/**
 * Parse a simple .env file and return the value for $key.
 * Supports KEY=value, "quoted values", and # comments.
 * Returns '' if not found or file is missing.
 */
function fi_env_read(string $path, string $key): string {
    global $fiEnvCache;
    if ($fiEnvCache === null) {
        $fiEnvCache = [];
        if (is_readable($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') continue;
                $eq = strpos($line, '=');
                if ($eq === false) continue;
                $k = trim(substr($line, 0, $eq));
                $v = trim(substr($line, $eq + 1));
                // strip surrounding quotes
                if (strlen($v) >= 2 && (($v[0] === '"' && substr($v, -1) === '"') || ($v[0] === "'" && substr($v, -1) === "'"))) {
                    $v = substr($v, 1, -1);
                }
                $fiEnvCache[$k] = $v;
            }
        }
    }
    return $fiEnvCache[$key] ?? '';
}

function client_ip(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $k) {
        if (!empty($_SERVER[$k])) {
            $ip = trim(explode(',', $_SERVER[$k])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

/**
 * Simple per-session rate limit using a JSON file.
 *  - 30 chat requests / 10 minutes per session
 *  - 10 lead submissions / 10 minutes per session
 *  - pings are not counted
 */
function enforce_rate_limit(string $sessionId, string $type): array {
    $limitChat = 30;
    $limitLead = 10;
    $windowSec = 600;
    $file = __DIR__ . '/rate-limit.json';

    $now = time();
    $store = [];
    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        $decoded = $raw ? json_decode($raw, true) : null;
        if (is_array($decoded)) $store = $decoded;
    }
    // Garbage-collect old entries
    foreach ($store as $k => $entry) {
        if (($entry['expires'] ?? 0) < $now) unset($store[$k]);
    }
    $key = $sessionId . '|' . substr((string)($_SERVER['REQUEST_URI'] ?? ''), 0, 80);
    $cur = $store[$key] ?? ['chat' => 0, 'lead' => 0, 'expires' => $now + $windowSec];

    if ($type === 'chat') {
        $cur['chat']++;
        if ($cur['chat'] > $limitChat) {
            return ['blocked' => true, 'message' => 'Too many questions in a short window. Please try again in a few minutes.'];
        }
    } elseif ($type === 'lead') {
        $cur['lead']++;
        if ($cur['lead'] > $limitLead) {
            return ['blocked' => true, 'message' => 'Too many lead submissions. Please try again shortly.'];
        }
    } else {
        // ping: do not count toward limits, but refresh expiry
        $cur['expires'] = $now + $windowSec;
    }
    $store[$key] = $cur;
    @file_put_contents($file, json_encode($store), LOCK_EX);
    return ['blocked' => false];
}
