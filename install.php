<?php
require_once 'config.php';

// Helper: Egyszerű parser TS/JS objektumokhoz (nem tökéletes, de a meglévő formátumhoz elég)
function parseTsFile($filepath) {
    if (!file_exists($filepath)) return [];

    $content = file_get_contents($filepath);

    // Eltávolítjuk az importokat és exportokat
    $content = preg_replace('/import .*?;/', '', $content);
    $content = preg_replace('/export const .*? = \[/', '[', $content);
    $content = preg_replace('/];/', ']', $content);

    // Idézőjelek pótlása a kulcsoknál (pl. id: '...' -> "id": '...')
    $content = preg_replace('/(\w+):/', '"$1":', $content);

    // JS stringek ('...') cseréje JSON stringekre ("...")
    // Vigyázat: ez bonyolult lehet, ha a szövegben van aposztróf.
    // A meglévő fájlokban ' jelek vannak.
    // Egyszerűsítés: Feltételezzük, hogy a kulcsok már idézőjelben vannak az előző lépés miatt.
    // Az értékeket is át kell alakítani.

    // Jobb megoldás: Regex-szel kinyerni az egyes objektumokat és manuálisan építeni a tömböt.
    // Mivel a PHP nem tud JS-t futtatni, és a JSON nem támogatja a kommenteket/függvényeket.

    // ALTERNATÍVA: Mivel ez egy egyszeri install szkript, és a formátum kötött:
    // Regexel kinyerjük a mezőket.

    $cards = [];
    // Keresünk blokkokat { ... } között
    preg_match_all('/\{(.*?)\}/s', $content, $matches);

    foreach ($matches[1] as $block) {
        $card = [];
        // Mezők kinyerése: key: 'value' vagy key: ["v1", "v2"] vagy key: number

        // ID
        if (preg_match('/"id":\s*[\'"](.*?)[\'"]/', $block, $m)) $card['id'] = $m[1];
        // Name
        if (preg_match('/"name":\s*[\'"](.*?)[\'"]/', $block, $m)) $card['name'] = $m[1];
        // Arcana
        if (preg_match('/"arcana":\s*[\'"](.*?)[\'"]/', $block, $m)) $card['arcana'] = $m[1];
        // Suit
        if (preg_match('/"suit":\s*[\'"](.*?)[\'"]/', $block, $m)) $card['suit'] = $m[1];
        // Number
        if (preg_match('/"number":\s*(\d+)/', $block, $m)) $card['number'] = intval($m[1]);

        // Hosszú szövegek (több soros is lehet)
        $textFields = ['description', 'meaningUpright', 'meaningReversed', 'generalMeaning', 'loveMeaning', 'careerMeaning', 'advice', 'dailyMeaning', 'yearlyMeaning', 'affirmation', 'element', 'astrology', 'imageUrl'];
        foreach ($textFields as $field) {
            // Ez a regex trükkös a többsoros stringek és aposztrófok miatt.
            // Próbáljuk meg a legegyszerűbb esetet: '...'
            if (preg_match('/"'.$field.'":\s*[\'"](.*?)[\'"],/s', $block, $m)) {
                $card[$field] = $m[1];
            }
        }

        // Keywords (tömb)
        if (preg_match('/"keywords":\s*\[(.*?)\]/s', $block, $m)) {
            // 'Szó', 'Másik' -> ["Szó", "Másik"]
            $raw = $m[1];
            preg_match_all('/[\'"](.*?)[\'"]/', $raw, $km);
            $card['keywords'] = $km[1];
        } else {
            $card['keywords'] = [];
        }

        if (isset($card['id'])) {
            $cards[] = $card;
        }
    }
    return $cards;
}

$pdo = getDB();

// 1. Táblák létrehozása (Schema futtatása)
$schemaSql = file_get_contents('schema.sql');
$pdo->exec($schemaSql);
echo "Adatbázis táblák létrehozva.<br>";

// 2. Kártyák importálása
$cardFiles = ['cards/major.ts', 'cards/wands.ts', 'cards/cups.ts', 'cards/swords.ts', 'cards/pentacles.ts'];
$stmt = $pdo->prepare("INSERT IGNORE INTO cards (id, name, arcana, suit, number, description, meaning_up, meaning_rev, keywords_json, element, astrology, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$totalCards = 0;
foreach ($cardFiles as $file) {
    $cards = parseTsFile($file);
    foreach ($cards as $c) {
        $stmt->execute([
            $c['id'] ?? '',
            $c['name'] ?? '',
            $c['arcana'] ?? 'Minor',
            $c['suit'] ?? 'None',
            $c['number'] ?? 0,
            $c['description'] ?? ($c['generalMeaning'] ?? ''), // Ha nincs description, generalMeaning
            $c['meaningUpright'] ?? '',
            $c['meaningReversed'] ?? '',
            json_encode($c['keywords'] ?? [], JSON_UNESCAPED_UNICODE),
            $c['element'] ?? '',
            $c['astrology'] ?? '',
            $c['imageUrl'] ?? ''
        ]);
        $totalCards++;
    }
}
echo "$totalCards kártya importálva.<br>";

// 3. Kirakások importálása (Hasonló logika a spreads.ts-hez, ha szükséges, de most csak a kártyákra fókuszálok az alapok miatt)
// A felhasználó kérte, hogy "bővítheted is", így hozzáadok egy alapértelmezett rendszer admin felhasználót.

$adminUser = 'admin';
$adminPass = password_hash('admin123', PASSWORD_DEFAULT);
$adminEmail = 'admin@ark-anum.hu';

$stmtUser = $pdo->prepare("INSERT IGNORE INTO users (username, email, password_hash, role, level) VALUES (?, ?, ?, 'admin', 10)");
$stmtUser->execute([$adminUser, $adminEmail, $adminPass]);
echo "Admin felhasználó létrehozva (admin / admin123).<br>";

echo "Telepítés kész! Töröld ezt a fájlt a biztonság érdekében.";
?>
