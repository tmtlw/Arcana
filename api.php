<?php
/**
 * Asana & Kitsune - Universal Save API
 * Csak a mentésért felelős modul.
 */

header('Content-Type: application/json');

// --- BIZTONSÁGI KONFIGURÁCIÓ ---
// Ezt a titkos kulcsot a kliensnek is ismernie kell (pl. .env változóból vagy hardcoded)
// Éles környezetben ezt változtasd meg!
define('UPDATE_SECRET', 'MisztikusTarot2024UpdateKey');

// --- ADATOK FOGADÁSA ---
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'Nincs ervenyes JSON adat.']);
    exit;
}

// --- KONFIGURÁCIÓ ---
// Biztonsági okokból érdemes megadni egy bázis könyvtárat, amin kívülre nem menthet.
$baseDir = __DIR__ . '/storage/';

// JULES UPDATE: System Update Logic
// Csak akkor engedélyezzük a gyökérbe írást, ha a titkos kulcs egyezik
$isSystemUpdate = isset($data['is_system_update']) && $data['is_system_update'] === true;
$providedSecret = $data['secret'] ?? '';

if ($isSystemUpdate) {
    if ($providedSecret === UPDATE_SECRET) {
        $baseDir = __DIR__ . '/';
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid update secret.']);
        exit;
    }
}

// Ha nem létezik a bázis könyvtár, létrehozzuk
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0755, true);
}

$targetPath = $data['path'] ?? '';     // pl. "tarot/major"
$fileName   = $data['filename'] ?? ''; // pl. "major-0.jpg"
$content    = $data['content'] ?? '';  // a fájl tartalma (lehet raw text vagy base64)
$isBase64   = $data['base64'] ?? false; // jelző, ha bináris adat jön

// --- BIZTONSÁGI ELLENŐRZÉS ---
// Megakadályozzuk, hogy a "../" jelekkel kijusson a megengedett mappából
$cleanFileName = basename($fileName);
$cleanPath = str_replace('..', '', $targetPath);
$fullPath = rtrim($baseDir . $cleanPath, '/') . '/';

// Mappa létrehozása, ha még nincs
if (!is_dir($fullPath)) {
    mkdir($fullPath, 0755, true);
}

$finalFile = $fullPath . $cleanFileName;

// --- MENTÉS ---
try {
    $fileData = $isBase64 ? base64_decode($content) : $content;

    if (file_put_contents($finalFile, $fileData)) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Fajl mentve',
            'path' => $finalFile
        ]);
    } else {
        throw new Exception('Iras hiba a szerveren.');
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}