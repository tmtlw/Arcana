
import React, { useState, useEffect } from 'react';
import { AstroService } from '../services/astroService';
import { CommunityService } from '../services/communityService';
import { useTarot } from '../context/TarotContext';
import { CardImage } from './CardImage';

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
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="text-3xl">{icons[element] || '✨'}</div>
            <div>
                <div className="text-[10px] uppercase font-bold text-orange-400 tracking-widest">Aktuális Elemi Energia</div>
                <div className="text-lg font-serif font-bold text-white">{element}</div>
                <div className="text-[10px] text-white/40 italic">A(z) {planet} órája uralkodik most.</div>
            </div>
        </div>
    );
};
