<?php
/**
 * Közös biztonsági réteg a PHP végpontokhoz:
 *  - konfiguráció (config.php vagy környezeti változók, SOHA nem a repóban)
 *  - szigorú CORS
 *  - Firebase ID token ellenőrzés (RS256, Google nyilvános tanúsítványok)
 *  - admin jogosultság e-mail allowlist alapján
 */

const TAROT_FIREBASE_PROJECT_ID = 'misztikustarot-c4002';

function tarot_config(string $key, $default = null) {
    static $cfg = null;
    if ($cfg === null) {
        $cfg = [];
        $file = __DIR__ . '/../config.php';
        if (is_file($file)) {
            $loaded = require $file;
            if (is_array($loaded)) $cfg = $loaded;
        }
    }
    if (isset($cfg[$key])) return $cfg[$key];
    $env = getenv('TAROT_' . strtoupper($key));
    return $env !== false && $env !== '' ? $env : $default;
}

function tarot_json_exit(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

/** Szigorú CORS: csak a konfigurált origin(ek) kapnak engedélyt; alapból csak same-origin. */
function tarot_cors(array $methods = ['GET', 'POST']): void {
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');

    $allowed = array_filter(array_map('trim', explode(',', (string) tarot_config('allowed_origins', ''))));
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: ' . implode(', ', $methods) . ', OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function tarot_require_method(string $method): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        tarot_json_exit(405, ['status' => 'error', 'error' => 'Method not allowed']);
    }
}

function tarot_bearer_token(): string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strtolower($k) === 'authorization') { $h = $v; break; }
        }
    }
    return preg_match('/^Bearer\s+(.+)$/i', $h, $m) ? trim($m[1]) : '';
}

function tarot_b64url_decode(string $s): string {
    return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4), true) ?: '';
}

/** Google tanúsítványok (kid => PEM), fájl-gyorsítótárral. */
function tarot_google_certs(): array {
    $cacheFile = sys_get_temp_dir() . '/tarot_fb_certs.json';
    if (is_file($cacheFile) && filemtime($cacheFile) > time() - 3600) {
        $c = json_decode((string) file_get_contents($cacheFile), true);
        if (is_array($c) && $c) return $c;
    }
    $ch = curl_init('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => true]);
    $raw = curl_exec($ch);
    curl_close($ch);
    $certs = json_decode((string) $raw, true);
    if (!is_array($certs) || !$certs) {
        if (is_file($cacheFile)) { // lejárt, de jobb mint a semmi
            $c = json_decode((string) file_get_contents($cacheFile), true);
            if (is_array($c)) return $c;
        }
        return [];
    }
    @file_put_contents($cacheFile, json_encode($certs), LOCK_EX);
    return $certs;
}

/** Visszaadja az ellenőrzött token claim-eket, vagy null-t. */
function tarot_verify_id_token(string $jwt): ?array {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return null;
    $header = json_decode(tarot_b64url_decode($parts[0]), true);
    $claims = json_decode(tarot_b64url_decode($parts[1]), true);
    $sig = tarot_b64url_decode($parts[2]);
    if (!is_array($header) || !is_array($claims) || $sig === '') return null;
    if (($header['alg'] ?? '') !== 'RS256' || empty($header['kid'])) return null;

    $certs = tarot_google_certs();
    $pem = $certs[$header['kid']] ?? null;
    if (!$pem) return null;
    $key = openssl_pkey_get_public($pem);
    if (!$key || openssl_verify($parts[0] . '.' . $parts[1], $sig, $key, OPENSSL_ALGO_SHA256) !== 1) return null;

    $now = time();
    $pid = TAROT_FIREBASE_PROJECT_ID;
    if (($claims['aud'] ?? '') !== $pid) return null;
    if (($claims['iss'] ?? '') !== "https://securetoken.google.com/$pid") return null;
    if (($claims['exp'] ?? 0) < $now || ($claims['iat'] ?? PHP_INT_MAX) > $now + 60) return null;
    if (empty($claims['sub'])) return null;
    return $claims;
}

/** Bejelentkezett felhasználó kötelező. */
function tarot_require_user(): array {
    $claims = tarot_verify_id_token(tarot_bearer_token());
    if (!$claims) tarot_json_exit(401, ['status' => 'error', 'error' => 'Unauthorized']);
    return $claims;
}

/** Admin kötelező: ellenőrzött e-mail, ami szerepel a konfigurált allowlistben. */
function tarot_require_admin(): array {
    $claims = tarot_require_user();
    $admins = array_filter(array_map('strtolower', array_map('trim', explode(',', (string) tarot_config('admin_emails', '')))));
    $email = strtolower($claims['email'] ?? '');
    if ($email === '' || empty($claims['email_verified']) || !in_array($email, $admins, true)) {
        tarot_json_exit(403, ['status' => 'error', 'error' => 'Forbidden']);
    }
    return $claims;
}
