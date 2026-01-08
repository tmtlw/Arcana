<?php
/**
 * Misztikus Tarot Napló - Astro API
 * Precíz csillagászati számítások (Meeus algoritmusok alapján egyszerűsítve).
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// --- Segédfüggvények ---

class AstroCalc {

    // Konvertálás Dátum -> Julian Date
    public static function toJulian($year, $month, $day, $hour=12, $minute=0, $second=0) {
        if ($month <= 2) {
            $year -= 1;
            $month += 12;
        }
        $A = floor($year / 100);
        $B = 2 - $A + floor($A / 4);
        $JD = floor(365.25 * ($year + 4716)) + floor(30.6001 * ($month + 1)) + $day + $B - 1524.5;
        $fraction = ($hour + $minute / 60 + $second / 3600) / 24;
        return $JD + $fraction;
    }

    // Nap pozíciója (Ecliptic Longitude)
    public static function getSunPosition($jd) {
        $D = $jd - 2451545.0;
        $g = (357.529 + 0.98560028 * $D) % 360;
        $q = (280.459 + 0.98564736 * $D) % 360;
        $L = ($q + 1.915 * sin(deg2rad($g)) + 0.020 * sin(deg2rad(2 * $g))) % 360;
        if ($L < 0) $L += 360;
        return $L;
    }

    // Hold pozíciója és fázisa
    public static function getMoonData($jd) {
        $D = $jd - 2451545.0; // Napok száma J2000.0 óta

        // Mean longitude of Moon
        $L = (218.316 + 13.176396 * $D) % 360;
        // Mean anomaly of Moon
        $M = (134.963 + 13.064993 * $D) % 360;
        // Mean distance of Moon from ascending node
        $F = (93.272 + 13.229350 * $D) % 360;

        $l_rad = deg2rad($L);
        $m_rad = deg2rad($M);
        $f_rad = deg2rad($F);

        // Longitude calculation (Simplified)
        $lambda = $L + 6.289 * sin($m_rad);
        $lambda %= 360;
        if ($lambda < 0) $lambda += 360;

        // Phase calculation
        // Sun mean anomaly
        $SunM = (357.529 + 0.98560028 * $D) % 360;
        // Moon elongation
        $D_elong = (297.850 + 12.190749 * $D) % 360;

        $elongRad = deg2rad($D_elong);
        $sunMRad = deg2rad($SunM);

        // Accurate Phase Angle (i)
        // i = 180 - D - 6.289 * sin(M') + 2.100 * sin(M) - 1.274 * sin(2D - M') ...
        // Egyszerűsítve: Használjuk a megvilágítottsági képletet (illumination fraction k)
        // k = (1 + cos(i)) / 2
        // A fázisszög közelítőleg 180 - D (elongáció)

        // Elongáció finomítása
        $elongation = $D_elong
             - 6.289 * sin($m_rad)
             + 2.100 * sin($sunMRad)
             - 1.274 * sin(deg2rad(2 * $D_elong - $M))
             - 0.658 * sin(deg2rad(2 * $D_elong));

        $elongation %= 360;
        if ($elongation < 0) $elongation += 360;

        // Fázis (0.0 - 1.0, ahol 0=Új, 0.5=Negyed, 1.0=Tele)
        // Ez az "Age" alapján nem pontos, az elongáció jobb.
        // Elongáció 0 -> Új, 180 -> Tele.
        $phaseAge = $elongation / 360; // 0..1

        // Megvilágítottság %
        // i = 180 - elongáció (kb)
        // k = (1 + cos(180 - elong)) / 2 = (1 - cos(elong)) / 2
        $illumination = (1 - cos(deg2rad($elongation))) / 2;

        return [
            'longitude' => $lambda,
            'elongation' => $elongation,
            'illumination' => $illumination,
            'phase_value' => $phaseAge // 0..1 ciklus
        ];
    }

    public static function getZodiacSign($longitude) {
        $signs = ["Kos", "Bika", "Ikrek", "Rák", "Oroszlán", "Szűz", "Mérleg", "Skorpió", "Nyilas", "Bak", "Vízöntő", "Halak"];
        $index = floor($longitude / 30);
        return $signs[$index % 12];
    }

    public static function getPhaseName($elongation) {
        // Elongáció: 0-360 fok
        // 0: Újhold
        // 90: Első negyed
        // 180: Telihold
        // 270: Utolsó negyed

        // Tűréshatár a pontos fázisokhoz (fok)
        $tolerance = 5;

        if ($elongation < $tolerance || $elongation > 360 - $tolerance) return ["Újhold", "🌑"];
        if ($elongation < 90 - $tolerance) return ["Növekvő Holdsarló", "🌒"];
        if ($elongation >= 90 - $tolerance && $elongation <= 90 + $tolerance) return ["Első Negyed", "🌓"];
        if ($elongation < 180 - $tolerance) return ["Növekvő Hold", "🌔"];
        if ($elongation >= 180 - $tolerance && $elongation <= 180 + $tolerance) return ["Telihold", "🌕"];
        if ($elongation < 270 - $tolerance) return ["Fogyó Hold", "🌖"];
        if ($elongation >= 270 - $tolerance && $elongation <= 270 + $tolerance) return ["Utolsó Negyed", "🌗"];
        return ["Fogyó Holdsarló", "🌘"];
    }
}

// --- Fő Logika ---

$action = $_GET['action'] ?? 'get_astro';
$dateStr = $_GET['date'] ?? date('Y-m-d');
$lat = floatval($_GET['lat'] ?? 47.4979);
$lng = floatval($_GET['lng'] ?? 19.0402);

try {
    $date = new DateTime($dateStr);
    $jd = AstroCalc::toJulian(
        (int)$date->format('Y'),
        (int)$date->format('m'),
        (int)$date->format('d'),
        (int)$date->format('H'),
        (int)$date->format('i')
    );

    // Számítások
    $sunL = AstroCalc::getSunPosition($jd);
    $moonData = AstroCalc::getMoonData($jd);

    $sunSign = AstroCalc::getZodiacSign($sunL);
    $moonSign = AstroCalc::getZodiacSign($moonData['longitude']);

    list($phaseName, $phaseIcon) = AstroCalc::getPhaseName($moonData['elongation']);

    // Egyéb számítások (Ascendens - egyszerűsítve, PHP-ban is meg kéne írni ha pontosabbat akarunk, de JS-ben már van)
    // Most visszaadjuk a precíz adatokat a JS-nek

    echo json_encode([
        'status' => 'success',
        'data' => [
            'date' => $dateStr,
            'jd' => $jd,
            'sun' => [
                'longitude' => $sunL,
                'sign' => $sunSign
            ],
            'moon' => [
                'longitude' => $moonData['longitude'],
                'sign' => $moonSign,
                'elongation' => $moonData['elongation'],
                'illumination' => $moonData['illumination'],
                'phase_name' => $phaseName,
                'icon' => $phaseIcon
            ],
            'message' => 'Precíz adatok számítva (PHP)'
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
