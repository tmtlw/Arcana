
import React, { useRef, useState } from 'react';

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

// 1. Inline Styles (Bold, Italic, Colors)
const parseInline = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Helper to process a string for formatting
    const processSegment = (segment: string, keyPrefix: string): React.ReactNode => {
        // Color Parsing Regex: {c:color|text} or {b:color|text}
        // We use a simple splitter approach to avoid nested regex complexities
        
        // Split by our custom syntax
        const parts = segment.split(/(\{[cb]:[^|}]+\|.*?\})/g);
        
        return parts.map((part, i) => {
            const key = `${keyPrefix}-${i}`;
            
            // Text Color: {c:red|text}
            if (part.match(/^\{c:([^|]+)\|(.*)\}$/)) {
                const [, color, content] = part.match(/^\{c:([^|]+)\|(.*)\}$/) || [];
                return <span key={key} style={{ color }}>{processSegment(content, key + 'c')}</span>;
            }
            
            // Background Color: {b:red|text}
            if (part.match(/^\{b:([^|]+)\|(.*)\}$/)) {
                const [, color, content] = part.match(/^\{b:([^|]+)\|(.*)\}$/) || [];
                return <span key={key} style={{ backgroundColor: color, padding: '2px 4px', borderRadius: '4px' }}>{processSegment(content, key + 'b')}</span>;
            }

            // Bold: **text**
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            if (boldParts.length > 1) {
                return boldParts.map((bp, bi) => {
                    if (bp.startsWith('**') && bp.endsWith('**')) {
                        return <strong key={`${key}-b-${bi}`} className="text-white font-bold">{processSegment(bp.slice(2, -2), key + 'bold')}</strong>;
                    }
                    return processSegment(bp, `${key}-b-${bi}`); // Recurse for Italic check below
                });
            }

            // Italic: *text*
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

    // Flatten the array of arrays result
    const result = processSegment(text, 'root');
    return Array.isArray(result) ? result : [result];
};

// 2. Table Renderer
const renderTable = (lines: string[], key: string) => {
    // Basic Markdown Table: 
    // | Header | Header |
    // | --- | --- |
    // | Cell | Cell |
    
    if (lines.length < 2) return null;

    const headerLine = lines[0];
    // Skip index 1 which is separator |---|
    const bodyLines = lines.slice(2);

    const parseRow = (row: string) => {
        return row.split('|')
            .map(cell => cell.trim())
            .filter((cell, idx, arr) => {
                // Remove empty first/last elements if table has outer pipes | A | B |
                if (idx === 0 && cell === '') return false;
                if (idx === arr.length - 1 && cell === '') return false;
                return true;
            });
    };

    const headers = parseRow(headerLine);

    return (
        <div key={key} className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-black/20">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-white/5 text-gold-400 font-bold uppercase text-xs">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 border-b border-white/10 whitespace-nowrap">{parseInline(h)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {bodyLines.map((line, rowIdx) => {
                        const cells = parseRow(line);
                        return (
                            <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                                {cells.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="px-4 py-3 border-r border-white/5 last:border-r-0 text-gray-300">
                                        {parseInline(cell)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const parseMarkdown = (text: string) => {
    if (!text) return [];

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trimEnd();
        
        // Table Detection
        if (line.trim().startsWith('|')) {
            tableBuffer.push(line);
            // If it's the last line, flush table
            if (i === lines.length - 1) {
                elements.push(renderTable(tableBuffer, `tbl-${i}`));
            }
            continue;
        } else {
            // Flush Table Buffer if we hit a non-table line
            if (tableBuffer.length > 0) {
                elements.push(renderTable(tableBuffer, `tbl-${i}`));
                tableBuffer = [];
            }
        }

        // 1. Headers
        if (line.startsWith('# ')) {
            elements.push(<h2 key={i} className="text-2xl font-serif font-bold text-gold-400 mt-8 mb-4 border-b border-white/10 pb-2">{parseInline(line.substring(2))}</h2>);
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h3 key={i} className="text-xl font-bold text-white mt-6 mb-3">{parseInline(line.substring(3))}</h3>);
            continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h4 key={i} className="text-lg font-bold text-gold-200 mt-4 mb-2 uppercase tracking-wide opacity-90">{parseInline(line.substring(4))}</h4>);
            continue;
        }

        // 2. Lists
        if (line.startsWith('* ') || line.startsWith('- ')) {
            elements.push(
                <div key={i} className="flex gap-2 ml-4 mb-1 items-start">
                    <span className="text-gold-500 mt-2 w-1.5 h-1.5 bg-gold-500 rounded-full flex-shrink-0"></span>
                    <span className="text-gray-300 leading-relaxed">{parseInline(line.substring(2))}</span>
                </div>
            );
            continue;
        }

        // 3. Blockquotes
        if (line.startsWith('> ')) {
            elements.push(
                <div key={i} className="border-l-4 border-gold-500/50 pl-4 py-2 my-4 italic text-white/80 bg-white/5 rounded-r-lg">
                    {parseInline(line.substring(2))}
                </div>
            );
            continue;
        }

        // 4. Empty lines (Spacing)
        if (!line.trim()) {
            elements.push(<div key={i} className="h-2"></div>);
            continue;
        }

        // 5. Regular Paragraphs
        elements.push(<p key={i} className="mb-2 leading-relaxed text-gray-300">{parseInline(line)}</p>);
    }

    return elements;
};

// --- COMPONENTS ---

export const MarkdownRenderer = ({ content, className = "" }: { content: string, className?: string }) => {
    return (
        <div className={`markdown-content ${className}`}>
            {parseMarkdown(content)}
        </div>
    );
};

interface MarkdownEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    height?: string;
}

export const MarkdownEditor = ({ value, onChange, placeholder, className, height = "h-40" }: MarkdownEditorProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showColorPicker, setShowColorPicker] = useState<'text' | 'bg' | null>(null);

    const insertFormat = (prefix: string, suffix: string) => {
        if (!textareaRef.current) return;
        
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = textareaRef.current.value;
        
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = `${before}${prefix}${selection}${suffix}${after}`;
        onChange(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
            }
        }, 0);
    };

    const insertColor = (color: string, type: 'text' | 'bg') => {
        const prefix = type === 'text' ? `{c:${color}|` : `{b:${color}|`;
        insertFormat(prefix, '}');
        setShowColorPicker(null);
    };

    const insertTable = () => {
        const tableTemplate = `
| Fejléc 1 | Fejléc 2 |
|---|---|
| Adat 1 | Adat 2 |
| Adat 3 | Adat 4 |
`;
        insertFormat(tableTemplate, '');
    };

    return (
        <div className={`flex flex-col border border-white/10 rounded-xl overflow-visible bg-black/20 focus-within:border-gold-500/50 transition-colors ${className} relative`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-white/5 border-b border-white/10 overflow-x-auto custom-scrollbar">
                <ToolbarButton icon="B" label="Félkövér" onClick={() => insertFormat('**', '**')} bold />
                <ToolbarButton icon="I" label="Dőlt" onClick={() => insertFormat('*', '*')} italic />
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                
                {/* Headers */}
                <ToolbarButton icon="H1" label="Címsor 1" onClick={() => insertFormat('\n# ', '')} />
                <ToolbarButton icon="H2" label="Címsor 2" onClick={() => insertFormat('\n## ', '')} />
                <ToolbarButton icon="H3" label="Címsor 3" onClick={() => insertFormat('\n### ', '')} />
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                
                {/* Lists & Quotes */}
                <ToolbarButton icon="•" label="Lista" onClick={() => insertFormat('\n* ', '')} />
                <ToolbarButton icon="❝" label="Idézet" onClick={() => insertFormat('\n> ', '')} />
                <div className="w-px h-4 bg-white/10 mx-1"></div>

                {/* Table */}
                <ToolbarButton icon="▦" label="Táblázat" onClick={insertTable} />
                
                <div className="w-px h-4 bg-white/10 mx-1"></div>

                {/* Colors */}
                <div className="relative">
                    <ToolbarButton icon="A" label="Szövegszín" onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')} color="text-gold-400" />
                    {showColorPicker === 'text' && (
                        <div className="absolute top-8 left-0 bg-gray-900 border border-white/20 p-2 rounded-lg shadow-xl z-50 flex gap-2">
                            {COLORS.map(c => (
                                <button key={c.label} onClick={() => insertColor(c.value, 'text')} className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform" style={{ backgroundColor: c.value }} title={c.label} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <ToolbarButton icon="🖌️" label="Háttérszín" onClick={() => setShowColorPicker(showColorPicker === 'bg' ? null : 'bg')} />
                    {showColorPicker === 'bg' && (
                        <div className="absolute top-8 left-0 bg-gray-900 border border-white/20 p-2 rounded-lg shadow-xl z-50 flex gap-2">
                            {COLORS.map(c => (
                                <button key={c.label} onClick={() => insertColor(c.bgValue, 'bg')} className="w-6 h-6 rounded border border-white/10 hover:scale-110 transition-transform" style={{ backgroundColor: c.bgValue }} title={c.label} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1"></div>
                <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest px-2 opacity-50">
                    No Links
                </div>
            </div>
            
            {/* Textarea */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-transparent p-3 text-white text-sm outline-none resize-none custom-scrollbar font-mono ${height}`}
                onClick={() => setShowColorPicker(null)} 
            />
        </div>
    );
};

const ToolbarButton = ({ icon, label, onClick, bold, italic, color }: any) => (
    <button 
        type="button"
        onClick={onClick}
        title={label}
        className={`
            w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-xs text-gray-300
            ${bold ? 'font-bold' : ''} ${italic ? 'italic font-serif' : ''}
            ${color ? color : ''}
        `}
    >
        {icon}
    </button>
);
