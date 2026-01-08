<?php
/**
 * Misztikus Tarot Napló - Updater System
 * Ez a script kezeli a GitHub-ról történő frissítéseket és a biztonsági mentéseket.
 *
 * BIZTONSÁG:
 * A script használatához egy titkos kulcs (SECRET_KEY) szükséges, amelyet a kérések fejlécében
 * vagy paraméterként kell átadni.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type, X-Updater-Secret');

// --- KONFIGURÁCIÓ ---
$REPO_OWNER = 'tmtlw';
$REPO_NAME = 'Arcana';
$BRANCH = 'main';
$BACKUP_DIR = __DIR__ . '/backups/';
// Fontos mappák/fájlok, amiket nem törlünk frissítés előtt, kivéve ha a zip tartalmazza őket
$IGNORE_FILES = ['.git', 'backups', 'updater.php', 'version.json', 'storage', 'node_modules', '.env'];
$VERSION_FILE = __DIR__ . '/version.json';

// TITKOS KULCS - Ezt változtasd meg éles környezetben!
// A frontendnek is ismernie kell ezt a kulcsot.
$SECRET_KEY = 'tarot_secret_updater_key';

// GitHub API URL
$GITHUB_API_URL = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/commits/$BRANCH";
$GITHUB_ZIP_URL = "https://github.com/$REPO_OWNER/$REPO_NAME/archive/refs/heads/$BRANCH.zip";

// --- BIZTONSÁGI ELLENŐRZÉS ---
$requestSecret = $_SERVER['HTTP_X_UPDATER_SECRET'] ?? $_GET['secret'] ?? '';
if ($requestSecret !== $SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Hozzáférés megtagadva. Hibás biztonsági kulcs.']);
    exit;
}

// Segédfüggvény: cURL kérés
function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'MisztikusTarotUpdater');
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    // SSL hitelesítés kikapcsolása (csak fejlesztéshez vagy ha a szerver cert bundle hiányzik)
    // Élesben javasolt bekapcsolva hagyni!
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $data = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($data === false) {
        throw new Exception("cURL hiba: " . $error);
    }

    if ($httpCode >= 400) {
        throw new Exception("HTTP hiba: " . $httpCode);
    }

    return $data;
}

// Segédfüggvény: cURL letöltés
function downloadFile($url, $path) {
    $fp = fopen($path, 'w+');
    if ($fp === false) {
        throw new Exception("Nem sikerült megnyitni a célfájlt írásra: " . $path);
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_USERAGENT, 'MisztikusTarotUpdater');
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $exec = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);

    if ($exec === false) {
        throw new Exception("cURL letöltési hiba: " . $error);
    }

    if ($httpCode >= 400) {
        throw new Exception("HTTP letöltési hiba: " . $httpCode);
    }

    return true;
}

// Segédfüggvény: Rekurzív másolás
function recurseCopy($src, $dst) {
    $dir = opendir($src);
    @mkdir($dst);
    while(false !== ( $file = readdir($dir)) ) {
        if (( $file != '.' ) && ( $file != '..' )) {
            if ( is_dir($src . '/' . $file) ) {
                recurseCopy($src . '/' . $file, $dst . '/' . $file);
            }
            else {
                copy($src . '/' . $file, $dst . '/' . $file);
            }
        }
    }
    closedir($dir);
}

// Művelet kiválasztása
$action = $_GET['action'] ?? '';
$response = ['status' => 'error', 'message' => 'Ismeretlen művelet'];

try {
    // 1. Verzió ellenőrzés
    if ($action === 'check') {
        $githubDataRaw = fetchUrl($GITHUB_API_URL);

        $githubData = json_decode($githubDataRaw, true);
        $remoteSha = $githubData['sha'] ?? null;

        $localData = ['commit_sha' => 'unknown'];
        if (file_exists($VERSION_FILE)) {
            $localData = json_decode(file_get_contents($VERSION_FILE), true);
        }

        $hasUpdate = ($remoteSha && $remoteSha !== ($localData['commit_sha'] ?? ''));

        $response = [
            'status' => 'success',
            'has_update' => $hasUpdate,
            'local_sha' => $localData['commit_sha'] ?? 'unknown',
            'remote_sha' => $remoteSha,
            'message' => $hasUpdate ? 'Új frissítés elérhető!' : 'A rendszer naprakész.'
        ];
    }

    // 2. Frissítés végrehajtása
    elseif ($action === 'update') {
        // A. Backup
        if (!is_dir($BACKUP_DIR)) mkdir($BACKUP_DIR, 0755, true);
        $timestamp = date('Y-m-d_H-i-s');
        $currentBackupDir = $BACKUP_DIR . $timestamp;

        $rootFiles = array_diff(scandir(__DIR__), array('.', '..'));
        if (!mkdir($currentBackupDir, 0755, true)) {
             throw new Exception("Nem sikerült létrehozni a backup mappát.");
        }

        foreach ($rootFiles as $file) {
            if (in_array($file, $IGNORE_FILES)) continue;
            if (is_dir(__DIR__ . '/' . $file)) {
                recurseCopy(__DIR__ . '/' . $file, $currentBackupDir . '/' . $file);
            } else {
                copy(__DIR__ . '/' . $file, $currentBackupDir . '/' . $file);
            }
        }

        // B. Letöltés
        $zipFile = __DIR__ . '/update_temp.zip';
        downloadFile($GITHUB_ZIP_URL, $zipFile);

        // C. Kicsomagolás
        $zip = new ZipArchive;
        if ($zip->open($zipFile) === TRUE) {
            $extractPath = __DIR__ . '/update_temp_dir';
            if (!is_dir($extractPath)) mkdir($extractPath);

            $zip->extractTo($extractPath);
            $zip->close();

            $subDirs = array_diff(scandir($extractPath), array('.', '..'));
            $sourceDir = $extractPath . '/' . reset($subDirs);

            // D. Felülírás
            recurseCopy($sourceDir, __DIR__);

            // E. Takarítás
            recurseCopy($extractPath, __DIR__ . '/temp_del');
            unlink($zipFile);

            // G. Verzió frissítése
            $githubDataRaw = fetchUrl($GITHUB_API_URL);
            $githubData = json_decode($githubDataRaw, true);
            $remoteSha = $githubData['sha'] ?? 'unknown';

            $newVersionData = [
                'version' => date('Y.m.d'),
                'commit_sha' => $remoteSha,
                'last_update' => $timestamp
            ];
            file_put_contents($VERSION_FILE, json_encode($newVersionData, JSON_PRETTY_PRINT));

            $response = [
                'status' => 'success',
                'message' => 'Frissítés sikeres!',
                'backup_id' => $timestamp
            ];

        } else {
            throw new Exception("Nem sikerült megnyitni a letöltött zip fájlt.");
        }
    }

    // 3. Visszaállítás
    elseif ($action === 'restore') {
        $backupId = $_GET['id'] ?? '';
        if (!$backupId) throw new Exception("Nincs megadva backup azonosító.");

        $sourceBackup = $BACKUP_DIR . $backupId;
        if (!is_dir($sourceBackup)) throw new Exception("A megadott biztonsági mentés nem található.");

        recurseCopy($sourceBackup, __DIR__);

        $response = ['status' => 'success', 'message' => 'Visszaállítás sikeres: ' . $backupId];
    }

    // 4. Backup lista
    elseif ($action === 'list_backups') {
        $backups = [];
        if (is_dir($BACKUP_DIR)) {
            $dirs = array_diff(scandir($BACKUP_DIR), array('.', '..'));
            foreach ($dirs as $dir) {
                if (is_dir($BACKUP_DIR . $dir)) {
                    $backups[] = $dir;
                }
            }
        }
        $response = ['status' => 'success', 'backups' => array_values($backups)];
    }

} catch (Exception $e) {
    $response = ['status' => 'error', 'message' => $e->getMessage()];
}

echo json_encode($response);
