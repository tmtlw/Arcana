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
        $opts = [
            "http" => [
                "method" => "GET",
                "header" => "User-Agent: MisztikusTarotUpdater\r\n"
            ]
        ];
        $context = stream_context_create($opts);
        $githubDataRaw = @file_get_contents($GITHUB_API_URL, false, $context);

        if (!$githubDataRaw) {
            throw new Exception("Nem sikerült elérni a GitHub API-t.");
        }

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
        $opts = [
            "http" => [
                "method" => "GET",
                "header" => "User-Agent: MisztikusTarotUpdater\r\n"
            ]
        ];
        $context = stream_context_create($opts);

        if (!copy($GITHUB_ZIP_URL, $zipFile, $context)) {
             throw new Exception("Nem sikerült letölteni a frissítést.");
        }

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

            // F. Buildelés (opcionális, ha van npm)
            $buildOutput = [];
            $buildStatus = -1;
            // Megpróbáljuk futtatni a buildet, ha van package.json
            if (file_exists(__DIR__ . '/package.json')) {
                 // Ez veszélyes lehet és sokáig tarthat, shared hostingon gyakran tiltott
                 // exec("npm install && npm run build", $buildOutput, $buildStatus);
            }

            // G. Verzió frissítése
            $githubDataRaw = @file_get_contents($GITHUB_API_URL, false, $context);
            $githubData = json_decode($githubDataRaw, true);
            $remoteSha = $githubData['sha'] ?? 'unknown';

            $newVersionData = [
                'version' => date('Y.m.d'),
                'commit_sha' => $remoteSha,
                'last_update' => $timestamp,
                'build_info' => ($buildStatus === 0) ? 'Build successful' : 'Build skipped/failed'
            ];
            file_put_contents($VERSION_FILE, json_encode($newVersionData, JSON_PRETTY_PRINT));

            $response = [
                'status' => 'success',
                'message' => 'Frissítés sikeres! (Build: ' . (($buildStatus === 0) ? 'OK' : 'Skipped') . ')',
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
