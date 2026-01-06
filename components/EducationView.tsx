import React, { useState, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { getCardImage, FULL_DECK, THEMES, LESSON_COLORS, LESSON_ICONS } from '../constants';
import { Lesson, LessonCategory, LessonDifficulty, Card, LessonQuizQuestion, QuizResult } from '../types';
import { CardImage } from './CardImage';
import { CardDetailView } from './CardDetailView';
import { CommunityService } from '../services/communityService';
import { AdminService } from '../services/adminService';
import { MarkdownRenderer, MarkdownEditor } from './MarkdownSupport';

const CATEGORIES: {id: LessonCategory, label: string, color: string}[] = [
    { id: 'basics', label: 'Alapismeretek', color: 'from-blue-600 to-indigo-600' },
    { id: 'major', label: 'Nagy Árkánum', color: 'from-purple-600 to-pink-600' },
    { id: 'minor', label: 'Kis Árkánum', color: 'from-emerald-600 to-teal-600' },
    { id: 'symbolism', label: 'Szimbólumok', color: 'from-gold-500 to-orange-500' },
    { id: 'reading', label: 'Olvasási Technikák', color: 'from-red-500 to-rose-600' }
];

export const EducationView = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, updateUser, showToast, allLessons, addCustomLesson, updateCustomLesson, deleteCustomLesson, deck, activeThemeKey, toggleLessonInCollection, saveQuizResult } = useTarot();
    const theme = THEMES[activeThemeKey] || THEMES['mystic'];
    
    // View State
    const [viewMode, setViewMode] = useState<'learn' | 'build' | 'market'>('learn');
    
    // Learn Mode State
    const [selectedCategory, setSelectedCategory] = useState<LessonCategory | 'all'>('all');
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [viewingCard, setViewingCard] = useState<Card | null>(null);

    // Quiz Session State
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, boolean | null>>({});
    const [showQuizResults, setShowQuizResults] = useState(false);

    // Builder Mode State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [newLessonDesc, setNewLessonDesc] = useState("");
    const [newLessonContent, setNewLessonContent] = useState("");
    const [newLessonCategory, setNewLessonCategory] = useState<LessonCategory>('basics');
    const [newLessonDifficulty, setNewLessonDifficulty] = useState<LessonDifficulty>('beginner');
    const [newLessonCards, setNewLessonCards] = useState<string[]>([]);
    const [newLessonColor, setNewLessonColor] = useState(""); 
    const [newLessonIcon, setNewLessonIcon] = useState("📝"); 
    const [newLessonXp, setNewLessonXp] = useState(20); 
    const [newLessonQuiz, setNewLessonQuiz] = useState<LessonQuizQuestion[]>([]);
    
    const [isCardSelectorOpen, setIsCardSelectorOpen] = useState(false);
    const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);

    // Market Mode State
    const [marketLessons, setMarketLessons] = useState<Lesson[]>([]);
    const [isLoadingMarket, setIsLoadingMarket] = useState(false);

    const completedIds = currentUser?.completedLessons || [];
    const collectedIds = currentUser?.lessonCollection || [];
    const filteredLessons = allLessons.filter(l => selectedCategory === 'all' || l.category === selectedCategory);

    // --- LOGIC ---

    const getProgress = (cat: LessonCategory | 'all') => {
        const targetLessons = cat === 'all' ? allLessons : allLessons.filter(l => l.category === cat);
        if (targetLessons.length === 0) return 0;
        const done = targetLessons.filter(l => completedIds.includes(l.id)).length;
        return Math.round((done / targetLessons.length) * 100);
    };

    const startQuiz = () => {
        setQuizAnswers({});
        setShowQuizResults(false);
        setIsQuizModalOpen(true);
    };

    const handleFinishQuiz = async () => {
        if (!selectedLesson || !currentUser) return;

        const questions = selectedLesson.quizQuestions || [];
        const correctCount = questions.reduce((acc, q, idx) => acc + (quizAnswers[idx] === q.isTrue ? 1 : 0), 0);
        const scorePercent = (correctCount / questions.length) * 100;
        
        setShowQuizResults(true);

        // Save result to cloud
        const result: QuizResult = {
            id: `lesson_quiz_${Date.now()}`,
            date: new Date().toISOString(),
            topic: `Lesson: ${selectedLesson.title}`,
            score: correctCount,
            totalQuestions: questions.length,
            details: questions.map((q, idx) => ({
                cardId: selectedLesson.relatedCards?.[0] || 'unknown',
                isCorrect: quizAnswers[idx] === q.isTrue,
                userAnswer: quizAnswers[idx] === true ? 'Igaz' : 'Hamis',
                correctAnswer: q.isTrue ? 'Igaz' : 'Hamis'
            }))
        };
        await saveQuizResult(result);

        // Threshold check: 60%
        if (scorePercent >= 60) {
            if (!completedIds.includes(selectedLesson.id)) {
                const newXp = (currentUser.xp || 0) + selectedLesson.xpReward;
                const completed = [...completedIds, selectedLesson.id];
                
                let newBadges = [...currentUser.badges];
                if (completed.length >= 5 && !newBadges.includes('scholar')) {
                    newBadges.push('scholar');
                    showToast("Jelvény feloldva: Tudós!", "success");
                }

                updateUser({ ...currentUser, xp: newXp, completedLessons: completed, badges: newBadges });
                showToast(`Sikeres vizsga (${Math.round(scorePercent)}%)! +${selectedLesson.xpReward} XP`, "success");
            }
        } else {
            showToast(`Sajnos nem érte el a 60%-ot (${Math.round(scorePercent)}%). Próbálja újra!`, "info");
        }
    };

    const handleCompleteLesson = (lesson: Lesson) => {
        if (!currentUser) return;
        
        // If there's a quiz, check if it was completed successfully
        if (lesson.quizQuestions && lesson.quizQuestions.length > 0 && !completedIds.includes(lesson.id)) {
            startQuiz();
            return;
        }

        setSelectedLesson(null);
    };

    const openBuilder = (lesson?: Lesson) => {
        if (lesson) {
            setEditingId(lesson.id);
            setNewLessonTitle(lesson.title);
            setNewLessonDesc(lesson.description);
            setNewLessonContent(lesson.content);
            setNewLessonCategory(lesson.category);
            setNewLessonDifficulty(lesson.difficulty);
            setNewLessonCards(lesson.relatedCards || []);
            setNewLessonColor(lesson.color || "");
            setNewLessonIcon(lesson.icon || "📝");
            setNewLessonXp(lesson.xpReward || 20);
            setNewLessonQuiz(lesson.quizQuestions || []);
        } else {
            setEditingId(null);
            setNewLessonTitle("");
            setNewLessonDesc("");
            setNewLessonContent("");
            setNewLessonCategory('basics');
            setNewLessonDifficulty('beginner');
            setNewLessonCards([]);
            setNewLessonColor("");
            setNewLessonIcon("📝");
            setNewLessonXp(20);
            setNewLessonQuiz([]);
        }
        setViewMode('build');
    };

    const handleSaveLesson = async () => {
        if (!newLessonTitle || !newLessonContent) {
            alert("A cím és a tartalom kötelező!");
            return;
        }
        
        const lessonData: Lesson = {
            id: editingId || `custom_${Date.now()}`,
            title: newLessonTitle,
            description: newLessonDesc,
            content: newLessonContent,
            category: newLessonCategory,
            difficulty: newLessonDifficulty,
            xpReward: newLessonXp,
            relatedCards: newLessonCards,
            icon: newLessonIcon,
            color: newLessonColor,
            quizQuestions: newLessonQuiz,
            isCustom: true,
            author: currentUser?.name || 'Ismeretlen',
            userId: currentUser?.id
        };

        if (editingId) {
            if (currentUser?.isAdmin) {
                try {
                    await AdminService.saveSystemLesson(lessonData);
                    showToast("Rendszerlecke frissítve (Admin)!", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } catch (e) {
                    alert("Hiba a mentéskor: " + e);
                }
            } else {
                updateCustomLesson(lessonData);
                showToast("Saját lecke frissítve!", "success");
            }
        } else {
            addCustomLesson(lessonData);
            showToast("Lecke sikeresen létrehozva!", "success");
        }
        
        setViewMode('learn');
    };

    const handleAddQuizQuestion = () => {
        setNewLessonQuiz([...newLessonQuiz, { statement: "", isTrue: true }]);
    };

    const handleUpdateQuizQuestion = (index: number, field: keyof LessonQuizQuestion, value: any) => {
        const updated = [...newLessonQuiz];
        updated[index] = { ...updated[index], [field]: value };
        setNewLessonQuiz(updated);
    };

    const handleRemoveQuizQuestion = (index: number) => {
        setNewLessonQuiz(newLessonQuiz.filter((_, i) => i !== index));
    };

    const handlePublishLesson = async (lesson: Lesson, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        if (confirm(`Publikálod a "${lesson.title}" leckét a Piactéren?`)) {
            const success = await CommunityService.publishLesson(lesson, currentUser.name, currentUser.id);
            if (success) showToast("Lecke sikeresen publikálva!", "success");
            else showToast("Hiba a publikáláskor.", "info");
        }
    };

    const handleDeleteCustomLesson = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteCustomLesson(id);
        showToast("Lecke törölve.", "info");
    };

    const loadMarketLessons = async () => {
        setIsLoadingMarket(true);
        const lessons = await CommunityService.getPublicLessons();
        setMarketLessons(lessons);
        setIsLoadingMarket(false);
    };

    const handleCardClick = (cardId: string) => {
        const cardData = (deck || []).find(c => c.id === cardId);
        if (cardData) {
            setViewingCard(cardData);
        }
    };

    // --- RENDER: DETAIL VIEW ---
    if (selectedLesson) {
        const isDone = completedIds.includes(selectedLesson.id);
        const baseCatColor = CATEGORIES.find(c => c.id === selectedLesson.category)?.color || 'from-gray-700 to-gray-900';
        const displayColor = selectedLesson.color || baseCatColor;
        const isOwner = selectedLesson.userId === currentUser?.id;
        const canEdit = isOwner || currentUser?.isAdmin;

        const quizQuestions = selectedLesson.quizQuestions || [];
        const allQuizAnswered = quizQuestions.every((_, i) => quizAnswers[i] !== undefined);
        const correctCount = quizQuestions.reduce((acc, q, idx) => acc + (quizAnswers[idx] === q.isTrue ? 1 : 0), 0);
        const scorePercent = (correctCount / quizQuestions.length) * 100;
        const passed = scorePercent >= 60;

        return (
            <div className="animate-fade-in max-w-4xl mx-auto pb-24">
                
                {viewingCard && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setViewingCard(null)}>
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar glass-panel-dark rounded-3xl border border-white/20 p-2 md:p-6" onClick={e => e.stopPropagation()}>
                            <CardDetailView card={viewingCard} theme={theme} onBack={() => setViewingCard(null)} />
                        </div>
                        <button onClick={() => setViewingCard(null)} className="absolute top-4 right-4 text-white hover:text-gold-400 text-3xl z-[101]">&times;</button>
                    </div>
                )}

                {/* QUIZ MODAL - NEW */}
                {isQuizModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                        <div className="glass-panel-dark w-full max-w-2xl rounded-3xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-gold-400">Tudás Próba</h3>
                                    <p className="text-xs text-white/40 uppercase tracking-widest">{selectedLesson.title}</p>
                                </div>
                                {!showQuizResults && <button onClick={() => setIsQuizModalOpen(false)} className="text-white/50 hover:text-white text-2xl">✕</button>}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {quizQuestions.map((q, idx) => {
                                    const userAns = quizAnswers[idx];
                                    const isCorrect = userAns === q.isTrue;
                                    
                                    return (
                                        <div key={idx} className={`p-5 rounded-2xl border transition-all ${showQuizResults ? (isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5') : 'border-white/5 bg-white/5'}`}>
                                            <p className="text-white text-md mb-4 text-center leading-relaxed">"{q.statement}"</p>
                                            
                                            <div className="flex justify-center gap-4">
                                                <button 
                                                    disabled={showQuizResults}
                                                    onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: true })}
                                                    className={`px-6 py-2 rounded-full font-bold text-xs transition-all border ${quizAnswers[idx] === true ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'}`}
                                                >
                                                    IGAZ
                                                </button>
                                                <button 
                                                    disabled={showQuizResults}
                                                    onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: false })}
                                                    className={`px-6 py-2 rounded-full font-bold text-xs transition-all border ${quizAnswers[idx] === false ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'}`}
                                                >
                                                    HAMIS
                                                </button>
                                            </div>

                                            {showQuizResults && (
                                                <div className={`mt-4 text-center text-[10px] font-bold uppercase tracking-widest ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isCorrect ? '✓ Helyes' : `✕ Téves (Helyes: ${q.isTrue ? 'Igaz' : 'Hamis'})`}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {showQuizResults && (
                                    <div className={`mt-8 p-6 rounded-2xl text-center border-2 ${passed ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                                        <div className="text-3xl font-bold text-white mb-2">{Math.round(scorePercent)}%</div>
                                        <p className="text-sm text-white/80 mb-4">{passed ? 'Gratulálunk! Sikeresen teljesítette a vizsgát.' : 'A vizsga sikertelen. Legalább 60% szükséges a jutalomhoz.'}</p>
                                        <div className="flex gap-4 justify-center">
                                            {!passed && (
                                                <button onClick={() => setShowQuizResults(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-all">Újrapróbálkozás</button>
                                            )}
                                            <button onClick={() => setIsQuizModalOpen(false)} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${passed ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-500/20 text-red-200'}`}>Bezárás</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!showQuizResults && (
                                <div className="p-6 border-t border-white/10 bg-black/40">
                                    <button 
                                        onClick={handleFinishQuiz}
                                        disabled={!allQuizAnswered}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
                                    >
                                        Eredmények Ellenőrzése
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                        &larr; Vissza az Akadémiára
                    </button>
                    {canEdit && (
                        <button 
                            onClick={() => openBuilder(selectedLesson)}
                            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-sm border border-white/10 transition-colors"
                        >
                            ✏️ Szerkesztés {currentUser?.isAdmin && !isOwner ? '(Admin)' : ''}
                        </button>
                    )}
                </div>

                {/* Hero Header */}
                <div className={`relative rounded-3xl overflow-hidden p-8 md:p-12 mb-8 bg-gradient-to-r ${displayColor} shadow-2xl border border-white/10`}>
                    <div className="absolute top-0 right-0 text-9xl opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">{selectedLesson.icon}</div>
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="bg-black/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm shadow-sm">
                                {CATEGORIES.find(c => c.id === selectedLesson.category)?.label}
                            </span>
                            <span className={`bg-black/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm shadow-sm ${selectedLesson.difficulty === 'advanced' ? 'border border-red-500/30' : ''}`}>
                                {selectedLesson.difficulty}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 shadow-black drop-shadow-md leading-tight">
                            {selectedLesson.title}
                        </h1>
                        <p className="text-lg text-white/90 max-w-2xl leading-relaxed italic border-l-4 border-white/30 pl-4">
                            {selectedLesson.description}
                        </p>
                    </div>
                </div>

                {/* Content Body */}
                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 mb-8 space-y-8 bg-black/40 shadow-xl">
                    <MarkdownRenderer content={selectedLesson.content} className="prose prose-invert prose-lg max-w-none" />

                    {selectedLesson.relatedCards && selectedLesson.relatedCards.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-white/10">
                            <h3 className="text-xl font-bold text-gold-400 mb-6 flex items-center gap-2 uppercase tracking-widest text-sm">
                                <span>🃏</span> Kapcsolódó Kártyák
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {selectedLesson.relatedCards.map(cid => {
                                    const cardData = (deck || []).find(c => c.id === cid);
                                    return (
                                        <div 
                                            key={cid} 
                                            onClick={() => handleCardClick(cid)}
                                            className="cursor-pointer group relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 hover:border-gold-500 hover:shadow-gold-500/20 transition-all duration-300 transform hover:-translate-y-1"
                                        >
                                            <CardImage cardId={cid} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm">
                                                <div className="text-2xl mb-1">👁️</div>
                                                <div className="text-xs font-bold text-white uppercase leading-tight">{cardData?.name}</div>
                                                <div className="text-[10px] text-gold-400 mt-2 font-bold">MEGNYITÁS &rarr;</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-md border-t border-white/10 flex justify-center z-40">
                    <button 
                        onClick={() => handleCompleteLesson(selectedLesson)}
                        className={`px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-3 ${isDone ? 'bg-green-600/20 text-green-400 border border-green-500/50' : 'bg-gradient-to-r from-gold-500 to-orange-500 text-black hover:shadow-gold-500/20'}`}
                    >
                        {isDone ? (
                            <><span>✓</span> Lecke Teljesítve</>
                        ) : (
                            <><span>🎓</span> Vizsga és Teljesítés (+{selectedLesson.xpReward} XP)</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // --- MARKETPLACE ---
    if (viewMode === 'market') {
        if (!marketLessons.length && !isLoadingMarket) loadMarketLessons();

        return (
            <div className="animate-fade-in max-w-6xl mx-auto pb-20">
                <button onClick={() => setViewMode('learn')} className="mb-6 flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                    &larr; Vissza
                </button>
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">
                        Tudás Piactér
                    </h2>
                    <p className="text-white/60 mt-2">Adj leckéket a gyűjteményedhez a közösségtől.</p>
                </div>

                {isLoadingMarket ? (
                    <div className="text-center py-20 text-white/50">Betöltés...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketLessons.map(lesson => {
                            const isCollected = collectedIds.includes(lesson.id);
                            return (
                                <div key={lesson.id} className={`glass-panel p-6 rounded-2xl flex flex-col border transition-colors ${isCollected ? 'border-gold-500/50 bg-gold-500/5' : 'border-white/10 hover:bg-white/5'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{lesson.title}</h3>
                                            <p className="text-xs text-gold-400">Szerző: {lesson.author}</p>
                                        </div>
                                        <div className="text-xs bg-white/10 px-2 py-1 rounded">⬇ {lesson.downloads || 0}</div>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-3">{lesson.description}</p>
                                    <button 
                                        onClick={() => toggleLessonInCollection(lesson.id)}
                                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${isCollected ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'}`}
                                    >
                                        {isCollected ? 'Eltávolítás' : 'Hozzáadás'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // --- BUILDER ---
    if (viewMode === 'build') {
        return (
            <div className="animate-fade-in max-w-3xl mx-auto pb-20">
                <button onClick={() => setViewMode('learn')} className="mb-6 flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                    &larr; Mégse
                </button>
                
                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                    <h2 className="text-2xl font-serif font-bold text-white mb-6">
                        {editingId ? `Lecke Szerkesztése` : 'Új Lecke Létrehozása'}
                    </h2>
                    
                    <div className="space-y-6">
                        <div className={`p-6 rounded-xl bg-gradient-to-r ${newLessonColor || 'from-gray-700 to-gray-800'} text-white border border-white/10`}>
                            <div className="flex items-center gap-4 mb-4">
                                <button 
                                    onClick={() => setIsIconSelectorOpen(!isIconSelectorOpen)} 
                                    className="w-16 h-16 rounded-xl bg-black/30 flex items-center justify-center text-4xl hover:bg-black/50 transition-colors border border-white/20"
                                >
                                    {newLessonIcon}
                                </button>
                                <div className="flex-1">
                                    <input 
                                        value={newLessonTitle} 
                                        onChange={e => setNewLessonTitle(e.target.value)} 
                                        className="w-full bg-transparent border-b border-white/30 text-2xl font-bold placeholder-white/50 focus:outline-none focus:border-white" 
                                        placeholder="Lecke Címe" 
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                                <span className="text-xs uppercase font-bold opacity-60 w-full mb-1">Fejléc Színe:</span>
                                {LESSON_COLORS.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setNewLessonColor(c.class)}
                                        className={`w-8 h-8 rounded-full bg-gradient-to-r ${c.class} border-2 ${newLessonColor === c.class ? 'border-white scale-110' : 'border-transparent hover:border-white/50'}`}
                                    />
                                ))}
                                <button onClick={() => setNewLessonColor("")} className="w-8 h-8 rounded-full bg-gray-700 border border-white/10 flex items-center justify-center text-xs">✕</button>
                            </div>

                            {isIconSelectorOpen && (
                                <div className="mt-4 p-4 bg-black/80 rounded-xl border border-white/10 grid grid-cols-8 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {LESSON_ICONS.map(icon => (
                                        <button 
                                            key={icon} 
                                            onClick={() => { setNewLessonIcon(icon); setIsIconSelectorOpen(false); }}
                                            className="text-2xl hover:scale-125 transition-transform"
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold uppercase text-white/50">Jutalom (XP)</label>
                                <span className="text-gold-400 font-bold">{newLessonXp} XP</span>
                            </div>
                            <input 
                                type="range" min="0" max="50" step="5" 
                                value={newLessonXp} 
                                onChange={e => setNewLessonXp(parseInt(e.target.value))}
                                className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-white/50 mb-1">Kategória</label>
                                <select value={newLessonCategory} onChange={e => setNewLessonCategory(e.target.value as any)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white">
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-white/50 mb-1">Nehézség</label>
                                <select value={newLessonDifficulty} onChange={e => setNewLessonDifficulty(e.target.value as any)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white">
                                    <option value="beginner">Kezdő</option>
                                    <option value="intermediate">Haladó</option>
                                    <option value="advanced">Mester</option>
                                </select>
                            </div>
                        </div>

                        <textarea value={newLessonDesc} onChange={e => setNewLessonDesc(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white h-20 resize-none" placeholder="Rövid leírás..." />
                        <MarkdownEditor value={newLessonContent} onChange={setNewLessonContent} height="h-80" placeholder="Lecke tartalma..." />

                        {/* Card Selector */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-white/50 mb-2">Kapcsolódó Kártyák ({newLessonCards.length})</label>
                            <button onClick={() => setIsCardSelectorOpen(!isCardSelectorOpen)} className="bg-white/10 px-4 py-2 rounded-lg text-sm font-bold border border-white/20 hover:bg-white/20">
                                {isCardSelectorOpen ? 'Választó bezárása' : 'Kártyák kiválasztása'}
                            </button>
                            {isCardSelectorOpen && (
                                <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/10 h-60 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-2 custom-scrollbar">
                                    {FULL_DECK.map(card => (
                                        <div 
                                            key={card.id} 
                                            onClick={() => setNewLessonCards(prev => prev.includes(card.id) ? prev.filter(c => c !== card.id) : [...prev, card.id])}
                                            className={`p-2 rounded cursor-pointer text-xs font-bold border ${newLessonCards.includes(card.id) ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/5 text-white/50 border-white/10'}`}
                                        >
                                            {card.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* QUIZ BUILDER - RESTORED & UPDATED */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-white/50 mb-4">Tudás Próba (Állítások)</label>
                            <div className="space-y-4">
                                {newLessonQuiz.map((q, idx) => (
                                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gold-400">#{idx + 1} Állítás</span>
                                            <button onClick={() => handleRemoveQuizQuestion(idx)} className="text-red-400 hover:text-red-500 text-xs font-bold">Törlés</button>
                                        </div>
                                        <input 
                                            value={q.statement}
                                            onChange={e => handleUpdateQuizQuestion(idx, 'statement', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm text-white"
                                            placeholder="Írj egy állítást a leckével kapcsolatban..."
                                        />
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-white/50">Helyes válasz:</span>
                                            <button 
                                                onClick={() => handleUpdateQuizQuestion(idx, 'isTrue', !q.isTrue)}
                                                className={`px-4 py-1 rounded text-xs font-bold transition-all ${q.isTrue ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                                            >
                                                {q.isTrue ? 'IGAZ' : 'HAMIS'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={handleAddQuizQuestion}
                                    className="w-full py-3 bg-white/5 border border-white/10 border-dashed rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    + Új Állítás Hozzáadása
                                </button>
                            </div>
                        </div>

                        <button onClick={handleSaveLesson} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg mt-6">
                            {editingId ? 'Módosítások Mentése' : 'Lecke Létrehozása'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                    &larr; Vissza
                </button>
                <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/10">
                    <span className="text-xs font-bold uppercase text-white/50">Haladás</span>
                    <div className="w-20 md:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${getProgress('all')}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-green-400">{getProgress('all')}%</span>
                </div>
            </div>

            <div className="text-center mb-10">
                <h2 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400">
                    Tarot Akadémia
                </h2>
                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={() => openBuilder()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold border border-white/10 transition-colors">➕ Új Lecke</button>
                    <button onClick={() => setViewMode('market')} className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 rounded-lg text-sm font-bold border border-indigo-500/30 transition-colors">🛒 Piactér</button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-6 mb-4 custom-scrollbar justify-start md:justify-center">
                <button onClick={() => setSelectedCategory('all')} className={`px-6 py-3 rounded-xl font-bold text-sm border ${selectedCategory === 'all' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/50 border-white/10'}`}>Összes</button>
                {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all whitespace-nowrap ${selectedCategory === cat.id ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg` : 'bg-white/5 text-white/50 border-white/10'}`}>{cat.label}</button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map((lesson) => {
                    const done = completedIds.includes(lesson.id);
                    const isCollected = collectedIds.includes(lesson.id);
                    const catTheme = CATEGORIES.find(c => c.id === lesson.category);
                    const isCustom = lesson.isCustom;
                    const canEdit = lesson.userId === currentUser?.id || currentUser?.isAdmin;
                    const displayColor = lesson.color || catTheme?.color || 'from-gray-700 to-gray-800';
                    
                    return (
                        <div 
                            key={lesson.id} onClick={() => setSelectedLesson(lesson)} 
                            className={`glass-panel rounded-2xl cursor-pointer transition-all group relative overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl border ${done ? 'border-green-500/30' : isCollected ? 'border-gold-500/50 shadow-gold-500/10' : 'border-white/10'}`}
                        >
                            <div className={`h-2 w-full bg-gradient-to-r ${displayColor}`}></div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{lesson.icon}</div>
                                    <div className="flex gap-2">
                                        {done && <div className="bg-green-500/20 text-green-400 p-1 rounded-full border border-green-500/50">✓</div>}
                                        {isCustom && <div className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-[10px] font-bold border border-blue-500/50">EGYÉNI</div>}
                                    </div>
                                </div>
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{catTheme?.label}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${lesson.difficulty === 'beginner' ? 'border-green-500/30 text-green-300' : lesson.difficulty === 'intermediate' ? 'border-yellow-500/30 text-yellow-300' : 'border-red-500/30 text-red-300'}`}>{lesson.difficulty}</span>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">{lesson.title}</h3>
                                <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">{lesson.description}</p>
                                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                                    <div className="flex gap-2">
                                        <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">+{lesson.xpReward} XP</span>
                                        {canEdit && <button onClick={(e) => { e.stopPropagation(); openBuilder(lesson); }} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded">✎</button>}
                                        {isCustom && lesson.userId === currentUser?.id && <button onClick={(e) => handlePublishLesson(lesson, e)} className="text-[10px] bg-white/10 px-2 py-1 rounded">☁️</button>}
                                        {isCustom && <button onClick={(e) => handleDeleteCustomLesson(lesson.id, e)} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded">✕</button>}
                                    </div>
                                    <span className="text-xs text-white/40 font-bold uppercase group-hover:text-white transition-colors">Kezdés &rarr;</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
