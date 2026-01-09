
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

        b = Math.round(jd * 8); 
        const age = jd * 29.53;

        if (b >= 8 ) b = 0; 
        
        const phases = [
            { id: 0, name: "Újhold", icon: "🌑" },
            { id: 1, name: "Növekvő Holdsarló", icon: "🌒" },
            { id: 2, name: "Első Negyed", icon: "🌓" },
            { id: 3, name: "Növekvő Hold", icon: "🌔" },
            { id: 4, name: "Telihold", icon: "🌕" },
            { id: 5, name: "Fogyó Hold", icon: "🌖" },
            { id: 6, name: "Utolsó Negyed", icon: "🌗" },
            { id: 7, name: "Fogyó Holdsarló", icon: "🌘" }
        ];

        return {
            phase: phases[b].name,
            icon: phases[b].icon,
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

    getPlanetaryHour: (date: Date) => {
        const planetsOrder = ["Nap", "Hold", "Mars", "Merkúr", "Jupiter", "Vénusz", "Szaturnusz"];
        const dayRulerIndex = date.getDay();
        const chaldeanSequence = [6, 4, 2, 0, 5, 3, 1];
        const startIdx = chaldeanSequence.indexOf(dayRulerIndex);
        let hoursSinceSunrise = date.getHours() - 6;
        if (hoursSinceSunrise < 0) hoursSinceSunrise += 24;
        const currentPlanetIdx = chaldeanSequence[(startIdx + hoursSinceSunrise) % 7];
        return planetsOrder[currentPlanetIdx];
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
        const planetHour = AstroService.getPlanetaryHour(validDate);
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
