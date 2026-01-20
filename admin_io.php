<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Updater-Secret");
header("Content-Type: application/json");

// Load configuration for secret key
$config = [];
if (file_exists('version.json')) {
    $config = json_decode(file_get_contents('version.json'), true);
}
// Fallback or override if needed. In production, this should be secure.
$SECRET_KEY = isset($config['secret_key']) ? $config['secret_key'] : 'admin123';

// Validate Request
$headers = getallheaders();
$clientSecret = isset($headers['X-Updater-Secret']) ? $headers['X-Updater-Secret'] : '';
if ($clientSecret !== $SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$file = isset($_GET['file']) ? $_GET['file'] : '';

// Whitelist allowed directories/files for security
$ALLOWED_DIRS = ['cards', 'constants', 'lessons', 'langs'];
$BASE_DIR = __DIR__;

function is_allowed($path) {
    global $ALLOWED_DIRS;
    $parts = explode('/', $path);
    if (count($parts) < 2) return false;
    if (!in_array($parts[0], $ALLOWED_DIRS)) return false;
    if (strpos($path, '..') !== false) return false;
    if (substr($path, -3) !== '.ts') return false;
    return true;
}

if ($action === 'read') {
    if (!is_allowed($file)) {
        echo json_encode(['error' => 'Invalid file path']);
        exit;
    }
    $fullPath = $BASE_DIR . '/' . $file;
    if (file_exists($fullPath)) {
        echo json_encode(['content' => file_get_contents($fullPath)]);
    } else {
        echo json_encode(['error' => 'File not found']);
    }
}
elseif ($action === 'write') {
    $input = json_decode(file_get_contents('php://input'), true);
    $content = isset($input['content']) ? $input['content'] : '';

    if (!is_allowed($file)) {
        echo json_encode(['error' => 'Invalid file path']);
        exit;
    }

    $fullPath = $BASE_DIR . '/' . $file;

    // Create Backup
    if (file_exists($fullPath)) {
        $backupPath = $fullPath . '.bak.' . date('Y-m-d_H-i-s');
        copy($fullPath, $backupPath);
    }

    // Write File
    if (file_put_contents($fullPath, $content) !== false) {
        echo json_encode(['success' => true, 'backup' => basename($backupPath)]);
    } else {
        echo json_encode(['error' => 'Write failed']);
    }
}
elseif ($action === 'restore') {
    // Restore from backup functionality could be added here
    echo json_encode(['error' => 'Not implemented yet']);
}
else {
    echo json_encode(['error' => 'Invalid action']);
}
?>
