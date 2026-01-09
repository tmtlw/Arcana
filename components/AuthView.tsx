
import React, { useState } from 'react';
import { useTarot } from '../context/TarotContext';
import { t } from '../services/i18nService';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

export const AuthView = () => {
    const { users, setCurrentUser, addUser, language, setLanguage, globalSettings } = useTarot();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Local login (offline/legacy)
    const handleLocalLogin = (user: any) => {
        setCurrentUser(user);
    };

    const handleEmailAuth = async () => {
        if (!auth) {
            setError("A Firebase nincs beállítva. Kérlek ellenőrizd a services/firebase.ts fájlt.");
            return;
        }

        if (mode === 'register' && globalSettings?.enableRegistration === false) {
            setError("A regisztráció jelenleg ki van kapcsolva az adminisztrátor által.");
            return;
        }

        setError("");
        setLoading(true);
        try {
            if (mode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (e: any) {
            console.error(e);
            if (e.code === 'auth/invalid-credential') setError("Hibás email vagy jelszó.");
            else if (e.code === 'auth/email-already-in-use') setError("Ez az email már regisztrálva van.");
            else if (e.code === 'auth/weak-password') setError("A jelszó túl gyenge (min. 6 karakter).");
            else setError("Hiba történt: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!auth || !googleProvider) {
            setError("A Firebase nincs beállítva. Kérlek ellenőrizd a services/firebase.ts fájlt.");
            return;
        }
        setError("");
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e: any) {
            console.error(e);
            if (e.code === 'auth/unauthorized-domain') {
                setError(`Ez a domain (${window.location.hostname}) nincs engedélyezve a Firebase konzolon. (Authentication > Settings > Authorized Domains)`);
            } else if (e.code === 'auth/popup-closed-by-user') {
                setError("A bejelentkezést megszakították.");
            } else if (e.code === 'auth/cancelled-popup-request') {
                // Ignore multiple clicks
            } else {
                setError("Google bejelentkezés hiba: " + e.message);
            }
        }
    };

    const handleGuestLogin = async () => {
        if (!auth) {
            setError("A Firebase nincs beállítva.");
            return;
        }
        setError("");
        try {
            await signInAnonymously(auth);
        } catch (e: any) {
            console.error(e);
            setError("Vendég bejelentkezés hiba: " + e.message + " (Ellenőrizd, hogy az Anonymous auth engedélyezve van-e a Firebase konzolon!)");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_#312e81_0%,_#000000_100%)] relative">
            
            {/* Language Switcher */}
            <div className="absolute top-4 right-4 flex gap-2 z-50">
                <button 
                    onClick={() => setLanguage('hu')} 
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${language === 'hu' ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/10 text-white border-white/20'}`}
                >
                    HU
                </button>
                <button 
                    onClick={() => setLanguage('en')} 
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${language === 'en' ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/10 text-white border-white/20'}`}
                >
                    EN
                </button>
            </div>

            <div className="glass-panel p-8 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-[50px]"></div>
                
                <div className="text-center mb-8 relative z-10">
                    <div className="text-6xl mb-4 animate-float">🔮</div>
                    <h1 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-white">
                        {t('app.title', language)}
                    </h1>
                    <p className="text-white/60 text-sm mt-2">{t('auth.welcome', language)}</p>
                </div>

                {/* Error Message */}
                {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-xl mb-4 text-sm text-center font-bold">{error}</div>}

                <div className="flex bg-black/30 rounded-full p-1 mb-6 relative z-10">
                    <button 
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                    >
                        {t('auth.login', language)}
                    </button>
                    {globalSettings?.enableRegistration !== false && (
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${mode === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            {t('auth.register', language)}
                        </button>
                    )}
                </div>

                <div className="space-y-4 relative z-10">
                    <div>
                        <input 
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-colors"
                            placeholder="Email cím"
                        />
                    </div>
                    <div>
                        <input 
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-colors"
                            placeholder="Jelszó"
                            onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                        />
                    </div>
                    <button 
                        onClick={handleEmailAuth}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold rounded-xl shadow-lg hover:shadow-gold-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Folyamatban...' : (mode === 'login' ? 'Bejelentkezés' : 'Fiók Létrehozása')}
                    </button>
                </div>

                {/* Google Login Separator */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1e1b4b] px-2 text-white/40">Vagy</span></div>
                </div>

                <div className="space-y-3 relative z-10">
                    {/* Google Button */}
                    <button 
                        onClick={handleGoogleLogin}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-lg"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        Google Bejelentkezés
                    </button>

                    {/* Guest Button */}
                    <button 
                        onClick={handleGuestLogin}
                        className="w-full py-3 bg-white/5 border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                    >
                        👤 Vendég Bejelentkezés (Teszt)
                    </button>
                </div>

                {/* Local Users (Legacy) */}
                {users.length > 0 && mode === 'login' && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-xs text-center text-white/30 mb-4 uppercase tracking-widest">Helyi (Offline) Fiókok</p>
                        <div className="max-h-[150px] overflow-y-auto custom-scrollbar space-y-2">
                            {users.map(u => (
                                <button 
                                    key={u.id}
                                    onClick={() => handleLocalLogin(u)}
                                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-3 text-sm text-left transition-colors"
                                >
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-300">{u.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
