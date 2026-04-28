
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

type Tab = 'stats' | 'numerology' | 'compass' | 'monthly';
type TimeRange = '7d' | '30d' | '90d' | 'all';

export const AnalysisView = ({ onBack }: { onBack: () => void }) => {
    const { readings, currentUser, language } = useTarot();
    const [activeTab, setActiveTab] = useState<Tab>('stats');
    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [compareMode, setCompareMode] = useState(false);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);

    // Filter Logic
    const getFilteredReadings = (range: TimeRange, offsetDays: number = 0) => {
        const now = new Date();
        const start = new Date();
        const end = new Date();

        if (range === '7d') start.setDate(now.getDate() - 7 - offsetDays);
        else if (range === '30d') start.setDate(now.getDate() - 30 - offsetDays);
        else if (range === '90d') start.setDate(now.getDate() - 90 - offsetDays);
        else return readings.filter(r => r.userId === currentUser?.id);

        if (offsetDays > 0) {
            end.setDate(now.getDate() - offsetDays);
        }

        return readings.filter(r => {
            if (r.userId !== currentUser?.id) return false;
            const d = new Date(r.date);
            return d >= start && (offsetDays > 0 ? d <= end : true);
        });
    };

    const currentPeriodReadings = useMemo(() => getFilteredReadings(timeRange), [readings, timeRange, currentUser]);
    const comparePeriodReadings = useMemo(() => {
        if (!compareMode || timeRange === 'all') return [];
        const offset = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        return getFilteredReadings(timeRange, offset);
    }, [readings, timeRange, compareMode, currentUser]);

    const stats = useAnalytics(currentPeriodReadings);
    const compareStats = useAnalytics(comparePeriodReadings);

    return (
        <div className="animate-fade-in pb-20">
            {/* Header / Tab Navigation */}
            <div className="sticky top-20 z-40 bg-[#13131a]/95 backdrop-blur-md border-b border-white/10 pb-4 mb-6 pt-2">
                <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 px-4">
                    <div className="w-full flex justify-between items-center">
                        <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                            &larr; {t('btn.back', language)}
                        </button>

                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto custom-scrollbar">
                            <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>📊 Statisztika</button>
                            <button onClick={() => setActiveTab('numerology')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'numerology' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>🔢 Számmisztika</button>
                            <button onClick={() => setActiveTab('compass')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'compass' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>🧭 Lelki Iránytű</button>
                            <button onClick={() => setActiveTab('monthly')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'monthly' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>📅 Havi Összesítő</button>
                        </div>
                        <div className="w-20 hidden md:block"></div>
                    </div>

                    {/* Filter UI */}
                    <div className="flex flex-wrap items-center justify-center gap-4 w-full border-t border-white/5 pt-4">
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                            <button onClick={() => setTimeRange('7d')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${timeRange === '7d' ? 'bg-white/20 text-white' : 'text-white/40'}`}>7 nap</button>
                            <button onClick={() => setTimeRange('30d')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${timeRange === '30d' ? 'bg-white/20 text-white' : 'text-white/40'}`}>30 nap</button>
                            <button onClick={() => setTimeRange('90d')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${timeRange === '90d' ? 'bg-white/20 text-white' : 'text-white/40'}`}>90 nap</button>
                            <button onClick={() => setTimeRange('all')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${timeRange === 'all' ? 'bg-white/20 text-white' : 'text-white/40'}`}>Összes</button>
                        </div>

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
                {activeTab === 'numerology' && <NumerologyView onSelectCard={setSelectedCard} embedded={true} onBack={()=>{}} />}
                {activeTab === 'compass' && <SoulCompass stats={stats} onSelectCard={setSelectedCard} />}
                {activeTab === 'monthly' && <MonthlySummaryView embedded={true} onBack={()=>{}} />}
            </div>

            {selectedCard && <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
        </div>
    );
};
