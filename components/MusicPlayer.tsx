
import React, { useEffect, useRef, useState } from 'react';
import { useTarot } from '../context/TarotContext';
import { THEMES } from '../constants';

// Simple generative ambient engine
export const MusicPlayer = () => {
    const { currentUser } = useTarot();
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.3);
    
    const audioCtx = useRef<AudioContext | null>(null);
    const oscillators = useRef<any[]>([]);
    const gainNode = useRef<GainNode | null>(null);

    const theme = currentUser?.themePreference || 'mystic';

    const getChord = (t: string) => {
        // Frequencies for different moods
        switch(t) {
            case 'nature': return [110, 164.81, 196, 329.63]; // A Major 9 (Nature/Peaceful)
            case 'dark': return [73.42, 110, 130.81, 220]; // D Minor (Dark/Somber)
            case 'minimal': return [196, 261.63, 392]; // G Major (Simple/Clean)
            case 'mystic': default: return [130.81, 196, 261.63, 329.63]; // C Major 7 (Mystic/Ethereal)
        }
    };

    const stopSound = () => {
        oscillators.current.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        oscillators.current = [];
    };

    const startSound = () => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        stopSound();

        const ctx = audioCtx.current;
        gainNode.current = ctx.createGain();
        gainNode.current.gain.value = volume;
        gainNode.current.connect(ctx.destination);

        // Create drone using multiple sine waves
        const freqs = getChord(theme);
        
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            
            // Add subtle LFO for movement
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1 + (Math.random() * 0.1);
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 5;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();

            // Individual volume for each note to blend
            const oscGain = ctx.createGain();
            oscGain.gain.value = 0.1;
            
            osc.connect(oscGain);
            oscGain.connect(gainNode.current!);
            
            osc.start();
            oscillators.current.push(osc);
            oscillators.current.push(lfo); // Track LFOs to stop them too
        });
    };

    useEffect(() => {
        if (isPlaying) {
            startSound();
        } else {
            stopSound();
        }
        return () => stopSound();
    }, [isPlaying, theme]);

    useEffect(() => {
        if(gainNode.current) {
            gainNode.current.gain.setTargetAtTime(volume, audioCtx.current?.currentTime || 0, 0.5);
        }
    }, [volume]);

    return (
        <div className={`fixed bottom-20 left-4 z-50 glass-panel-dark p-2 rounded-full flex items-center gap-2 transition-all duration-300 ${isPlaying ? 'w-48 px-4 border-gold-500/50 border' : 'w-12 h-12 overflow-hidden hover:w-48 hover:px-4'}`}>
            <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isPlaying ? 'bg-gold-500 text-black' : 'bg-white/10 text-white'}`}
            >
                {isPlaying ? '⏸' : '♫'}
            </button>
            
            <div className={`flex-1 flex items-center gap-2 overflow-hidden transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <span className="text-[10px] uppercase font-bold text-white/50 w-8">Vol</span>
                <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>
    );
};
