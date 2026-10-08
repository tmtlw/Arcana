<?php
require __DIR__ . '/lib/bootstrap.php';
tarot_cors(['GET', 'POST']);

// Csak ellenőrzött Firebase ID tokennel rendelkező, allowlistes admin használhatja.
tarot_require_admin();

$action = $_GET['action'] ?? '';
$file = $_GET['file'] ?? '';

// Whitelist: csak a tartalmi mappák .ts fájljai, pontosan két szint.
$ALLOWED_DIRS = ['cards', 'constants', 'lessons'];
$BASE_DIR = realpath(__DIR__);

function is_allowed($path) {
    global $ALLOWED_DIRS;
    return is_string($path)
        && preg_match('#^(' . implode('|', $ALLOWED_DIRS) . ')/[A-Za-z0-9_-]+\.ts$#', $path) === 1;
}

if ($action === 'read') {
    if (!is_allowed($file)) {
        tarot_json_exit(400, ['error' => 'Invalid file path']);
    }
    $fullPath = $BASE_DIR . '/' . $file;
    if (is_file($fullPath)) {
        echo json_encode(['content' => file_get_contents($fullPath)]);
    } else {
        tarot_json_exit(404, ['error' => 'File not found']);
    }
}
elseif ($action === 'write') {
    tarot_require_method('POST');
    $input = json_decode(file_get_contents('php://input'), true);
    $content = is_array($input) && isset($input['content']) && is_string($input['content']) ? $input['content'] : null;

    if (!is_allowed($file)) {
        tarot_json_exit(400, ['error' => 'Invalid file path']);
    }
    if ($content === null || strlen($content) > 2 * 1024 * 1024) {
        tarot_json_exit(400, ['error' => 'Invalid content']);
    }

    $fullPath = $BASE_DIR . '/' . $file;
    $backupName = null;

    // Create Backup
    if (is_file($fullPath)) {
        $backupName = basename($fullPath) . '.bak.' . date('Y-m-d_H-i-s');
        copy($fullPath, dirname($fullPath) . '/' . $backupName);
    }

    if (file_put_contents($fullPath, $content, LOCK_EX) !== false) {
        echo json_encode(['success' => true, 'backup' => $backupName]);
    } else {
        tarot_json_exit(500, ['error' => 'Write failed']);
    }
}
else {
    tarot_json_exit(400, ['error' => 'Invalid action']);
}
