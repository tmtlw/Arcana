<?php
// config.php - Adatbázis konfiguráció

define('DB_HOST', 'localhost');
define('DB_NAME', 'misztikus_tarot');
define('DB_USER', 'root');
define('DB_PASS', '');

// Rendszerfrissítési titkos kulcs (Változtasd meg éles környezetben!)
define('UPDATE_SECRET', 'MisztikusTarot2024UpdateKey');

// PDO kapcsolat létrehozása
function getDB() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // Ha az adatbázis nem létezik, próbáljunk meg csatlakozni szerverhez db nélkül
        if ($e->getCode() == 1049) {
             try {
                $dsn_no_db = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
                $pdo = new PDO($dsn_no_db, DB_USER, DB_PASS, $options);
                // Adatbázis létrehozása
                $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
                return new PDO($dsn, DB_USER, DB_PASS, $options);
             } catch (PDOException $ex) {
                 die("Adatbázis kapcsolódási hiba: " . $ex->getMessage());
             }
        }
        die("Adatbázis hiba: " . $e->getMessage());
    }
}
?>
