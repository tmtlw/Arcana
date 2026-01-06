<?php
// api/update.php
// Ez a fájl kezeli a rendszerfrissítéseket (fájlok felülírása).

header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'Nincs ervenyes JSON adat.']);
    exit;
}

$isSystemUpdate = isset($data['is_system_update']) && $data['is_system_update'] === true;
$providedSecret = $data['secret'] ?? '';

// Csak akkor engedélyezzük, ha a titkos kulcs helyes
if ($isSystemUpdate && $providedSecret === UPDATE_SECRET) {
    // Gyökérkönyvtár elérése (feltételezve, hogy az api/ mappa a gyökérben van)
    $baseDir = __DIR__ . '/../';
} else {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid update secret.']);
    exit;
}

$targetPath = $data['path'] ?? '';
$fileName   = $data['filename'] ?? '';
$content    = $data['content'] ?? '';

// Útvonal tisztítása (biztonság)
$cleanFileName = basename($fileName);
// Megengedjük az alkönyvtárakat, de ".." nélkül
$cleanPath = str_replace('..', '', $targetPath);

// Teljes útvonal
// Ha a path üres, akkor a gyökérbe ment
$fullPathDir = rtrim($baseDir . $cleanPath, '/');

if (!is_dir($fullPathDir)) {
    mkdir($fullPathDir, 0755, true);
}

$finalFile = $fullPathDir . '/' . $cleanFileName;

try {
    if (file_put_contents($finalFile, $content)) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Fajl mentve',
            'path' => $finalFile
        ]);
    } else {
        throw new Exception('Iras hiba a szerveren.');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
