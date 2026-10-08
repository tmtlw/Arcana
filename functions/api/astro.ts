import { HttpError, guard, json } from './_lib/auth';

/** Holdfázis és Nap/Hold jegy számítás (a korábbi astro.php átírása; publikus, nincs benne titok). */

const rad = (d: number) => (d * Math.PI) / 180;
const mod360 = (x: number) => ((x % 360) + 360) % 360;
const SIGNS = ['Kos', 'Bika', 'Ikrek', 'Rák', 'Oroszlán', 'Szűz', 'Mérleg', 'Skorpió', 'Nyilas', 'Bak', 'Vízöntő', 'Halak'];

const toJulian = (y: number, m: number, d: number, h = 12, mi = 0): number => {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    return JD + (h + mi / 60) / 24;
};

const sunLongitude = (jd: number) => {
    const D = jd - 2451545.0;
    const g = mod360(357.529 + 0.98560028 * D);
    const q = mod360(280.459 + 0.98564736 * D);
    return mod360(q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)));
};

const moonData = (jd: number) => {
    const D = jd - 2451545.0;
    const L = mod360(218.316 + 13.176396 * D);
    const M = mod360(134.963 + 13.064993 * D);
    const sunM = mod360(357.529 + 0.98560028 * D);
    const Del = mod360(297.85 + 12.190749 * D);
    const longitude = mod360(L + 6.289 * Math.sin(rad(M)));
    const elongation = mod360(
        Del - 6.289 * Math.sin(rad(M)) + 2.1 * Math.sin(rad(sunM)) - 1.274 * Math.sin(rad(2 * Del - M)) - 0.658 * Math.sin(rad(2 * Del)),
    );
    return { longitude, elongation, illumination: (1 - Math.cos(rad(elongation))) / 2 };
};

const sign = (lon: number) => SIGNS[Math.floor(lon / 30) % 12];

const phase = (e: number): [string, string] => {
    const t = 5;
    if (e < t || e > 360 - t) return ['Újhold', '🌑'];
    if (e < 90 - t) return ['Növekvő Holdsarló', '🌒'];
    if (e <= 90 + t) return ['Első Negyed', '🌓'];
    if (e < 180 - t) return ['Növekvő Hold', '🌔'];
    if (e <= 180 + t) return ['Telihold', '🌕'];
    if (e < 270 - t) return ['Fogyó Hold', '🌖'];
    if (e <= 270 + t) return ['Utolsó Negyed', '🌗'];
    return ['Fogyó Holdsarló', '🌘'];
};

export const onRequestGet = guard(async ({ request }) => {
    const dateStr = new URL(request.url).searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) throw new HttpError(400, 'Invalid date (YYYY-MM-DD)');
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (y < 1600 || y > 2600 || mo < 1 || mo > 12 || d < 1 || d > 31) throw new HttpError(400, 'Invalid date');

    const jd = toJulian(y, mo, d, 0, 0);
    const sunL = sunLongitude(jd);
    const moon = moonData(jd);
    const [phaseName, icon] = phase(moon.elongation);

    return json(
        200,
        {
            status: 'success',
            data: {
                date: dateStr,
                jd,
                sun: { longitude: sunL, sign: sign(sunL) },
                moon: {
                    longitude: moon.longitude,
                    sign: sign(moon.longitude),
                    elongation: moon.elongation,
                    illumination: moon.illumination,
                    phase_name: phaseName,
                    icon,
                },
            },
        },
        { 'Cache-Control': 'public, max-age=3600' },
    );
});
