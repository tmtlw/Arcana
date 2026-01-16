
import React, { useEffect, useState } from 'react';

export interface TutorialStep {
    targetId: string; // DOM ID to highlight
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'center';
    actionRequired?: boolean; // If true, waits for user action (click target)
    onNext?: () => void;
}

interface TutorialOverlayProps {
    steps: TutorialStep[];
    currentStepIndex: number;
    onComplete: () => void;
    onNextStep: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, currentStepIndex, onComplete, onNextStep }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const step = steps[currentStepIndex];

    useEffect(() => {
        const updateRect = () => {
            const el = document.getElementById(step.targetId);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                // Scroll to element
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setTargetRect(null); // Fallback if element not found
            }
        };

        // Delay slightly to allow rendering
        const timer = setTimeout(updateRect, 500);
        window.addEventListener('resize', updateRect);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateRect);
        };
    }, [step, currentStepIndex]);

    if (!step) return null;

    // Overlay Path (SVG with hole)
    // We draw a giant rectangle covering viewport, and subtract the target rect
    const holePath = targetRect
        ? `M0,0 H${window.innerWidth} V${window.innerHeight} H0 Z
           M${targetRect.left - 5},${targetRect.top - 5}
           V${targetRect.bottom + 5}
           H${targetRect.right + 5}
           V${targetRect.top - 5} Z`
        : `M0,0 H${window.innerWidth} V${window.innerHeight} H0 Z`;

    const tooltipStyle: React.CSSProperties = targetRect ? {
        position: 'absolute',
        left: targetRect.left + (targetRect.width / 2) - 150, // Center horizontally (width 300)
        top: step.position === 'top' ? targetRect.top - 150 : targetRect.bottom + 20,
        width: '300px',
    } : {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Dark Backdrop with Hole */}
            <svg className="absolute inset-0 w-full h-full text-black/70 fill-current">
                <path d={holePath} fillRule="evenodd" />
            </svg>

            {/* Spotlight Ring */}
            {targetRect && (
                <div
                    className="absolute border-2 border-gold-500 rounded-lg animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                    style={{
                        left: targetRect.left - 5,
                        top: targetRect.top - 5,
                        width: targetRect.width + 10,
                        height: targetRect.height + 10
                    }}
                />
            )}

            {/* Tooltip Card */}
            <div
                className="bg-[#1a1a2e] border border-gold-500 rounded-xl p-6 shadow-2xl pointer-events-auto animate-fade-in flex flex-col gap-4"
                style={tooltipStyle}
            >
                <div>
                    <h3 className="text-gold-400 font-bold text-lg mb-1">{step.title}</h3>
                    <p className="text-white text-sm leading-relaxed">{step.content}</p>
                </div>

                <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-white/30 font-mono">
                        {currentStepIndex + 1} / {steps.length}
                    </div>
                    <button
                        onClick={() => {
                            if (currentStepIndex < steps.length - 1) onNextStep();
                            else onComplete();
                        }}
                        className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow-lg"
                    >
                        {currentStepIndex < steps.length - 1 ? 'Tovább' : 'Kész'}
                    </button>
                </div>
            </div>
        </div>
    );
};
