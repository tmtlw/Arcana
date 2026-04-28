
import React, { useState, useMemo } from 'react';
import { StatsView } from './StatsView';
import { NumerologyView } from './NumerologyView';
import { SoulCompass } from './SoulCompass';
import { MonthlySummaryView } from './MonthlySummaryView';
import { t } from '../services/i18nService';
import { useTarot } from '../context/TarotContext';
import { useAnalytics } from '../services/analyticsHook';
import { CardModal } from './CardModal';
import { Card } from '../types';
import { MOODS } from '../constants/ui';

type Tab = 'stats' | 'numerology' | 'compass' | 'monthly' | 'insights';
type TimeRange = '7d' | '30d' | '90d' | 'all';

export const AnalysisView = ({ onBack, initialTab = 'stats' }: { onBack: () => void, initialTab?: Tab }) => {
    const { readings, currentUser, language } = useTarot();
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    React.useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [compareMode, setCompareMode] = useState(false);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [tagFilter, setTagFilter] = useState('');

    // Filter Logic
    const getFilteredReadings = (range: TimeRange, offsetDays: number = 0) => {
        const now = new Date();
        const start = new Date();
        const end = new Date();

        if (range === '7d') start.setDate(now.getDate() - 7 - offsetDays);
        else if (range === '30d') start.setDate(now.getDate() - 30 - offsetDays);
        else if (range === '90d') start.setDate(now.getDate() - 90 - offsetDays);
        else start.setFullYear(2000); // All time

        start.setHours(0, 0, 0, 0);

        if (offsetDays > 0) {
            end.setDate(now.getDate() - offsetDays);
            end.setHours(23, 59, 59, 999);
        } else {
            end.setHours(23, 59, 59, 999);
        }

        return readings.filter(r => {
            if (r.userId !== currentUser?.id) return false;
            const d = new Date(r.date);
            const dateMatch = d >= start && (offsetDays > 0 ? d <= end : true);
            const tagMatch = !tagFilter ||
                             (r.question?.toLowerCase().includes(tagFilter.toLowerCase())) ||
                             (r.notes?.toLowerCase().includes(tagFilter.toLowerCase()));
            return dateMatch && tagMatch;
        });
    };

    const currentPeriodReadings = useMemo(() => getFilteredReadings(timeRange), [readings, timeRange, currentUser, tagFilter]);
    const comparePeriodReadings = useMemo(() => {
        if (!compareMode || timeRange === 'all') return [];
        const offset = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        return getFilteredReadings(timeRange, offset);
    }, [readings, timeRange, compareMode, currentUser, tagFilter]);

    const stats = useAnalytics(currentPeriodReadings, currentUser?.id, currentUser?.birthDate);
    const compareStats = useAnalytics(comparePeriodReadings, currentUser?.id, currentUser?.birthDate);

    const handlePrint = () => window.print();

    return (
        <div className="animate-fade-in pb-20 print:p-0">
            {/* Header / Tab Navigation */}
            <div className="sticky top-20 z-40 bg-[#13131a]/95 backdrop-blur-md border-b border-white/10 pb-4 mb-6 pt-2 print:hidden">
                <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 px-4">
                    <div className="w-full flex justify-between items-center">
                        <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                            &larr; {t('btn.back', language)}
                        </button>

                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto custom-scrollbar">
                            <button onClick={() => setActiveTab('stats')} className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>📊 Statisztika</button>
                            <button onClick={() => setActiveTab('insights')} className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'insights' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>💡 Felismerések</button>
                            <button onClick={() => setActiveTab('numerology')} className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'numerology' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>🔢 Számmisztika</button>
                            <button onClick={() => setActiveTab('compass')} className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'compass' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>🧭 Iránytű</button>
                            <button onClick={() => setActiveTab('monthly')} className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'monthly' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>📅 Havi</button>
                        </div>
                        <button onClick={handlePrint} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-all" title="Nyomtatás">🖨️</button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 w-full border-t border-white/5 pt-4">
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                            <button onClick={() => setTimeRange('7d')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${timeRange === '7d' ? 'bg-white/20 text-white' : 'text-white/40'}`}>7 nap</button>
                            <button onClick={() => setTimeRange('30d')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${timeRange === '30d' ? 'bg-white/20 text-white' : 'text-white/40'}`}>30 nap</button>
                            <button onClick={() => setTimeRange('90d')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${timeRange === '90d' ? 'bg-white/20 text-white' : 'text-white/40'}`}>90 nap</button>
                            <button onClick={() => setTimeRange('all')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${timeRange === 'all' ? 'bg-white/20 text-white' : 'text-white/40'}`}>Összes</button>
                        </div>

                        <input
                            type="text"
                            placeholder="Szűrés témára (pl. munka)..."
                            value={tagFilter}
                            onChange={e => setTagFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none focus:border-gold-500/50 w-48"
                        />

                        {timeRange !== 'all' && (
                            <button
                                onClick={() => setCompareMode(!compareMode)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${compareMode ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'}`}
                            >
                                ⚖️ Összehasonlítás {compareMode ? 'BE' : 'KI'}
                            </button>
                        )}
                    </div>
                    {compareMode && timeRange !== 'all' && (
                        <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest animate-pulse">
                            Összevetés az előző {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} nappal
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto px-4">
                {activeTab === 'stats' && <StatsView stats={stats} compareStats={compareMode ? compareStats : undefined} onSelectCard={setSelectedCard} embedded={true} onBack={()=>{}} />}
                {activeTab === 'insights' && <InsightsView stats={stats} onSelectCard={setSelectedCard} />}
                {activeTab === 'numerology' && <NumerologyView onSelectCard={setSelectedCard} embedded={true} onBack={()=>{}} />}
                {activeTab === 'compass' && <SoulCompass stats={stats} onSelectCard={setSelectedCard} />}
                {activeTab === 'monthly' && <MonthlySummaryView embedded={true} onBack={()=>{}} />}
            </div>

            {selectedCard && <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />}

            <style>{`
                @media print {
                    .glass-panel, .glass-panel-dark { background: white !important; color: black !important; border: 1px solid #ddd !important; box-shadow: none !important; backdrop-filter: none !important; }
                    body { background: white !important; color: black !important; }
                    h1, h2, h3, h4 { color: black !important; }
                    .text-white, .text-gray-300, .text-gold-400 { color: black !important; }
                }
            `}</style>
        </div>
    );
};

const InsightsView = ({ stats, onSelectCard }: { stats: any, onSelectCard: (c: Card) => void }) => {
    const { deck } = useTarot();
    return (
        <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="font-bold text-gold-400 uppercase text-xs mb-4">🔑 Kulcsszavak</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.keywords.map((kw: any, i: number) => (
                            <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs text-white/70" style={{ fontSize: `${Math.max(10, Math.min(24, 10 + kw.value * 2))}px`, opacity: 0.5 + (kw.value / 10) }}>
                                {kw.text}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="font-bold text-indigo-400 uppercase text-xs mb-4">💞 Kártya Párosok</h3>
                    <div className="space-y-4">
                        {stats.cardPairs.map((pair: any, i: number) => {
                            const c1 = deck.find(c => c.id === pair.ids[0]);
                            const c2 = deck.find(c => c.id === pair.ids[1]);
                            return (
                                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-4">
                                            <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/20 shadow-lg cursor-pointer hover:z-10 hover:scale-110 transition-all" onClick={() => c1 && onSelectCard(c1)}>
                                                <CardImage cardId={pair.ids[0]} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/20 shadow-lg cursor-pointer hover:z-10 hover:scale-110 transition-all" onClick={() => c2 && onSelectCard(c2)}>
                                                <CardImage cardId={pair.ids[1]} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-300 font-serif">
                                            <div>{c1?.name}</div>
                                            <div className="text-white/20">&</div>
                                            <div>{c2?.name}</div>
                                        </div>
                                    </div>
                                    <span className="text-gold-500 font-bold text-xs">{pair.count}x</span>
                                </div>
                            );
                        })}
                        {stats.cardPairs.length === 0 && <p className="text-xs opacity-50 italic text-center py-4">Még nincs elég adatod a párosokhoz.</p>}
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
                 <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3"><span>✨</span> Spirituális Útmutatás</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div>
                         <h4 className="text-xs font-bold text-gold-400 uppercase mb-2">Havi Kihívás</h4>
                         <p className="text-sm text-gray-300 italic">"{stats.spiritualChallenge}"</p>
                     </div>
                     <div>
                         <h4 className="text-xs font-bold text-blue-300 uppercase mb-2">Személyes Év</h4>
                         <p className="text-sm text-gray-300">A te rezgésed idén a <strong>{stats.personalYear}</strong>-es szám, ami az önmegvalósítást segíti.</p>
                     </div>
                     <div>
                         <h4 className="text-xs font-bold text-purple-300 uppercase mb-2">Holdfázis Tipp</h4>
                         <p className="text-sm text-gray-300">{stats.favMoon ? `A ${stats.favMoon.name} idején vagy a legnyitottabb a válaszokra.` : 'Húzz több lapot a pontosabb elemzéshez!'}</p>
                     </div>
                 </div>

                 <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                     <h4 className="text-[10px] font-bold text-white/40 uppercase mb-4 tracking-widest">Planétás Órák Eloszlása</h4>
                     <div className="flex items-end gap-1 h-12">
                         {Object.entries(stats.planetHourStats).map(([planet, count]: any) => (
                             <div key={planet} className="flex-1 flex flex-col items-center gap-1 group">
                                 <div className="w-full bg-indigo-500/30 rounded-t-sm group-hover:bg-indigo-500 transition-all" style={{ height: `${Math.max(10, (count / (Math.max(...Object.values(stats.planetHourStats) as number[]) || 1)) * 100)}%` }}></div>
                                 <span className="text-[8px] opacity-40">{planet.substring(0, 2)}</span>
                             </div>
                         ))}
                         {Object.keys(stats.planetHourStats).length === 0 && <div className="w-full text-center text-[10px] opacity-30 italic">Nincs adat az órákról.</div>}
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-10 border-t border-white/5">
                     <div>
                         <h4 className="text-xs font-bold text-emerald-400 uppercase mb-4">🧘 Elemi Egyensúly Tipp</h4>
                         <p className="text-sm text-gray-300 leading-relaxed mb-4">
                             {stats.elements['Tűz'] < stats.totalCards / 8 ? "Hiányzik a tűz: Gyújts gyertyát vagy végezz aktív mozgást!" :
                              stats.elements['Víz'] < stats.totalCards / 8 ? "Hiányzik a víz: Igyál több tiszta vizet és engedd ki az érzelmeidet!" :
                              stats.elements['Levegő'] < stats.totalCards / 8 ? "Hiányzik a levegő: Szellőztess sokat és írd le a gondolataidat!" :
                              stats.elements['Föld'] < stats.totalCards / 8 ? "Hiányzik a föld: Menj ki a természetbe és sétálj mezítláb!" :
                              "Az elemeid csodás egyensúlyban vannak."}
                         </p>
                     </div>
                     <div>
                         <h4 className="text-xs font-bold text-pink-400 uppercase mb-4">🎭 Hangulat és Kártyák</h4>
                         <div className="space-y-4">
                             {stats.moodCorrelations.slice(0, 3).map((corr: any, i: number) => {
                                 const mood = MOODS.find(m => m.id === corr.moodId);
                                 const card = deck.find(c => c.id === corr.cardId);
                                 return (
                                     <div key={i} className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                                         <span className="text-2xl">{mood?.icon}</span>
                                         <div className="flex-1">
                                             <div className="text-[10px] text-white/40 uppercase font-bold">{mood?.label} hangulatban</div>
                                             <div className="text-sm text-gray-200">Gyakori társad: <strong className="text-gold-400">{card?.name || corr.cardId}</strong></div>
                                         </div>
                                         <div
                                             className="w-10 h-14 rounded overflow-hidden border border-white/20 shadow-lg cursor-pointer hover:scale-110 transition-all flex-shrink-0"
                                             onClick={() => card && onSelectCard(card)}
                                         >
                                             <CardImage cardId={corr.cardId} className="w-full h-full object-cover" />
                                         </div>
                                     </div>
                                 );
                             })}
                             {stats.moodCorrelations.length === 0 && <p className="text-xs opacity-50 italic">Még nincs elég adat az összefüggésekhez.</p>}
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};
