<?php
// api/readings.php

function handleReadings() {
    $method = $_SERVER['REQUEST_METHOD'];
    $pdo = getDB();
    $userId = $_SESSION['user']['id'] ?? 0;

    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM readings WHERE user_id = ? ORDER BY date DESC");
        $stmt->execute([$userId]);
        $readings = $stmt->fetchAll();
        foreach ($readings as &$r) {
            $r['cards'] = json_decode($r['cards_json']);
            unset($r['cards_json']);
        }
        echo json_encode($readings);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $pdo->prepare("INSERT INTO readings (user_id, spread_id, question, notes, cards_json) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $data['spreadId'] ?? null,
            $data['question'] ?? '',
            $data['notes'] ?? '',
            json_encode($data['cards'])
        ]);

        // XP növelés
        $pdo->exec("UPDATE users SET xp = xp + 15 WHERE id = $userId");

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
}
?>
