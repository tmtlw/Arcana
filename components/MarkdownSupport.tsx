
import React, { useRef, useState } from 'react';
import { CardImage } from './CardImage';

// --- CONFIG ---
const COLORS = [
    { label: 'Arany', value: '#fbbf24', bgValue: 'rgba(251, 191, 36, 0.3)' },
    { label: 'Piros', value: '#f87171', bgValue: 'rgba(248, 113, 113, 0.3)' },
    { label: 'Zöld', value: '#4ade80', bgValue: 'rgba(74, 222, 128, 0.3)' },
    { label: 'Kék', value: '#60a5fa', bgValue: 'rgba(96, 165, 250, 0.3)' },
    { label: 'Lila', value: '#a78bfa', bgValue: 'rgba(167, 139, 250, 0.3)' },
    { label: 'Fehér/Szürke', value: '#e2e8f0', bgValue: 'rgba(255, 255, 255, 0.1)' },
    { label: 'Fekete', value: '#000000', bgValue: 'rgba(0, 0, 0, 0.5)' },
];

// --- PARSING LOGIC ---

const parseInline = (text: string): React.ReactNode[] => {
    if (!text) return [];
    const processSegment = (segment: string, keyPrefix: string): React.ReactNode => {
        const parts = segment.split(/(\{[cb]:[^|}]+\|.*?\})/g);
        return parts.map((part, i) => {
            const key = `${keyPrefix}-${i}`;
            if (part.match(/^\{c:([^|]+)\|(.*)\}$/)) {
                const match = part.match(/^\{c:([^|]+)\|(.*)\}$/);
                if (match) {
                    const [, color, content] = match;
                    return <span key={key} style={{ color }}>{processSegment(content, key + 'c')}</span>;
                }
            }
            if (part.match(/^\{b:([^|]+)\|(.*)\}$/)) {
                const match = part.match(/^\{b:([^|]+)\|(.*)\}$/);
                if (match) {
                    const [, color, content] = match;
                    return <span key={key} style={{ backgroundColor: color, padding: '2px 4px', borderRadius: '4px' }}>{processSegment(content, key + 'b')}</span>;
                }
            }
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            if (boldParts.length > 1) {
                return boldParts.map((bp, bi) => {
                    if (bp.startsWith('**') && bp.endsWith('**')) {
                        return <strong key={`${key}-b-${bi}`} className="text-white font-bold">{processSegment(bp.slice(2, -2), key + 'bold')}</strong>;
                    }
                    return processSegment(bp, `${key}-b-${bi}`);
                });
            }
            const italicParts = part.split(/(\*.*?\*)/g);
            if (italicParts.length > 1) {
                return italicParts.map((ip, ii) => {
                    if (ip.startsWith('*') && ip.endsWith('*')) {
                        return <em key={`${key}-i-${ii}`} className="text-gold-200">{ip.slice(1, -1)}</em>;
                    }
                    return ip;
                });
            }
            return part;
        });
    };
    const result = processSegment(text, 'root');
    return Array.isArray(result) ? result : [result];
};

const renderTable = (lines: string[], key: string) => {
    if (lines.length < 2) return null;
    const headers = lines[0].split('|').map(c => c.trim()).filter(c => c);
    const bodyLines = lines.slice(2);
    return (
        <div key={key} className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-black/20">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-white/5 text-gold-400 font-bold uppercase text-xs">
                    <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3 border-b border-white/10 whitespace-nowrap">{parseInline(h)}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {bodyLines.map((line, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                            {line.split('|').map(c => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length-1 && c === '')).map((cell, cellIdx) => (
                                <td key={cellIdx} className="px-4 py-3 border-r border-white/5 last:border-r-0 text-gray-300">{parseInline(cell)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const parseMarkdown = (text: string, onSelectCard?: (id: string) => void) => {
    if (!text) return [];
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trimEnd();
        if (line.trim().startsWith('|')) {
            tableBuffer.push(line);
            if (i === lines.length - 1) elements.push(renderTable(tableBuffer, `tbl-${i}`));
            continue;
        } else if (tableBuffer.length > 0) {
            elements.push(renderTable(tableBuffer, `tbl-${i}`));
            tableBuffer = [];
        }

        // Image/Card Detection
        const cardMatch = line.match(/^!\[card\]\((.*?)\)$/);
        if (cardMatch) {
            const cardId = cardMatch[1];
            elements.push(
                <div key={i} className="flex justify-center my-6 group">
                    <div
                        className={`w-32 aspect-[2/3] rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl transition-all ${onSelectCard ? 'cursor-pointer hover:scale-105 hover:border-gold-500' : ''}`}
                        onClick={() => onSelectCard?.(cardId)}
                    >
                        <CardImage cardId={cardId} className="w-full h-full object-cover" />
                    </div>
                </div>
            );
            continue;
        }

        if (line.startsWith('# ')) { elements.push(<h2 key={i} className="text-2xl font-serif font-bold text-gold-400 mt-8 mb-4 border-b border-white/10 pb-2">{parseInline(line.substring(2))}</h2>); continue; }
        if (line.startsWith('## ')) { elements.push(<h3 key={i} className="text-xl font-bold text-white mt-6 mb-3">{parseInline(line.substring(3))}</h3>); continue; }
        if (line.startsWith('### ')) { elements.push(<h4 key={i} className="text-lg font-bold text-gold-200 mt-4 mb-2 uppercase tracking-wide opacity-90">{parseInline(line.substring(4))}</h4>); continue; }
        if (line.startsWith('* ') || line.startsWith('- ')) {
            elements.push(<div key={i} className="flex gap-2 ml-4 mb-1 items-start"><span className="text-gold-500 mt-2 w-1.5 h-1.5 bg-gold-500 rounded-full flex-shrink-0"></span><span className="text-gray-300 leading-relaxed">{parseInline(line.substring(2))}</span></div>);
            continue;
        }
        if (line.startsWith('> ')) { elements.push(<div key={i} className="border-l-4 border-gold-500/50 pl-4 py-2 my-4 italic text-white/80 bg-white/5 rounded-r-lg">{parseInline(line.substring(2))}</div>); continue; }
        if (!line.trim()) { elements.push(<div key={i} className="h-2"></div>); continue; }
        elements.push(<p key={i} className="mb-2 leading-relaxed text-gray-300">{parseInline(line)}</p>);
    }
    return elements;
};

export const MarkdownRenderer = ({ content, className = "", onSelectCard, showReadMore = false }: { content: string, className?: string, onSelectCard?: (id: string) => void, showReadMore?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const needsTruncation = showReadMore && content.length > 150;
    const shouldTruncate = needsTruncation && !isExpanded;

    return (
        <div className={`markdown-content ${className} relative`}>
            <div className={shouldTruncate ? "max-h-24 overflow-hidden relative" : ""}>
                {parseMarkdown(content, onSelectCard)}
                {shouldTruncate && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"></div>
                )}
            </div>
            {needsTruncation && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="text-gold-500 text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-gold-400 flex items-center gap-1"
                >
                    {isExpanded ? '▲ Kevesebb' : '▼ Mutat többet'}
                </button>
            )}
        </div>
    );
};

export const MarkdownEditor = ({ value, onChange, placeholder, className, height = "h-40" }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState<'text' | 'bg' | null>(null);
    const insertFormat = (p: string, s: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = textareaRef.current.value;
        onChange(`${text.substring(0, start)}${p}${text.substring(start, end)}${s}${text.substring(end)}`);
    };
    return (
        <div className={`flex flex-col border border-white/10 rounded-xl bg-black/20 focus-within:border-gold-500/50 transition-colors ${className} ${isFullScreen ? 'fixed inset-0 z-[200] bg-black/95 p-4 md:p-12' : 'relative'}`}>
            <div className="flex items-center gap-1 p-2 bg-white/5 border-b border-white/10 overflow-x-auto custom-scrollbar">
                <button type="button" onClick={() => insertFormat('**', '**')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 font-bold text-xs">B</button>
                <button type="button" onClick={() => insertFormat('*', '*')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 italic text-xs">I</button>
                <button type="button" onClick={() => insertFormat('\n# ', '')} className="text-xs px-1 hover:bg-white/10">H1</button>
                <button type="button" onClick={() => insertFormat('\n* ', '')} className="text-xs px-1 hover:bg-white/10">•</button>
                <button type="button" onClick={() => insertFormat('\n> ', '')} className="text-xs px-1 hover:bg-white/10">❝</button>
                <button type="button" onClick={() => insertFormat('\n![card](', ')') } className="text-xs px-1 hover:bg-white/10">🎴</button>
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-transparent p-3 text-white text-sm outline-none resize-none font-mono ${isFullScreen ? 'flex-1' : height}`}
            />

            <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className={`absolute bottom-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isFullScreen ? 'bg-gold-500 text-black' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'}`}
                title={isFullScreen ? "Kilépés a teljes képernyőből" : "Teljes képernyős szerkesztés"}
            >
                {isFullScreen ? '↙️' : '↗️'}
            </button>
        </div>
    );
};
