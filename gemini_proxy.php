<?php
require __DIR__ . '/lib/bootstrap.php';
tarot_cors(['POST']);
tarot_require_method('POST');
$user = tarot_require_user();

// Egyszerű, felhasználónkénti korlátozás (10 hívás / perc), fájl alapú.
$rlFile = sys_get_temp_dir() . '/tarot_rl_' . hash('sha256', $user['sub']) . '.json';
$now = time();
$hits = is_file($rlFile) ? (json_decode((string) file_get_contents($rlFile), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => $t > $now - 60));
if (count($hits) >= 10) {
    tarot_json_exit(429, ['error' => 'Too many requests']);
}
$hits[] = $now;
@file_put_contents($rlFile, json_encode($hits), LOCK_EX);

$apiKey = (string) tarot_config('gemini_api_key', '');
if ($apiKey === '') {
    tarot_json_exit(503, ['error' => 'AI service is not configured']);
}

$input = json_decode(file_get_contents('php://input'), true);
$image = is_array($input) && isset($input['image']) && is_string($input['image']) ? $input['image'] : '';
$lang  = is_array($input) && ($input['lang'] ?? '') === 'en' ? 'English' : 'Hungarian';
$mime  = 'image/jpeg';

if (!$image) {
    tarot_json_exit(400, ['error' => 'Missing image']);
}
if (preg_match('#^data:(image/(?:jpeg|png|webp));base64,#', $image, $m)) {
    $mime = $m[1];
    $image = substr($image, strlen($m[0]));
}
if (!preg_match('#^[A-Za-z0-9+/=\s]+$#', $image) || strlen($image) > 8 * 1024 * 1024) {
    tarot_json_exit(400, ['error' => 'Invalid image']);
}

$prompt = "Analyze this Tarot spread image. Identify the spread positions (numbered 1, 2, etc.) and their descriptions.
Translate the position names and descriptions to $lang.
Estimate the x and y coordinates for each position on a 0-100 grid (where x=0 is left, x=100 is right, y=0 is top, y=100 is bottom).
Return ONLY a valid JSON object with this structure:
{
  \"name\": \"Spread Name ($lang)\",
  \"description\": \"Brief description ($lang)\",
  \"positions\": [
    { \"id\": 1, \"name\": \"Position Name\", \"description\": \"Description\", \"x\": 50, \"y\": 50 }
  ]
}";

$payload = json_encode([
    'contents' => [[
        'parts' => [
            ['text' => $prompt],
            ['inline_data' => ['mime_type' => $mime, 'data' => $image]],
        ],
    ]],
]);

// Modell fallback sorrend; a kulcs fejlécben megy, nem URL-ben (nem kerül naplóba).
$response = '';
$httpCode = 0;
foreach (['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] as $model) {
    $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-goog-api-key: ' . $apiKey],
        CURLOPT_TIMEOUT => 60,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($httpCode !== 404) break;
}

if ($httpCode !== 200) {
    // A részletes Google hibát csak naplózzuk, a kliensnek nem adjuk ki.
    error_log('gemini_proxy: upstream ' . $httpCode . ' ' . substr((string) $response, 0, 500));
    tarot_json_exit(502, ['error' => 'AI service error: ' . $httpCode]);
}

$jsonResponse = json_decode($response, true);
$text = $jsonResponse['candidates'][0]['content']['parts'][0]['text'] ?? '';

if (preg_match('/```json\s*(\{.*\})\s*```/s', $text, $matches)) {
    $text = $matches[1];
}
// Csak érvényes JSON mehet vissza
$decoded = json_decode($text, true);
if (!is_array($decoded)) {
    tarot_json_exit(502, ['error' => 'AI returned an invalid response']);
}
echo json_encode($decoded);
