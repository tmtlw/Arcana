<?php
// api/cards.php

function getCards() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT * FROM cards");
    $cards = $stmt->fetchAll();

    // JSON mezők dekódolása
    foreach ($cards as &$card) {
        $card['keywords'] = json_decode($card['keywords_json'] ?? '[]');
        unset($card['keywords_json']);
    }

    echo json_encode($cards);
}
?>
