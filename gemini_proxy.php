<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);
$image = isset($input['image']) ? $input['image'] : '';
$apiKey = isset($input['apiKey']) ? $input['apiKey'] : '';

if (!$image || !$apiKey) {
    echo json_encode(['error' => 'Missing image or API key']);
    exit;
}

// Clean base64 header if present
if (strpos($image, 'base64,') !== false) {
    $image = explode('base64,', $image)[1];
}

$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

$prompt = "Analyze this Tarot spread image. Identify the spread positions (numbered 1, 2, etc.) and their descriptions.
Translate the position names and descriptions to Hungarian.
Estimate the x and y coordinates for each position on a 0-100 grid (where x=0 is left, x=100 is right, y=0 is top, y=100 is bottom).
Return ONLY a valid JSON object with this structure:
{
  \"name\": \"Spread Name (Hungarian)\",
  \"description\": \"Brief description (Hungarian)\",
  \"positions\": [
    { \"id\": 1, \"name\": \"Position Name\", \"description\": \"Description\", \"x\": 50, \"y\": 50 }
  ]
}";

$data = [
    "contents" => [
        [
            "parts" => [
                ["text" => $prompt],
                [
                    "inline_data" => [
                        "mime_type" => "image/jpeg",
                        "data" => $image
                    ]
                ]
            ]
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['error' => 'Gemini API Error: ' . $httpCode, 'details' => $response]);
    exit;
}

$jsonResponse = json_decode($response, true);
$text = $jsonResponse['candidates'][0]['content']['parts'][0]['text'] ?? '';

// Extract JSON from markdown code block if present
if (preg_match('/```json\s*(\{.*\})\s*```/s', $text, $matches)) {
    $text = $matches[1];
}

echo $text;
?>
