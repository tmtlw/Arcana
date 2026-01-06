<?php
session_start();
require_once 'config.php';

// PHP Beépített Szerver Támogatás (php -S)
// Ha a kért fájl létezik (pl. css, js, képek), szolgálja ki azt közvetlenül.
if (php_sapi_name() === 'cli-server') {
    $file = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (is_file($file)) {
        return false;
    }
}

// Router logika
$request = $_SERVER['REQUEST_URI'];
// Eltávolítjuk a query stringet
$parsedUrl = parse_url($request);
$path = trim($parsedUrl['path'], '/'); // Vezető és záró perjelek eltávolítása

// Ha a projekt alkönyvtárban van (pl. localhost/tarot/), azt le kell vágni.
// Jelenleg feltételezzük a gyökérkönyvtárat, de ha nem ott van:
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
if ($scriptName !== '/' && $scriptName !== '\\') {
    $scriptName = trim($scriptName, '/\\');
    if (strpos($path, $scriptName) === 0) {
        $path = substr($path, strlen($scriptName));
        $path = trim($path, '/');
    }
}

// URL Kezelés (PathInfo támogatás a jobb kompatibilitásért)
$scriptName = $_SERVER['SCRIPT_NAME']; // pl. /tarot/index.php
$requestUri = $_SERVER['REQUEST_URI']; // pl. /tarot/index.php/dashboard

// Base URL (eszközökhöz, pl. css) -> /tarot
$baseUrl = dirname($scriptName);
if ($baseUrl === '/' || $baseUrl === '\\') $baseUrl = '';

// App URL (linkekhez) -> /tarot/index.php
$appUrl = $scriptName;

// Útvonal meghatározása (PathInfo vagy Request URI alapján)
$path = '';
if (isset($_SERVER['PATH_INFO'])) {
    $path = trim($_SERVER['PATH_INFO'], '/');
} else {
    // Ha nincs PATH_INFO (pl. php -S), manuálisan vágjuk le
    $path = str_replace($scriptName, '', $requestUri);
    $path = strtok($path, '?');
    $path = trim($path, '/');

    // Ha a gyökérben vagyunk és nincs index.php a kérésben (pl. /tarot/dashboard)
    // Ez csak akkor működik, ha van .htaccess, de itt most a fallback a cél.
    if (strpos($requestUri, $scriptName) === false) {
        // Próbáljuk kitalálni a path-t a base könyvtárhoz képest
        $baseDir = dirname($scriptName);
        if (strpos($requestUri, $baseDir) === 0) {
            $path = substr($requestUri, strlen($baseDir));
            $path = trim($path, '/');
        }
    }
}

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
    header("Location: $appUrl/login");
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
