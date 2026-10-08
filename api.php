<?php
/**
 * Univerzális mentő API – kizárólag adminnak.
 * Biztonság: Firebase ID token + admin allowlist, kiterjesztés whitelist, realpath ellenőrzés.
 */
require __DIR__ . '/lib/bootstrap.php';
tarot_cors(['POST']);
tarot_require_method('POST');
tarot_require_admin();

$baseDir = __DIR__ . '/storage/';
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0755, true);
}
$baseReal = realpath($baseDir);

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    tarot_json_exit(400, ['status' => 'error', 'message' => 'Nincs ervenyes JSON adat.']);
}

$targetPath = is_string($data['path'] ?? null) ? $data['path'] : '';
$fileName   = is_string($data['filename'] ?? null) ? $data['filename'] : '';
$content    = is_string($data['content'] ?? null) ? $data['content'] : '';
$isBase64   = !empty($data['base64']);

// Csak ártalmatlan kiterjesztések (SOHA nem futtatható szerveroldali kód)
$ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp3', 'ogg', 'json', 'txt'];
$cleanFileName = basename($fileName);
$ext = strtolower(pathinfo($cleanFileName, PATHINFO_EXTENSION));
if (!preg_match('/^[A-Za-z0-9._-]+$/', $cleanFileName) || !in_array($ext, $ALLOWED_EXT, true)) {
    tarot_json_exit(400, ['status' => 'error', 'message' => 'Nem engedelyezett fajlnev vagy kiterjesztes.']);
}

// Útvonal: csak betű/szám/_/-/ szegmensek, ".." nélkül
$segments = array_values(array_filter(explode('/', $targetPath), 'strlen'));
foreach ($segments as $seg) {
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $seg)) {
        tarot_json_exit(400, ['status' => 'error', 'message' => 'Ervenytelen utvonal.']);
    }
}
$fullPath = rtrim($baseReal . '/' . implode('/', $segments), '/') . '/';
if (!is_dir($fullPath) && !mkdir($fullPath, 0755, true)) {
    tarot_json_exit(500, ['status' => 'error', 'message' => 'Mappa letrehozasa sikertelen.']);
}
$real = realpath($fullPath);
if ($real === false || strpos($real . '/', $baseReal . '/') !== 0) {
    tarot_json_exit(400, ['status' => 'error', 'message' => 'Ervenytelen utvonal.']);
}

$fileData = $isBase64 ? base64_decode($content, true) : $content;
if ($fileData === false || strlen($fileData) > 10 * 1024 * 1024) {
    tarot_json_exit(400, ['status' => 'error', 'message' => 'Ervenytelen vagy tul nagy tartalom.']);
}

if (file_put_contents($real . '/' . $cleanFileName, $fileData, LOCK_EX) !== false) {
    echo json_encode(['status' => 'success', 'message' => 'Fajl mentve']);
} else {
    tarot_json_exit(500, ['status' => 'error', 'message' => 'Iras hiba a szerveren.']);
}
