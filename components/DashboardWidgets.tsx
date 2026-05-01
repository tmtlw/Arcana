
import React, { useState, useEffect, useMemo } from 'react';
import { AstroService } from '../services/astroService';
import { CommunityService } from '../services/communityService';
import { useTarot } from '../context/TarotContext';
import { CardImage } from './CardImage';
import { MOODS } from '../constants/ui';
import { ZODIAC_INFO } from '../constants/astro';

// --- Idea 3: Personal Day Number ---
export const PersonalNumberWidget = ({ birthDate }: { birthDate?: string }) => {
    const num = birthDate ? AstroService.getPersonalDayNumber(birthDate, new Date()) : null;
    const meanings: Record<number, string> = {
        1: "Új kezdetek, önállóság, vezetés.",
        2: "Együttműködés, egyensúly, türelem.",
        3: "Önkifejezés, kreativitás, társaság.",
        4: "Stabilitás, munka, fegyelem.",
        5: "Változás, szabadság, kaland.",
        6: "Család, harmónia, gondoskodás.",
        7: "Elemzés, spiritualitás, belső béke.",
        8: "Siker, bőség, hatalom.",
        9: "Lezárás, humanizmus, bölcsesség."
    };

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center text-2xl font-serif font-bold text-gold-400 border border-gold-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                {num || '?'}
            </div>
            <div>
                <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Személyes Napi Számod</div>
                <div className="text-sm text-gray-200 font-serif">
                    {num ? meanings[num] || "Különleges rezgésű nap." : "Állítsd be a születési dátumod a profilodban!"}
                </div>
            </div>
        </div>
    );
};

// --- Idea 4: Sabbat Countdown ---
export const SabbatCountdownWidget = () => {
    const next = AstroService.getNextSabbat(new Date());
    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="text-3xl animate-pulse-slow">🌿</div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Következő Sabbat</div>
                    <div className="text-lg font-serif font-bold text-white">{next.name}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-2xl font-bold text-gold-400">{next.daysUntil}</div>
                <div className="text-[8px] uppercase font-bold text-white/30">nap van hátra</div>
            </div>
        </div>
    );
};

// --- Idea 5: Daily Crystal/Color ---
export const DailyCrystalWidget = () => {
    const day = new Date().getDay();
    const suggestions = [
        { day: "Vasárnap", planet: "Nap", color: "Arany / Sárga", crystal: "Hegyikristály / Citrin", icon: "☀️" },
        { day: "Hétfő", planet: "Hold", color: "Ezüst / Fehér", crystal: "Holdkő / Szelenit", icon: "🌙" },
        { day: "Kedd", planet: "Mars", color: "Vörös", crystal: "Vörös Jáspis / Gránát", icon: "⚔️" },
        { day: "Szerda", planet: "Merkúr", color: "Lila / Narancs", crystal: "Ametiszt / Achát", icon: "☿️" },
        { day: "Csütörtök", planet: "Jupiter", color: "Kék / Ólomszürke", crystal: "Lapis Lazuli / Szodalit", icon: "♃" },
        { day: "Péntek", planet: "Vénusz", color: "Zöld / Rózsaszín", crystal: "Rózsakvarc / Jade", icon: "♀️" },
        { day: "Szombat", planet: "Szaturnusz", color: "Fekete / Sötétkék", crystal: "Obszidián / Ónix", icon: "♄" },
    ];
    const today = suggestions[day];

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 grid grid-cols-2 divide-x divide-white/5">
            <div className="pr-4">
                <div className="text-[10px] uppercase font-bold text-white/40 mb-1">A Nap Színe</div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: today.color.includes('/') ? today.color.split(' / ')[0] === 'Ezüst' ? '#C0C0C0' : '#FFD700' : today.color === 'Vörös' ? '#ef4444' : today.color === 'Zöld' ? '#22c55e' : '#000' }}></div>
                    <span className="text-sm font-bold text-gray-200">{today.color}</span>
                </div>
            </div>
            <div className="pl-4">
                <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Javasolt Kristály</div>
                <div className="text-sm font-bold text-blue-300">{today.crystal}</div>
            </div>
        </div>
    );
};

// --- Idea 6: Community Pulse ---
export const CommunityPulseWidget = ({ onSelectCard }: { onSelectCard: (c: any) => void }) => {
    const { deck } = useTarot();
    const [stats, setStats] = useState<Record<string, number>>({});
    const [topCardId, setTopCardId] = useState<string | null>(null);

    useEffect(() => {
        CommunityService.getCommunityCardStats().then(s => {
            setStats(s);
            const top = Object.entries(s).sort((a, b) => b[1] - a[1])[0];
            if (top) setTopCardId(top[0]);
        });
    }, []);

    const card = deck.find(c => c.id === topCardId);

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => card && onSelectCard(card)}>
                {topCardId ? <CardImage cardId={topCardId} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 animate-pulse"></div>}
            </div>
            <div>
                <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Közösségi Energia</div>
                <div className="text-sm font-bold text-white">{card?.name || "Keresés..."}</div>
                <div className="text-[10px] text-white/40 italic">Ma ezt a kártyát húzták a legtöbben.</div>
            </div>
        </div>
    );
};

// --- Idea 7: Breathing Helper ---
export const BreathingHelperWidget = () => {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Wait'>('Inhale');
    const [seconds, setSeconds] = useState(4);

    useEffect(() => {
        if (!isActive) return;
        const timer = setInterval(() => {
            setSeconds(s => {
                if (s <= 1) {
                    if (phase === 'Inhale') { setPhase('Hold'); return 4; }
                    if (phase === 'Hold') { setPhase('Exhale'); return 4; }
                    if (phase === 'Exhale') { setPhase('Wait'); return 4; }
                    if (phase === 'Wait') { setPhase('Inhale'); return 4; }
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isActive, phase]);

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
                <div className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">Légzőgyakorlat (4-4-4-4)</div>
                <button
                    onClick={() => setIsActive(!isActive)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${isActive ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}
                >
                    {isActive ? 'Leállítás' : 'Indítás'}
                </button>
            </div>
            <div className="flex flex-col items-center justify-center h-24 relative">
                {isActive ? (
                    <>
                        <div className={`absolute w-16 h-16 rounded-full border-2 border-blue-500/30 transition-all duration-1000 ${phase === 'Inhale' ? 'scale-[2] opacity-100' : phase === 'Exhale' ? 'scale-100 opacity-30' : 'scale-[1.5]'}`}></div>
                        <div className="text-xl font-bold text-white z-10">{phase === 'Inhale' ? 'Beszív' : phase === 'Hold' ? 'Tart' : phase === 'Exhale' ? 'Kifúj' : 'Vár'}</div>
                        <div className="text-sm text-blue-300 font-mono mt-1 z-10">{seconds} mp</div>
                    </>
                ) : (
                    <div className="text-xs text-white/30 italic text-center px-4">Egy rövid légzőgyakorlat segít megnyugodni a húzás előtt.</div>
                )}
            </div>
        </div>
    );
};

// --- Idea 12: Sacred Hour Element ---
export const SacredElementWidget = () => {
    const { userLocation } = useTarot();
    const planet = AstroService.getPlanetaryHour(new Date(), userLocation?.lat, userLocation?.lng);
    const element = AstroService.getElementForPlanet(planet);
    const icons: Record<string, string> = { "Tűz": "🔥", "Víz": "💧", "Levegő": "🌬️", "Föld": "🌱" };

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4 h-full">
            <div className="text-3xl">{icons[element] || '✨'}</div>
            <div>
                <div className="text-[10px] uppercase font-bold text-orange-400 tracking-widest">Aktuális Elemi Energia</div>
                <div className="text-lg font-serif font-bold text-white">{element}</div>
                <div className="text-[10px] text-white/40 italic">A(z) {planet} órája uralkodik most.</div>
            </div>
        </div>
    );
};

// --- Idea 8: Daily Intention ---
export const DailyIntentionWidget = () => {
    const { currentUser, updateUser } = useTarot();
    const today = new Date().toDateString();
    const [localText, setLocalText] = useState(currentUser?.dailyIntention?.date === today ? currentUser.dailyIntention.text : "");

    const handleSave = () => {
        if (!currentUser) return;
        updateUser({ ...currentUser, dailyIntention: { text: localText, date: today } });
    };

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex flex-col justify-between">
            <div>
                <div className="text-[10px] uppercase font-bold text-gold-400 tracking-widest mb-2">A Nap Szándéka</div>
                <textarea
                    value={localText}
                    onChange={e => setLocalText(e.target.value)}
                    onBlur={handleSave}
                    placeholder="Írd le a mai fókuszod..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-2 text-sm text-white outline-none focus:border-gold-500/30 resize-none h-16"
                />
            </div>
            <div className="text-[9px] text-white/20 italic text-right mt-1">Éjfélkor törlődik.</div>
        </div>
    );
};

// --- Idea 9: Mood Trend ---
export const MoodTrendWidget = () => {
    const { readings, currentUser } = useTarot();
    const last7Days = useMemo(() => {
        const now = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toDateString();
            const reading = readings.find(r => r.userId === currentUser?.id && new Date(r.date).toDateString() === dateStr);
            days.push({ day: d.toLocaleDateString('hu-HU', { weekday: 'short' }), mood: reading?.mood });
        }
        return days;
    }, [readings, currentUser]);

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full">
            <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-4">Hangulati Trend (7 nap)</div>
            <div className="flex justify-between items-end h-12 gap-1">
                {last7Days.map((d, i) => {
                    const moodIcon = MOODS.find(m => m.id === d.mood)?.icon || '⚪';
                    return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <span className={`text-lg filter ${d.mood ? 'drop-shadow-md' : 'opacity-20 grayscale'}`}>{moodIcon}</span>
                            <span className="text-[8px] uppercase font-bold text-white/30">{d.day}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Idea 10: Active Quests ---
export const ActiveQuestsWidget = ({ onNavigate }: { onNavigate: (v: string) => void }) => {
    const { currentUser } = useTarot();
    const active = (currentUser?.activeQuests || []).filter(q => !q.isCompleted).slice(0, 2);

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex flex-col justify-between" onClick={() => onNavigate('quests')}>
            <div>
                <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest mb-3">Aktív Kihívások</div>
                <div className="space-y-2">
                    {active.length > 0 ? active.map(q => (
                        <div key={q.questId} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                            <div className="text-[10px] text-gray-200 truncate">{q.questId}</div>
                        </div>
                    )) : <div className="text-xs text-white/20 italic">Minden kész! ✨</div>}
                </div>
            </div>
            <div className="text-[9px] text-indigo-300 font-bold uppercase mt-2 text-right cursor-pointer hover:underline">Összes megtekintése &rarr;</div>
        </div>
    );
};

// --- Idea 15: Ruling Planet ---
export const RulingPlanetWidget = () => {
    const day = new Date().getDay();
    const mapping = [
        { name: "Nap", icon: "☀️", quality: "Tudatosság, életérő, ego", color: "text-gold-400" },
        { name: "Hold", icon: "🌙", quality: "Érzelmek, ösztönök, tudatalatti", color: "text-blue-300" },
        { name: "Mars", icon: "⚔️", quality: "Akvitiás, akarat, energia", color: "text-red-400" },
        { name: "Merkúr", icon: "☿️", quality: "Kommunikáció, észlelés, logika", color: "text-orange-300" },
        { name: "Jupiter", icon: "♃", quality: "Terjeszkedés, hit, szerencse", color: "text-indigo-400" },
        { name: "Vénusz", icon: "♀️", quality: "Szeretet, harmónia, értékek", color: "text-pink-400" },
        { name: "Szaturnusz", icon: "♄", quality: "Struktúra, fegyelem, idő", color: "text-gray-400" }
    ];
    const ruler = mapping[day];

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex items-center gap-4">
            <div className="text-3xl">{ruler.icon}</div>
            <div>
                <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">A Nap Ura</div>
                <div className={`text-lg font-serif font-bold ${ruler.color}`}>{ruler.name}</div>
                <div className="text-[10px] text-white/50 italic leading-tight">{ruler.quality}</div>
            </div>
        </div>
    );
};

// --- Idea 16: Aura Color ---
export const AuraColorWidget = () => {
    const { currentUser } = useTarot();
    const dayNum = currentUser?.birthDate ? AstroService.getPersonalDayNumber(currentUser.birthDate, new Date()) : null;
    const auraMap: Record<number, { color: string, name: string, desc: string }> = {
        1: { color: "bg-red-500", name: "Vörös", desc: "Szenvedély, vitalitás, fizikai erő." },
        2: { color: "bg-orange-500", name: "Narancs", desc: "Kreativitás, érzelmi rugalmasság." },
        3: { color: "bg-yellow-400", name: "Sárga", desc: "Optimizmus, intelligencia, önbizalom." },
        4: { color: "bg-green-500", name: "Zöld", desc: "Harmónia, gyógyulás, növekedés." },
        5: { color: "bg-blue-500", name: "Kék", desc: "Kommunikáció, béke, hűség." },
        6: { color: "bg-indigo-600", name: "Indigó", desc: "Intuíció, belső látás, mélység." },
        7: { color: "bg-purple-600", name: "Ibolya", desc: "Spiritualitás, megvilágosodás." },
        8: { color: "bg-pink-400", name: "Rózsaszín", desc: "Feltétel nélküli szeretet, lágyság." },
        9: { color: "bg-white", name: "Fehér", desc: "Tisztaság, teljesség, transzcendencia." }
    };
    const aura = dayNum ? auraMap[dayNum] : null;

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${aura?.color || 'bg-white/10'} blur-[4px] shadow-inner`}></div>
            <div>
                <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Napi Aura Színed</div>
                <div className="text-sm font-bold text-white">{aura?.name || "???"}</div>
                <div className="text-[10px] text-white/50 italic leading-tight">{aura?.desc || "Állítsd be a születési dátumod!"}</div>
            </div>
        </div>
    );
};

// --- Idea 17: Lucky Period ---
export const LuckyPeriodWidget = () => {
    const { userLocation } = useTarot();
    const now = new Date();
    const hours = AstroService.getPlanetaryHoursForDay(now, userLocation?.lat, userLocation?.lng);
    // Logic: Jupiter or Venus hours are "lucky"
    const luckyHours = hours.filter(h => h.planet === "Jupiter" || h.planet === "Vénusz");
    const nextLucky = luckyHours.find(h => {
        const [sh, sm] = h.start.split(':').map(Number);
        return (sh * 60 + sm) > (now.getHours() * 60 + now.getMinutes());
    }) || luckyHours[0];

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex flex-col justify-center">
            <div className="text-[10px] uppercase font-bold text-yellow-400 tracking-widest mb-1 text-center">Következő Szerencsés Óra</div>
            {nextLucky ? (
                <div className="text-center">
                    <div className="text-xl font-serif font-bold text-white">
                        {nextLucky.start} – {nextLucky.end}
                    </div>
                    <div className="text-[10px] text-white/40 italic">A(z) {nextLucky.planet} védelme alatt.</div>
                </div>
            ) : <div className="text-xs text-white/20 italic text-center">Számítás...</div>}
        </div>
    );
};

// --- Idea 18: Quick Quiz ---
export const QuickQuizWidget = () => {
    const { deck, currentUser, updateUser } = useTarot();
    const today = new Date().toDateString();
    const [isAnswered, setIsAnswered] = useState(currentUser?.lastQuizResult?.date === today);
    const [card] = useState(() => deck[Math.floor(Math.random() * deck.length)]);
    const [options] = useState(() => {
        const correct = card.element || card.suit || "Föld";
        const others = ["Tűz", "Víz", "Levegő", "Föld"].filter(e => e !== correct);
        return [correct, ...others.slice(0, 2)].sort(() => Math.random() - 0.5);
    });

    const handleAnswer = (ans: string) => {
        if (isAnswered) return;
        const correct = card.element || card.suit || "Föld";
        const isCorrect = ans === correct;
        if (currentUser) {
            updateUser({ ...currentUser, lastQuizResult: { date: today, correct: isCorrect }, xp: currentUser.xp + (isCorrect ? 5 : 0) });
        }
        setIsAnswered(true);
    };

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex flex-col justify-between">
            <div>
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest mb-2">Villám Kvíz</div>
                <div className="text-[11px] text-gray-200 mb-3">Milyen elemhez tartozik: <span className="font-bold text-gold-400">{card.name}</span>?</div>
            </div>
            {!isAnswered ? (
                <div className="grid grid-cols-3 gap-1">
                    {options.map(opt => (
                        <button key={opt} onClick={() => handleAnswer(opt)} className="bg-white/5 hover:bg-white/10 p-1.5 rounded text-[10px] text-white border border-white/10 transition-colors">{opt}</button>
                    ))}
                </div>
            ) : (
                <div className={`text-center text-[10px] font-bold p-2 rounded ${currentUser?.lastQuizResult?.correct ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {currentUser?.lastQuizResult?.correct ? '✓ Helyes válasz! (+5 XP)' : '✗ Majd legközelebb!'}
                </div>
            )}
        </div>
    );
};

// --- Idea 20: Sacred Geometry ---
// --- Missing: Zodiac Progression ---
export const ZodiacProgressionWidget = () => {
    const data = AstroService.getZodiacProgression(new Date());
    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-[10px] uppercase font-bold text-gold-400 tracking-widest">Zodiákus Szezon</div>
                    <div className="text-lg font-serif font-bold text-white">{data.sign}</div>
                </div>
                <div className="text-xl">☀️</div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-[8px] uppercase font-bold text-white/30">
                    <span>{data.startDate}</span>
                    <span>{data.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${data.progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

// --- Missing: Moon Countdown ---
export const MoonCountdownWidget = () => {
    const next = AstroService.getNextSignificantMoon(new Date());
    if (!next) return null;
    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex items-center gap-4">
            <div className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{next.icon}</div>
            <div>
                <div className="text-[10px] uppercase font-bold text-blue-300 tracking-widest">Következő {next.type}</div>
                <div className="text-sm font-bold text-white">
                    {next.days > 0 && `${next.days} nap `}
                    {next.hours} óra múlva
                </div>
                <div className="text-[9px] text-white/20 italic">{next.date.toLocaleDateString()}</div>
            </div>
        </div>
    );
};

// --- Missing: Dominant Element ---
export const DominantElementWidget = () => {
    const { readings, currentUser, deck } = useTarot();
    const lastReadings = readings.filter(r => r.userId === currentUser?.id).slice(0, 10);
    const elementCounts: Record<string, number> = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };

    lastReadings.forEach(r => r.cards.forEach(c => {
        const card = deck.find(x => x.id === c.cardId);
        if (card?.element && elementCounts[card.element] !== undefined) elementCounts[card.element]++;
    }));

    const total = Object.values(elementCounts).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(elementCounts).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0];
    const icons: Record<string, string> = { "Tűz": "🔥", "Víz": "💧", "Levegő": "🌬️", "Föld": "🌱" };

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest mb-2">Domináns Elemek (10 húzás)</div>
            <div className="flex-1 flex flex-col justify-center">
                {total > 0 ? (
                    <div className="space-y-2">
                        {sorted.map(([el, count]) => {
                            const pct = Math.round((count / total) * 100);
                            if (pct === 0) return null;
                            return (
                                <div key={el} className="flex items-center gap-2">
                                    <span className="text-xs w-4">{icons[el]}</span>
                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500/50" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <span className="text-[8px] font-mono text-white/40">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                ) : <div className="text-[10px] text-white/20 italic">Húzz kártyát az elemzéshez!</div>}
            </div>
        </div>
    );
};

export const SacredGeometryWidget = () => {
    const day = new Date().getDate() % 5;
    const symbols = [
        { name: "Élet Virága", icon: "❄️", desc: "Az univerzum alapmintázata, összekapcsolódás." },
        { name: "Srí Jantra", icon: "💠", desc: "A spirituális és anyagi világ egyensúlya." },
        { name: "Metatron Kocka", icon: "🔯", desc: "Védelem és az isteni energia áramlása." },
        { name: "Vesica Piscis", icon: "♾️", desc: "A teremtés kapuja, kettősség és egység." },
        { name: "Torusz", icon: "🌀", desc: "Az élet folyamatos önfenntartó körforgása." }
    ];
    const symbol = symbols[day];

    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 h-full flex items-center gap-4">
            <div className="text-3xl animate-float">{symbol.icon}</div>
            <div>
                <div className="text-[10px] uppercase font-bold text-purple-400 tracking-widest">Napi Szakrális Szimbólum</div>
                <div className="text-sm font-bold text-white">{symbol.name}</div>
                <div className="text-[10px] text-white/50 italic leading-tight">{symbol.desc}</div>
            </div>
        </div>
    );
};
