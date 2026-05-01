
import { AstrologyData } from '../types';

const ZODIAC = [
    "Kos", "Bika", "Ikrek", "Rák", "Oroszlán", "Szűz", 
    "Mérleg", "Skorpió", "Nyilas", "Bak", "Vízöntő", "Halak"
];

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const DEFAULT_LAT = 47.4979;
const DEFAULT_LNG = 19.0402;

export const AstroService = {
    
    toJulianDate: (date: Date): number => {
        return (date.getTime() / 86400000) + 2440587.5;
    },

    getGMST: (date: Date): number => {
        const jd = AstroService.toJulianDate(date);
        const D = jd - 2451545.0;
        let gmst = 280.46061837 + 360.98564736629 * D;
        gmst %= 360;
        if (gmst < 0) gmst += 360;
        return gmst;
    },

    getSunLongitude: (date: Date): number => {
        const jd = AstroService.toJulianDate(date);
        const D = jd - 2451545.0;
        const M = (357.5291 + 0.98560028 * D) % 360;
        const M_rad = M * RAD;
        const C = 1.9148 * Math.sin(M_rad) + 0.0200 * Math.sin(2 * M_rad) + 0.0003 * Math.sin(3 * M_rad);
        let L = (M + C + 102.9372 + 180) % 360;
        if (L < 0) L += 360;
        return L;
    },

    getZodiacSign: (longitude: number): string => {
        const index = Math.floor(longitude / 30);
        return ZODIAC[index % 12];
    },

    calculateMoonPhase: (date: Date): { phase: string, icon: string, illumination: number, age: number } => {
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        const day = date.getDate();
        
        if (month < 3) { year--; month += 12; }
        const c = 365.25 * year;
        const e = 30.6 * month;
        let jd = c + e + day - 694039.09; 
        jd /= 29.5305882; 
        let b = parseInt(jd.toString()); 
        jd -= b; // fractional part of cycle (0.0 to 1.0)

        // Accurate Illumination (0-100%)
        // Illumination is roughly (1 - cos(angle))/2. Angle ranges 0 to 2PI over the cycle.
        const angle = jd * 2 * Math.PI;
        const illumination = (1 - Math.cos(angle)) / 2;
        const age = jd * 29.53;

        // Custom phase boundaries to ensure Full/New Moon are ~3 days
        // Cycle is 0.0 to 1.0.
        // 3 days / 29.53 days approx 0.10.
        // New Moon: [0.95, 1.0) U [0.0, 0.05) -> Center 0.0
        // Full Moon: [0.45, 0.55] -> Center 0.5
        // First Quarter: Around 0.25
        // Last Quarter: Around 0.75

        let phase = "";
        let icon = "";
        
        if (jd < 0.05 || jd >= 0.95) {
            phase = "Újhold";
            icon = "🌑";
        } else if (jd >= 0.05 && jd < 0.20) {
            phase = "Növekvő Holdsarló";
            icon = "🌒";
        } else if (jd >= 0.20 && jd < 0.30) {
            phase = "Első Negyed";
            icon = "🌓";
        } else if (jd >= 0.30 && jd < 0.45) {
            phase = "Növekvő Hold";
            icon = "🌔";
        } else if (jd >= 0.45 && jd <= 0.55) {
            phase = "Telihold";
            icon = "🌕";
        } else if (jd > 0.55 && jd <= 0.70) {
            phase = "Fogyó Hold";
            icon = "🌖";
        } else if (jd > 0.70 && jd <= 0.80) {
            phase = "Utolsó Negyed";
            icon = "🌗";
        } else {
            phase = "Fogyó Holdsarló";
            icon = "🌘";
        }

        return {
            phase: phase,
            icon: icon,
            illumination: illumination, // Now a precise float 0..1
            age: age
        };
    },

    calculateAscendant: (date: Date, lat: number, lng: number): string => {
        const gmst = AstroService.getGMST(date);
        const lst = (gmst + lng) % 360;
        const lstRad = lst * RAD;
        const latRad = lat * RAD;
        const eps = 23.439 * RAD;
        const y = Math.cos(lstRad);
        const x = -Math.sin(lstRad) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
        let ascRad = Math.atan2(y, x);
        let ascDeg = ascRad * DEG;
        if (ascDeg < 0) ascDeg += 360;
        return AstroService.getZodiacSign(ascDeg);
    },

    calculateMoonSign: (date: Date): string => {
        const epoch = new Date("2000-01-01T00:00:00").getTime();
        const now = date.getTime();
        const daysSince = (now - epoch) / (1000 * 60 * 60 * 24);
        const startDeg = 230;
        let currentDeg = (startDeg + (daysSince * 13.176)) % 360;
        if (currentDeg < 0) currentDeg += 360;
        return AstroService.getZodiacSign(currentDeg);
    },

    calculateNumerology: (date: Date): number => {
        const str = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
        const sum = str.split('').reduce((a, b) => a + parseInt(b), 0);
        let final = sum;
        while (final > 9) {
            final = final.toString().split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return final;
    },

    getSolarTimes: (date: Date, lat: number, lng: number) => {
        const startOfYear = new Date(date.getFullYear(), 0, 0);
        const diff = date.getTime() - startOfYear.getTime();
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        const declination = 23.45 * Math.sin(RAD * (360/365) * (dayOfYear - 81));
        const den = Math.cos(lat * RAD) * Math.cos(declination * RAD);
        const num = Math.sin(RAD * -0.83) - Math.sin(lat * RAD) * Math.sin(declination * RAD);
        let w = Math.acos(num / den) * DEG;
        const solarNoonOffset = 12 - (lng / 15);
        const sunriseHour = solarNoonOffset - (w / 15);
        const sunsetHour = solarNoonOffset + (w / 15);
        const formatTime = (h: number) => {
            if (isNaN(h)) return "--:--";
            const tzOffset = -date.getTimezoneOffset() / 60; 
            let localH = h + tzOffset;
            if (localH < 0) localH += 24;
            if (localH >= 24) localH -= 24;
            const hr = Math.floor(localH);
            const min = Math.floor((localH - hr) * 60);
            return `${hr}:${min.toString().padStart(2, '0')}`;
        };
        return { sunrise: formatTime(sunriseHour), sunset: formatTime(sunsetHour) };
    },

    getLunarTimes: (date: Date, moonAge: number, lat: number, lng: number) => {
        const solar = AstroService.getSolarTimes(date, lat, lng);
        if (solar.sunrise === "--:--") return { moonrise: "--:--", moonset: "--:--" };
        const srParts = solar.sunrise.split(':');
        const sr = parseFloat(srParts[0]) + parseFloat(srParts[1])/60;
        const lagHours = (moonAge / 29.53) * 24;
        let mr = (sr + lagHours) % 24;
        let ms = (mr + 12.4) % 24; 
        const formatTime = (h: number) => {
            const hr = Math.floor(h);
            const min = Math.floor((h - hr) * 60);
            return `${hr}:${min.toString().padStart(2, '0')}`;
        };
        return { moonrise: formatTime(mr), moonset: formatTime(ms) };
    },

    getPlanetaryHour: (date: Date, lat: number = DEFAULT_LAT, lng: number = DEFAULT_LNG) => {
        const hours = AstroService.getPlanetaryHoursForDay(date, lat, lng);
        const nowMin = date.getHours() * 60 + date.getMinutes();

        // Find the hour that contains the current time
        const currentHour = hours.find(h => {
            const [startH, startM] = h.start.split(':').map(Number);
            const [endH, endM] = h.end.split(':').map(Number);
            const startTotal = startH * 60 + startM;
            let endTotal = endH * 60 + endM;

            if (endTotal < startTotal) endTotal += 1440; // Crosses midnight

            let checkTime = nowMin;
            if (checkTime < startTotal && endTotal > 1440) checkTime += 1440;

            return checkTime >= startTotal && checkTime < endTotal;
        });

        return currentHour?.planet || "Ismeretlen";
    },

    getPlanetaryHoursForDay: (date: Date, lat: number = DEFAULT_LAT, lng: number = DEFAULT_LNG) => {
        const planetsOrder = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"]; // Just for reference
        const planets = ["Nap", "Vénusz", "Merkúr", "Hold", "Szaturnusz", "Jupiter", "Mars"]; // Chaldean order (reversed for hours)
        // Wait, standard order for hours is: Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars
        const hourPlanets = ["Nap", "Vénusz", "Merkúr", "Hold", "Szaturnusz", "Jupiter", "Mars"];
        const dayRulers = ["Nap", "Hold", "Mars", "Merkúr", "Jupiter", "Vénusz", "Szaturnusz"];

        const solar = AstroService.getSolarTimes(date, lat, lng);
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const solarTomorrow = AstroService.getSolarTimes(tomorrow, lat, lng);

        const parseToMin = (s: string) => {
            const [h, m] = s.split(':').map(Number);
            return h * 60 + m;
        };

        const sunrise = parseToMin(solar.sunrise);
        const sunset = parseToMin(solar.sunset);
        const nextSunrise = parseToMin(solarTomorrow.sunrise) + 1440;

        const dayLength = sunset - sunrise;
        const nightLength = nextSunrise - sunset;

        const dayHourLen = dayLength / 12;
        const nightHourLen = nightLength / 12;

        const dayRuler = dayRulers[date.getDay()];
        const startIndex = hourPlanets.indexOf(dayRuler);

        const hours = [];
        const formatMin = (m: number) => {
            let total = m % 1440;
            const hr = Math.floor(total / 60);
            const min = Math.floor(total % 60);
            return `${hr}:${min.toString().padStart(2, '0')}`;
        };

        // Day Hours
        for (let i = 0; i < 12; i++) {
            const start = sunrise + (i * dayHourLen);
            const end = sunrise + ((i + 1) * dayHourLen);
            hours.push({
                index: i + 1,
                isNight: false,
                planet: hourPlanets[(startIndex + i) % 7],
                start: formatMin(start),
                end: formatMin(end)
            });
        }

        // Night Hours
        for (let i = 0; i < 12; i++) {
            const start = sunset + (i * nightHourLen);
            const end = sunset + ((i + 1) * nightHourLen);
            hours.push({
                index: i + 13,
                isNight: true,
                planet: hourPlanets[(startIndex + 12 + i) % 7],
                start: formatMin(start),
                end: formatMin(end)
            });
        }

        return hours;
    },

    getMoonPhasesForMonth: (year: number, month: number) => {
        const days = new Date(year, month + 1, 0).getDate();
        const phases = [];
        for (let d = 1; d <= days; d++) {
            const date = new Date(year, month, d);
            const moon = AstroService.calculateMoonPhase(date);
            phases.push({ day: d, ...moon });
        }
        return phases;
    },

    getSolarTimesForMonth: (year: number, month: number, lat: number = DEFAULT_LAT, lng: number = DEFAULT_LNG) => {
        const days = new Date(year, month + 1, 0).getDate();
        const times = [];
        for (let d = 1; d <= days; d++) {
            const date = new Date(year, month, d);
            const solar = AstroService.getSolarTimes(date, lat, lng);
            times.push({ day: d, ...solar });
        }
        return times;
    },

    getLunarTimesForMonth: (year: number, month: number, lat: number = DEFAULT_LAT, lng: number = DEFAULT_LNG) => {
        const days = new Date(year, month + 1, 0).getDate();
        const times = [];
        for (let d = 1; d <= days; d++) {
            const date = new Date(year, month, d);
            const moon = AstroService.calculateMoonPhase(date);
            const lunar = AstroService.getLunarTimes(date, moon.age, lat, lng);
            times.push({ day: d, ...lunar });
        }
        return times;
    },

    getWiccanHoliday: (date: Date) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // --- Fix dátumú Sabbatok (minden évben megjelennek) ---
        if (month === 2 && day === 1) return { name: "Imbolc", spreadId: "imbolc-purification", icon: "🕯️", desc: "A fény visszatérése és a megtisztulás." };
        if (month === 3 && day === 20) return { name: "Ostara", spreadId: "ostara-balance", icon: "🥚", desc: "Tavaszi napéjegyenlőség, egyensúly." };
        if (month === 5 && day === 1) return { name: "Beltane", spreadId: "beltane-passion", icon: "🔥", desc: "A tűz és a termékenység ünnepe." };
        if (month === 6 && day === 21) return { name: "Litha", spreadId: "litha-power", icon: "☀️", desc: "Nyári napforduló, a Nap ereje." };
        if (month === 8 && day === 1) return { name: "Lammas", spreadId: "lammas-harvest", icon: "🌾", desc: "Az első aratás ünnepe." };
        if (month === 9 && day === 22) return { name: "Mabon", spreadId: "mabon-reflection", icon: "🍂", desc: "Őszi napéjegyenlőség, hálaadás." };
        if (month === 10 && day === 31) return { name: "Samhain", spreadId: "samhain-ancestor", icon: "🎃", desc: "Az ősök napja, a sötét évfél kezdete." };
        if (month === 12 && day === 21) return { name: "Yule", spreadId: "yule-light", icon: "🎄", desc: "Téli napforduló, a fény születése." };

        // --- Season Checks with Spread Mapping ---
        if (month === 1 && day === 20) return { name: "Vízöntő Szezon", spreadId: "season-aquarius", icon: "♒", desc: "Az új ötletek és a közösség ideje." };
        if (month === 2 && day === 19) return { name: "Halak Szezon", spreadId: "season-pisces", icon: "♓", desc: "Az intuíció és az álmok ideje." };
        if (month === 3 && day === 21) return { name: "Kos Szezon", spreadId: "season-aries", icon: "♈", desc: "Az új kezdetek és a cselekvés ideje." };
        if (month === 4 && day === 20) return { name: "Bika Szezon", spreadId: "season-taurus", icon: "♉", desc: "A stabilitás és az anyagi bőség ideje." };
        if (month === 5 && day === 21) return { name: "Ikrek Szezon", spreadId: "season-gemini", icon: "♊", desc: "A kommunikáció és a kíváncsiság ideje." };
        if (month === 6 && day === 21) return { name: "Rák Szezon", spreadId: "season-cancer", icon: "♋", desc: "Az érzelmek és az otthon ideje." };
        if (month === 7 && day === 23) return { name: "Oroszlán Szezon", spreadId: "season-leo", icon: "♌", desc: "A kreativitás és az önkifejezés ideje." };
        if (month === 8 && day === 23) return { name: "Szűz Szezon", spreadId: "season-virgo", icon: "♍", desc: "A munka és a rendszerezés ideje." };
        if (month === 9 && day === 23) return { name: "Mérleg Szezon", spreadId: "season-libra", icon: "♎", desc: "A harmónia és a kapcsolatok ideje." };
        if (month === 10 && day === 23) return { name: "Skorpió Szezon", spreadId: "season-scorpio", icon: "♏", desc: "Az átalakulás és a mélység ideje." };
        if (month === 11 && day === 22) return { name: "Nyilas Szezon", spreadId: "season-sagittarius", icon: "♐", desc: "A kaland és a bölcsesség ideje." };
        if (month === 12 && day === 22) return { name: "Bak Szezon", spreadId: "season-capricorn", icon: "♑", desc: "A célok és a felelősség ideje." };
        
        return null;
    },

    getNextSabbat: (date: Date) => {
        const currentYear = date.getFullYear();
        const sabbats = [
            { name: "Imbolc", month: 2, day: 1 },
            { name: "Ostara", month: 3, day: 20 },
            { name: "Beltane", month: 5, day: 1 },
            { name: "Litha", month: 6, day: 21 },
            { name: "Lammas", month: 8, day: 1 },
            { name: "Mabon", month: 9, day: 22 },
            { name: "Samhain", month: 10, day: 31 },
            { name: "Yule", month: 12, day: 21 }
        ];

        const sortedSabbats = sabbats.map(s => {
            let d = new Date(currentYear, s.month - 1, s.day);
            if (d.getTime() < date.getTime()) {
                d = new Date(currentYear + 1, s.month - 1, s.day);
            }
            return { ...s, date: d };
        }).sort((a, b) => a.date.getTime() - b.date.getTime());

        const next = sortedSabbats[0];
        const diffTime = next.date.getTime() - date.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { ...next, daysUntil: diffDays };
    },

    getPersonalDayNumber: (birthDate: string, targetDate: Date) => {
        if (!birthDate) return null;
        const b = new Date(birthDate);
        if (isNaN(b.getTime())) return null;

        const sumDigits = (n: number | string) => n.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
        const reduceToSingle = (n: number) => {
            let res = n;
            while (res > 9 && res !== 11 && res !== 22) { // Keep master numbers if desired, but usually 1-9 for day
                res = sumDigits(res);
            }
            return res;
        };

        const bDay = b.getDate();
        const bMonth = b.getMonth() + 1;
        const tYear = targetDate.getFullYear();
        const tMonth = targetDate.getMonth() + 1;
        const tDay = targetDate.getDate();

        // Numerology: Birth Month + Birth Day + Current Year + Current Month + Current Day
        const total = sumDigits(bDay) + sumDigits(bMonth) + sumDigits(tYear) + sumDigits(tMonth) + sumDigits(tDay);
        return reduceToSingle(total);
    },

    getElementForPlanet: (planet: string) => {
        const mapping: Record<string, string> = {
            "Nap": "Tűz",
            "Hold": "Víz",
            "Mars": "Tűz",
            "Merkúr": "Levegő",
            "Jupiter": "Levegő",
            "Vénusz": "Föld",
            "Szaturnusz": "Föld"
        };
        return mapping[planet] || "Ismeretlen";
    },

    getAstroData: (date: Date = new Date(), location?: {lat: number, lng: number}): AstrologyData & { sunrise: string, sunset: string, moonrise: string, moonset: string } => {
        const validDate = isNaN(date.getTime()) ? new Date() : date;
        const lat = location?.lat || DEFAULT_LAT;
        const lng = location?.lng || DEFAULT_LNG;
        const moon = AstroService.calculateMoonPhase(validDate);
        const sunLong = AstroService.getSunLongitude(validDate);
        const sunSign = AstroService.getZodiacSign(sunLong);
        const moonSign = AstroService.calculateMoonSign(validDate);
        const ascendant = AstroService.calculateAscendant(validDate, lat, lng);
        const num = AstroService.calculateNumerology(validDate);
        const solarTimes = AstroService.getSolarTimes(validDate, lat, lng);
        const lunarTimes = AstroService.getLunarTimes(validDate, moon.age, lat, lng);
        const planetHour = AstroService.getPlanetaryHour(validDate, lat, lng);
        return {
            moonPhase: moon.phase,
            illumination: moon.illumination,
            sunSign: sunSign,
            moonSign: moonSign,
            ascendant: ascendant,
            planetHour: planetHour,
            retrograde: [],
            icon: moon.icon,
            dayNumerology: num,
            sunrise: solarTimes.sunrise,
            sunset: solarTimes.sunset,
            moonrise: lunarTimes.moonrise,
            moonset: lunarTimes.moonset
        };
    },

    fetchAccurateAstroData: async (date: Date, location?: {lat: number, lng: number}): Promise<Partial<AstrologyData>> => {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const lat = location?.lat || DEFAULT_LAT;
            const lng = location?.lng || DEFAULT_LNG;

            const response = await fetch(`./astro.php?date=${dateStr}&lat=${lat}&lng=${lng}`);
            if (!response.ok) throw new Error("API Error");

            const json = await response.json();
            if (json.status === 'success' && json.data) {
                return {
                    moonPhase: json.data.moon.phase_name,
                    icon: json.data.moon.icon,
                    illumination: json.data.moon.illumination,
                    sunSign: json.data.sun.sign,
                    moonSign: json.data.moon.sign
                };
            }
        } catch (e) {
            console.warn("Nem sikerült pontos asztrológiai adatokat lekérni, marad a közelítő számítás.", e);
        }
        return {};
    }
};
