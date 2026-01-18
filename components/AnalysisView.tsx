
import React, { useState } from 'react';
import { StatsView } from './StatsView';
import { NumerologyView } from './NumerologyView';
import { SoulCompass } from './SoulCompass';
import { MonthlySummaryView } from './MonthlySummaryView';
import { t } from '../services/i18nService';
import { useTarot } from '../context/TarotContext';

type Tab = 'stats' | 'numerology' | 'compass' | 'monthly';

export const AnalysisView = ({ onBack }: { onBack: () => void }) => {
    const { language } = useTarot();
    const [activeTab, setActiveTab] = useState<Tab>('stats');

    return (
        <div className="animate-fade-in pb-20">
            {/* Header / Tab Navigation */}
            <div className="sticky top-20 z-40 bg-[#13131a]/95 backdrop-blur-md border-b border-white/10 pb-4 mb-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
                    <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors self-start md:self-auto">
                        &larr; {t('btn.back', language)}
                    </button>

                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}
                        >
                            📊 Statisztika
                        </button>
                        <button
                            onClick={() => setActiveTab('numerology')}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'numerology' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}
                        >
                            🔢 Számmisztika
                        </button>
                        <button
                            onClick={() => setActiveTab('compass')}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'compass' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}
                        >
                            🧭 Lelki Iránytű
                        </button>
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'monthly' ? 'bg-gold-500 text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}
                        >
                            📅 Havi Összesítő
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto px-4">
                {activeTab === 'stats' && <StatsView onBack={() => {}} embedded={true} />}
                {activeTab === 'numerology' && <NumerologyView onBack={() => {}} embedded={true} />}
                {activeTab === 'compass' && <SoulCompass />}
                {activeTab === 'monthly' && <MonthlySummaryView onBack={() => {}} embedded={true} />}
            </div>
        </div>
    );
};
