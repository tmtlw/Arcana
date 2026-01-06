
import React, { useState, useMemo, useEffect } from 'react';
import { Card, QuizResult } from '../types';
import { useTarot } from '../context/TarotContext';
import { getCardImage } from '../constants';

type QuizTopic = 'general' | 'love' | 'career' | 'advice';

interface Question {
    card: Card;
    correctAnswer: string;
    options: string[]; // 4 options
}

const TOPICS: { id: QuizTopic, label: string, field: keyof Card }[] = [
    { id: 'general', label: 'Általános Jelentés', field: 'generalMeaning' },
    { id: 'love', label: 'Szerelem & Kapcsolat', field: 'loveMeaning' },
    { id: 'career', label: 'Karrier & Siker', field: 'careerMeaning' },
    { id: 'advice', label: 'Tanács', field: 'advice' }
];

export const QuizView = ({ onBack }: { onBack: () => void }) => {
    const { deck, activeDeck, saveQuizResult, currentUser } = useTarot();
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'summary'>('menu');
    const [selectedTopic, setSelectedTopic] = useState<QuizTopic>('general');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswers, setUserAnswers] = useState<{cardId: string, correct: boolean, user: string, correctAns: string}[]>([]);
    const [animating, setAnimating] = useState(false);

    // Shuffle helper
    const shuffle = (array: any[]) => {
        return array.sort(() => Math.random() - 0.5);
    };

    const startGame = () => {
        const topicField = TOPICS.find(t => t.id === selectedTopic)?.field || 'generalMeaning';
        
        // 1. Select 10 random cards that HAVE content for this topic
        const validDeck = deck.filter(c => {
            const val = c[topicField];
            return typeof val === 'string' && val.length > 10;
        });
        const selectedCards = shuffle([...validDeck]).slice(0, 10);

        const newQuestions: Question[] = selectedCards.map(card => {
            const correctAnswer = card[topicField] as string;
            
            // Get 3 distractors from OTHER cards
            const distractors = shuffle(validDeck.filter(c => c.id !== card.id))
                .slice(0, 3)
                .map(c => c[topicField] as string);
            
            return {
                card,
                correctAnswer,
                options: shuffle([correctAnswer, ...distractors])
            };
        });

        setQuestions(newQuestions);
        setCurrentIndex(0);
        setScore(0);
        setUserAnswers([]);
        setGameState('playing');
    };

    const handleAnswer = (answer: string) => {
        if (animating) return;
        
        const currentQ = questions[currentIndex];
        const isCorrect = answer === currentQ.correctAnswer;
        
        if (isCorrect) setScore(s => s + 1);
        
        setUserAnswers(prev => [...prev, {
            cardId: currentQ.card.id,
            correct: isCorrect,
            user: answer,
            correctAns: currentQ.correctAnswer
        }]);

        setAnimating(true);
        setTimeout(() => {
            setAnimating(false);
            if (currentIndex < 9) {
                setCurrentIndex(i => i + 1);
            } else {
                finishGame();
            }
        }, 500); // Small delay for visual feedback if we add it later
    };

    const finishGame = () => {
        // Calculate final score because state update might lag in handleAnswer's closure if not careful, 
        // but here we rely on the state being updated before render of summary.
        // Actually safe to just change view, score state holds current.
        setGameState('summary');
        
        const finalScore = userAnswers.filter(a => a.correct).length + (questions[9].correctAnswer === userAnswers[9]?.user ? 0 : 0); // Logic fix: score state is accurate enough for display, but for saving we use the array.
        
        // Recalculate score from array to be 100% sure
        let calculatedScore = 0;
        // Wait, userAnswers is updated async. Let's pass the data directly or use effect.
        // Better: do saving in useEffect when gameState changes to summary.
    };

    useEffect(() => {
        if (gameState === 'summary' && userAnswers.length === 10) {
            const finalScore = userAnswers.filter(a => a.correct).length;
            const result: QuizResult = {
                id: Math.random().toString(36),
                date: new Date().toISOString(),
                topic: selectedTopic,
                score: finalScore,
                totalQuestions: 10,
                details: userAnswers.map(a => ({
                    cardId: a.cardId,
                    isCorrect: a.correct,
                    userAnswer: a.user,
                    correctAnswer: a.correctAns
                }))
            };
            saveQuizResult(result);
        }
    }, [gameState]);

    if (gameState === 'menu') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in p-4">
                <button onClick={onBack} className="absolute top-24 left-4 text-white/50 hover:text-white">&larr; Vissza</button>
                <h2 className="text-3xl font-serif font-bold mb-2">Tudás Próba</h2>
                <p className="text-white/60 mb-8 text-center max-w-md">Válassz egy témát, és teszteld a tudásod 10 véletlenszerű kártyával! Minden helyes válasz tapasztalati pontot ér.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {TOPICS.map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setSelectedTopic(t.id)}
                            className={`p-6 rounded-2xl border transition-all text-left group ${selectedTopic === t.id ? 'bg-gold-500/20 border-gold-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                            <span className="text-xl block mb-1">{t.id === 'love' ? '❤️' : t.id === 'career' ? '💼' : t.id === 'advice' ? '💡' : '🔮'}</span>
                            <span className={`font-bold text-lg ${selectedTopic === t.id ? 'text-gold-400' : 'text-gray-300'}`}>{t.label}</span>
                        </button>
                    ))}
                </div>

                <button 
                    onClick={startGame}
                    className="mt-12 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold text-xl px-12 py-4 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-105 transition-transform"
                >
                    Indítás
                </button>
            </div>
        );
    }

    if (gameState === 'playing' && questions.length > 0) {
        const q = questions[currentIndex];
        return (
            <div className="max-w-4xl mx-auto pt-4 pb-20 animate-fade-in">
                <div className="flex justify-between items-center mb-6 px-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">{selectedTopic.toUpperCase()} • {currentIndex + 1} / 10</span>
                    <span className="text-gold-400 font-bold">{score} Pont</span>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    {/* Card Image */}
                    <div className="w-48 md:w-64 flex-shrink-0 perspective-1000">
                        <div className="relative aspect-[2/3] rounded-xl shadow-2xl overflow-hidden border-2 border-white/10 transform transition-transform hover:scale-105">
                            <img src={getCardImage(q.card.id, activeDeck)} className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-4 text-center font-serif font-bold text-xl">{q.card.name}</div>
                    </div>

                    {/* Options */}
                    <div className="flex-1 w-full space-y-3">
                        <h3 className="text-lg mb-4 text-center md:text-left opacity-80">Melyik állítás illik erre a kártyára?</h3>
                        {q.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(opt)}
                                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold-500/50 text-left text-sm md:text-base transition-all duration-200 leading-relaxed active:scale-95"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'summary') {
        const percentage = Math.round((score / 10) * 100);
        let message = "Gyakorlás teszi a mestert!";
        if (percentage >= 50) message = "Nem rossz, alakul!";
        if (percentage >= 80) message = "Kiváló tudás!";
        if (percentage === 100) message = "Tökéletes! Igazi Látnok vagy!";

        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in p-4 text-center">
                <h2 className="text-4xl font-serif font-bold mb-2">Eredmény</h2>
                <div className="text-6xl font-bold text-gold-400 mb-4">{percentage}%</div>
                <p className="text-xl text-gray-300 mb-8">{message}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-8 text-left max-h-[40vh] overflow-y-auto custom-scrollbar p-2">
                    {userAnswers.map((ans, idx) => {
                        const card = questions[idx].card;
                        return (
                            <div key={idx} className={`p-3 rounded-lg border flex items-center gap-3 ${ans.correct ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                                <img src={getCardImage(card.id, activeDeck)} className="w-10 h-14 object-cover rounded" />
                                <div>
                                    <div className="font-bold text-sm">{card.name}</div>
                                    <div className="text-xs opacity-70">{ans.correct ? 'Helyes válasz!' : 'Téves.'}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setGameState('menu')} className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 font-bold">Menü</button>
                    <button onClick={startGame} className="px-6 py-3 rounded-full bg-gold-500 text-black font-bold hover:bg-gold-400">Újra</button>
                </div>
            </div>
        );
    }

    return null;
};
