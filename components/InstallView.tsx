
import React from 'react';
import { useTarot } from '../context/TarotContext';
import { THEMES } from '../constants';

export const InstallView = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, installPrompt, triggerInstall, exportData, syncToCloud, loadFromCloud, isCloudAvailable, isSyncing, activeThemeKey } = useTarot();
    const theme = THEMES[activeThemeKey] || THEMES['mystic'];

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            <button onClick={onBack} className="mb-6 flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                <span>&larr;</span> Vissza
            </button>

            <div className={`p-8 md:p-12 rounded-3xl shadow-2xl border border-white/10 ${theme.cardBg} mb-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <h2 className="text-4xl font-serif font-bold mb-4 text-white">Fiók és Tárhely</h2>
                <p className="text-white/60 mb-10 max-w-2xl font-light leading-relaxed">
                    Kezeld az adataidat: telepítsd az alkalmazást, mentsd le a felhőbe, vagy készíts biztonsági másolatot.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* App Installation Card */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group flex flex-col">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            📱
                        </div>
                        <h3 className="text-xl font-serif font-bold mb-2 text-gold-400">Telepítés</h3>
                        <p className="text-xs text-gray-400 mb-6 flex-1">
                            Add hozzá a kezdőképernyődhöz az offline eléréshez.
                        </p>
                        
                        {installPrompt ? (
                            <button 
                                onClick={triggerInstall}
                                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-bold text-white text-sm shadow-lg hover:shadow-indigo-500/30 transition-all"
                            >
                                Telepítés
                            </button>
                        ) : (
                            <button 
                                disabled
                                className="w-full py-2 bg-white/5 border border-white/10 rounded-lg font-bold text-white/40 text-sm cursor-not-allowed"
                            >
                                Már telepítve
                            </button>
                        )}
                    </div>

                    {/* Cloud Sync Card */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group flex flex-col relative overflow-hidden">
                        {isSyncing && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center"><div className="animate-spin text-2xl">⏳</div></div>}
                        
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            ☁️
                        </div>
                        <h3 className="text-xl font-serif font-bold mb-2 text-blue-400">Felhő Szinkron</h3>
                        <div className="text-xs text-gray-400 mb-4 flex-1">
                            {isCloudAvailable ? 
                                <span className="text-green-400">● Szerver elérhető</span> : 
                                <span className="text-red-400">● Szerver nem elérhető</span>
                            }
                            <p className="mt-2">Mentsd adataidat az univerzális szerverre.</p>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={syncToCloud}
                                disabled={!isCloudAvailable}
                                className="flex-1 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg font-bold text-white text-xs disabled:opacity-50 transition-all"
                            >
                                ⬆️ Mentés
                            </button>
                            <button 
                                onClick={loadFromCloud}
                                disabled={!isCloudAvailable}
                                className="flex-1 py-2 bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg font-bold text-white text-xs disabled:opacity-50 transition-all"
                            >
                                ⬇️ Letöltés
                            </button>
                        </div>
                    </div>

                    {/* Data Backup Card */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group flex flex-col">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            💾
                        </div>
                        <h3 className="text-xl font-serif font-bold mb-2 text-green-400">Helyi Mentés</h3>
                        <p className="text-xs text-gray-400 mb-6 flex-1">
                            Mentsd le adataidat .json fájlba a saját eszközödre.
                        </p>
                        
                        <button 
                            onClick={exportData}
                            className="w-full py-2 bg-white/10 border border-white/20 rounded-lg font-bold text-white text-sm hover:bg-white/20 hover:border-gold-500/50 hover:text-gold-400 transition-all"
                        >
                            📦 Letöltés
                        </button>
                    </div>
                </div>

                {/* Hosting Info */}
                <div className="mt-8 p-6 bg-black/20 rounded-xl border border-white/5">
                    <h4 className="font-bold text-gold-500 uppercase tracking-widest text-xs mb-3">Tárhely Információ</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Az alkalmazás a Google Firebase Firestore felhő alapú adatbázisát használja. Minden adatod titkosított és csak a bejelentkezett fiókoddal férhetsz hozzá. A "Mentés" és "Letöltés" gombok manuális szinkronizációt indítanak, de a háttérben az adatok automatikusan is frissülnek.
                    </p>
                </div>
            </div>
        </div>
    );
};
