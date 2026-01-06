<?php
// api/auth.php

function login() {
    $data = json_decode(file_get_contents('php://input'), true);
    $pdo = getDB();

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$data['username'], $data['username']]);
    $user = $stmt->fetch();

    if ($user && password_verify($data['password'], $user['password_hash'])) {
        $_SESSION['user'] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'level' => $user['level'],
            'xp' => $user['xp']
        ];
        echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Hibás felhasználónév vagy jelszó']);
    }
}

function register() {
    $data = json_decode(file_get_contents('php://input'), true);
    $pdo = getDB();

    // Validáció (egyszerűsített)
    if (empty($data['username']) || empty($data['password']) || empty($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Minden mező kötelező']);
        return;
    }

    $hash = password_hash($data['password'], PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$data['username'], $data['email'], $hash]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['error' => 'A felhasználónév vagy email már foglalt.']);
    }
}
?>
