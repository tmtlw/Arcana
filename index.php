<?php
session_start();
require_once 'config.php';

// Egyszerű router
$request = $_SERVER['REQUEST_URI'];
$basePath = '/'; // Ha alkönyvtárban van, ide kell írni
$path = str_replace($basePath, '', $request);
$path = strtok($path, '?'); // Query string levágása

// API Végpontok
if (strpos($path, 'api/') === 0) {
    header('Content-Type: application/json');
    $apiPath = substr($path, 4);

    // API Router
    switch ($apiPath) {
        case 'auth/login':
            require 'api/auth.php';
            login();
            break;
        case 'auth/register':
            require 'api/auth.php';
            register();
            break;
        case 'auth/logout':
            session_destroy();
            echo json_encode(['success' => true]);
            break;
        case 'cards':
            require 'api/cards.php';
            getCards();
            break;
        case 'readings':
            require 'api/readings.php';
            handleReadings();
            break;
        case 'update': // Frissítési végpont
            require 'api/update.php';
            break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'API végpont nem található']);
    }
    exit;
}

// Frontend Routing
// Ha nincs bejelentkezve, login oldalra irányít (kivéve auth oldalak)
$user = $_SESSION['user'] ?? null;

$view = 'dashboard';
if ($path == 'login' || $path == 'register') {
    $view = $path;
} elseif (!$user) {
    header('Location: /login');
    exit;
} else {
    // Engedélyezett oldalak bejelentkezett felhasználóknak
    $allowedViews = ['dashboard', 'history', 'library', 'reading', 'profile', 'admin'];
    if (in_array($path, $allowedViews)) {
        $view = $path;
    }
}

// Template betöltése
require 'views/layout.php';
?>
