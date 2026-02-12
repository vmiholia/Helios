'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddEntry, useParseFood, useUIStore } from '@/hooks/use-dashboard';
import { Send, Loader2, Sparkles, CheckCircle2, AlertCircle, Copy, Check, Pencil, X, Plus, RotateCcw, UtensilsCrossed } from 'lucide-react';

// ─── Category Portion Presets (Indian foods) ─────────────────
const PORTION_PRESETS: Record<string, { label: string; portions: string[] }> = {
    'Rice & Grains': {
        label: '🍚',
        portions: ['0.5 katori rice', '1 katori rice', '1 plate rice', '1 katori khichdi', '1 katori poha', '1 plate biryani'],
    },
    'Breads': {
        label: '🫓',
        portions: ['1 roti', '2 roti', '1 paratha', '2 paratha', '1 naan', '2 slices bread', '4 slices bread'],
    },
    'Dal & Curry': {
        label: '🍲',
        portions: ['1 katori dal', '1 katori kadhi', '1 katori rajma', '1 katori chole', '1 katori sambar', '1 katori sabzi'],
    },
    'Protein': {
        label: '🥚',
        portions: ['1 egg omelette', '2 egg omelette', '1 boiled egg', '1 katori paneer', '100g chicken breast', '1 katori fish curry'],
    },
    'Dairy': {
        label: '🥛',
        portions: ['1 glass milk', '1 katori curd', '1 slice cheese', '1 tbsp ghee', '1 tbsp butter'],
    },
    'Fruits': {
        label: '🍎',
        portions: ['1 banana', '1 apple', '1 katori mixed fruits', '0.5 katori pomegranate', '1 orange', '1 mango'],
    },
    'Supplements': {
        label: '💊',
        portions: ['5g creatine monohydrate', '2 fish oil capsules', '1 multivitamin', '1 scoop whey protein', '1 vitamin D3 capsule'],
    },
    'Snacks': {
        label: '🍿',
        portions: ['1 samosa', '2 biscuits', '1 handful nuts', '1 vada pav', '1 cup chai', '1 cup coffee'],
    },
};

const TIME_PRESETS = [
    { label: 'Morning', value: '8:00 am', icon: '🌅' },
    { label: 'Mid-Morning', value: '10:30 am', icon: '☀️' },
    { label: 'Lunch', value: '1:00 pm', icon: '🌞' },
    { label: 'Snack', value: '4:30 pm', icon: '🫖' },
    { label: 'Dinner', value: '8:30 pm', icon: '🌙' },
    { label: 'Late Night', value: '10:30 pm', icon: '🌜' },
];

// ─── Shared Item type ─────────────────────────────────────────
interface MealItem {
    name: string;
    quantity: string;
    note?: string;
    source: 'preset' | 'parsed' | 'custom';
}

export function VibeLog() {
    const addEntry = useAddEntry();
    const parseFood = useParseFood();
    const { prefillText, setPrefillText } = useUIStore();

    const [isFocused, setIsFocused] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ── Free text input state ──
    const [text, setText] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    // ── Shared state: items, time, editing ──
    const [items, setItems] = useState<MealItem[]>([]);
    const [selectedTime, setSelectedTime] = useState('');
    const [customTime, setCustomTime] = useState('');
    const [timeError, setTimeError] = useState(false);

    // ── Category chips state ──
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [customInput, setCustomInput] = useState('');

    // ── Editing state ──
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

    // ── Derived ──
    const effectiveTime = customTime || selectedTime;
    const hasItems = items.length > 0;

    // ── Prefill from EntryFeed re-log ──
    useEffect(() => {
        if (prefillText) {
            setText(prefillText);
            setPrefillText(null);
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [prefillText, setPrefillText]);

    // ═══════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════

    const handleParse = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!text.trim() || isParsing || addEntry.isPending) return;
        setTimeError(false);
        setIsParsing(true);

        try {
            const data = await parseFood.mutateAsync(text.trim());
            const parsedItems: MealItem[] = (data.items || []).map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                note: item.note,
                source: 'parsed' as const,
            }));
            setItems(prev => [...prev, ...parsedItems]);
            if (data.time && !effectiveTime) {
                setCustomTime(data.time);
            }
            setText('');
        } catch (err) {
            console.error('Parse error:', err);
        } finally {
            setIsParsing(false);
        }
    };

    const addPresetItem = (portion: string) => {
        const match = portion.match(/^([\d.]+\s*(?:katori|slices?|eggs?|pieces?|cups?|glass|tbsp|tsp|g|mg|ml|plate|bowl|handful|scoop|capsules?|boiled|x)\s+)(.+)$/i);
        if (match) {
            setItems(prev => [...prev, { quantity: match[1].trim(), name: match[2].trim(), source: 'preset' }]);
        } else {
            setItems(prev => [...prev, { quantity: '1x', name: portion, source: 'preset' }]);
        }
    };

    const addCustomItem = () => {
        if (!customInput.trim()) return;
        const match = customInput.trim().match(/^([\d.]+\s*(?:katori|slices?|eggs?|pieces?|cups?|glass|tbsp|tsp|g|mg|ml|plate|bowl|handful|scoop|capsules?|x)\s+)(.+)$/i);
        if (match) {
            setItems(prev => [...prev, { quantity: match[1].trim(), name: match[2].trim(), source: 'custom' }]);
        } else {
            setItems(prev => [...prev, { quantity: '1x', name: customInput.trim(), source: 'custom' }]);
        }
        setCustomInput('');
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const startEdit = (index: number) => {
        const item = items[index];
        setEditValue(`${item.quantity} ${item.name}`);
        setEditingIndex(index);
    };

    const saveEdit = (index: number) => {
        if (!editValue.trim()) return;
        const parts = editValue.trim();
        const match = parts.match(/^([\d.]+\s*(?:katori|slices?|eggs?|pieces?|cups?|glass|tbsp|tsp|g|mg|ml|plate|bowl|handful|scoop|capsules?|x)\s+)(.+)$/i);
        const updated = [...items];
        if (match) {
            updated[index] = { ...updated[index], quantity: match[1].trim(), name: match[2].trim(), note: 'Edited' };
        } else {
            updated[index] = { ...updated[index], quantity: '1x', name: parts, note: 'Edited' };
        }
        setItems(updated);
        setEditingIndex(null);
        setEditValue('');
    };

    const handleSubmit = async () => {
        if (items.length === 0) return;
        if (!effectiveTime) {
            setTimeError(true);
            return;
        }
        setTimeError(false);
        const structuredText = items
            .map(item => `${item.quantity} ${item.name}`)
            .join(', ') + ` at ${effectiveTime}`;

        try {
            await addEntry.mutateAsync(structuredText);
            setItems([]);
            setText('');
            setSelectedTime('');
            setCustomTime('');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch { /* handled by hook */ }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleParse();
        }
    };

    const copyError = () => {
        if (addEntry.error) {
            navigator.clipboard.writeText(addEntry.error.message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const sourceColor = (source: string) => {
        if (source === 'parsed') return 'bg-violet-500/10 border-violet-500/20';
        if (source === 'preset') return 'bg-cyan-500/5 border-cyan-500/15';
        return 'bg-neutral-800/40 border-neutral-700/20';
    };

    const sourceIcon = (source: string) => {
        if (source === 'parsed') return '🤖';
        if (source === 'preset') return '📋';
        return '✏️';
    };

    return (
        <div className="w-full space-y-0">
            {/* ═══════════════════════════════════════ */}
            {/* SECTION 1: FREE TEXT PARSER (Mode A)   */}
            {/* ═══════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full relative group transition-all duration-500 ease-out ${isFocused ? 'scale-[1.02]' : ''}`}
            >
                <div className="relative">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-t-2xl opacity-20 blur group-hover:opacity-40 transition duration-1000 ${isFocused ? 'opacity-60 blur-md' : ''}`} />
                    <div className="relative bg-neutral-900 border border-neutral-800 rounded-t-2xl p-6 shadow-2xl">
                        <form onSubmit={handleParse}>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-cyan-500" />
                                    Describe Your Meal
                                </label>
                                <AnimatePresence>
                                    {text.length > 0 && !isParsing && !addEntry.isPending && (
                                        <motion.span
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="text-[10px] text-neutral-600 animate-pulse"
                                        >
                                            Press Enter → AI will break it down
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g., '2 sourdough sandwiches with omelette, ham, cheese at 10:30 am'"
                                className="w-full bg-transparent resize-none outline-none placeholder:text-neutral-700 min-h-[50px] text-lg font-light text-white leading-relaxed"
                                disabled={isParsing || addEntry.isPending}
                            />

                            <div className="flex justify-between items-end mt-2">
                                <span className="text-[10px] text-neutral-700 font-mono">
                                    AI parses → you review → precise logging
                                </span>
                                <button
                                    type="submit"
                                    disabled={isParsing || addEntry.isPending || !text.trim()}
                                    className={`p-2.5 rounded-xl transition-all duration-300 transform ${isParsing
                                            ? 'bg-neutral-800 text-neutral-500 cursor-wait'
                                            : 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-black active:scale-90'
                                        }`}
                                >
                                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>

            {/* ═══════════════════════════════════════ */}
            {/* SECTION 2: CATEGORY CHIPS (Mode B)     */}
            {/* ═══════════════════════════════════════ */}
            <div className="bg-neutral-900/70 border-x border-neutral-800/60">
                <div className="px-5 pt-4 pb-3">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2.5 font-semibold flex items-center gap-2">
                        <span className="text-violet-400">or</span> Quick Add by Category
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(PORTION_PRESETS).map(([category, { label }]) => (
                            <motion.button
                                key={category}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 ${activeCategory === category
                                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                                        : 'bg-neutral-800/50 text-neutral-500 border border-neutral-700/30 hover:border-neutral-600/50 hover:text-neutral-300'
                                    }`}
                            >
                                <span>{label}</span>
                                <span className="hidden sm:inline">{category}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Portion chips */}
                <AnimatePresence mode="wait">
                    {activeCategory && (
                        <motion.div
                            key={activeCategory}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-3 pt-1">
                                <div className="flex flex-wrap gap-1.5">
                                    {PORTION_PRESETS[activeCategory].portions.map((portion) => (
                                        <motion.button
                                            key={portion}
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => addPresetItem(portion)}
                                            className="px-2.5 py-1 rounded-md bg-neutral-800/80 text-neutral-300 text-xs border border-neutral-700/30 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
                                        >
                                            + {portion}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Custom add row */}
                <div className="px-5 pb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                            placeholder='Or type: "2 sourdough sandwiches", "1 bowl maggi"'
                            className="flex-1 bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                        />
                        <button
                            onClick={addCustomItem}
                            disabled={!customInput.trim()}
                            className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700/30 text-neutral-400 hover:text-cyan-400 hover:border-cyan-500/30 disabled:opacity-30 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* SECTION 3: SHARED REVIEW & SUBMIT      */}
            {/* ═══════════════════════════════════════ */}
            <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-b-2xl overflow-hidden">

                {/* Time Selection */}
                <div className="px-5 pt-4 pb-3 border-b border-neutral-800/30">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2.5 font-semibold">When did you eat?</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {TIME_PRESETS.map(({ label, value, icon }) => (
                            <motion.button
                                key={value}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setSelectedTime(value); setCustomTime(''); setTimeError(false); }}
                                className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${selectedTime === value && !customTime
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                        : 'bg-neutral-800/50 text-neutral-500 border border-neutral-700/30 hover:border-neutral-600/50'
                                    }`}
                            >
                                <span>{icon}</span> {label}
                            </motion.button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={customTime}
                        onChange={(e) => { setCustomTime(e.target.value); setSelectedTime(''); setTimeError(false); }}
                        placeholder="Or type: 11:45 am, 3 pm, etc."
                        className="w-44 bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                    />
                    {timeError && (
                        <span className="text-amber-400 text-[10px] font-medium ml-2">← Pick or type a time</span>
                    )}
                </div>

                {/* Review items */}
                <div className="px-5 pt-3 pb-4">
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-semibold">
                            Your Meal {hasItems && <span className="text-cyan-400/60 normal-case">({items.length} item{items.length > 1 ? 's' : ''})</span>}
                        </p>
                        {hasItems && (
                            <button
                                onClick={() => setItems([])}
                                className="text-neutral-700 hover:text-neutral-400 transition-colors"
                                title="Clear all"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {!hasItems ? (
                        <div className="text-center py-5 text-neutral-700">
                            <UtensilsCrossed className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                            <p className="text-xs">Type above or tap category chips to add items</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 mb-3">
                            <AnimatePresence>
                                {items.map((item, i) => (
                                    <motion.div
                                        key={`${item.name}-${item.source}-${i}`}
                                        initial={{ opacity: 0, x: -15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 15, height: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className={`group flex items-center gap-2 rounded-lg px-3 py-2 border transition-all ${sourceColor(item.source)}`}
                                    >
                                        {editingIndex === i ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(i); if (e.key === 'Escape') setEditingIndex(null); }}
                                                    className="flex-1 bg-neutral-900 border border-violet-500/30 rounded-md px-2.5 py-1 text-xs text-white outline-none focus:border-violet-400"
                                                />
                                                <button onClick={() => saveEdit(i)} className="text-violet-400 hover:text-violet-300 text-[10px] font-bold">Save</button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-[10px]">{sourceIcon(item.source)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-cyan-400/80 text-xs font-mono font-semibold">{item.quantity}</span>
                                                        <span className="text-white text-xs font-medium">{item.name}</span>
                                                    </div>
                                                    {item.note && (
                                                        <p className="text-[9px] text-neutral-600 mt-0.5 italic">💡 {item.note}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(i)} className="p-1 text-neutral-500 hover:text-violet-400 transition-colors" title="Edit">
                                                        <Pencil className="w-2.5 h-2.5" />
                                                    </button>
                                                    <button onClick={() => removeItem(i)} className="p-1 text-neutral-500 hover:text-red-400 transition-colors" title="Remove">
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Preview */}
                    {hasItems && effectiveTime && (
                        <div className="p-2.5 rounded-lg bg-neutral-950/50 border border-dashed border-neutral-700/30 mb-3">
                            <p className="text-[9px] uppercase tracking-widest text-neutral-600 mb-0.5">Will send to AI:</p>
                            <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
                                &quot;{items.map(i => `${i.quantity} ${i.name}`).join(', ')} at {effectiveTime}&quot;
                            </p>
                        </div>
                    )}

                    {/* Submit */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        disabled={!hasItems || !effectiveTime || addEntry.isPending}
                        className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${hasItems && effectiveTime && !addEntry.isPending
                                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/20'
                                : 'bg-neutral-800/50 text-neutral-600 cursor-not-allowed'
                            }`}
                    >
                        {addEntry.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Calculating Nutrients (Sonnet)...</>
                        ) : showSuccess ? (
                            <><CheckCircle2 className="w-4 h-4 text-green-400" /> Logged Successfully!</>
                        ) : (
                            <><Send className="w-4 h-4" /> Confirm & Log {hasItems ? `(${items.length} item${items.length > 1 ? 's' : ''})` : ''}</>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* STATUS FEEDBACK BAR                    */}
            {/* ═══════════════════════════════════════ */}
            <AnimatePresence mode="wait">
                {isParsing && (
                    <motion.div
                        key="parsing"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-3 px-4 py-3 bg-violet-500/5 border border-violet-500/20 rounded-xl mt-3"
                    >
                        <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                        <span className="text-sm text-violet-200/80 font-medium">AI is breaking down your meal...</span>
                        <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden ml-4">
                            <motion.div className="h-full bg-violet-500" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '30%' }} />
                        </div>
                    </motion.div>
                )}

                {addEntry.isError && !addEntry.isPending && (
                    <motion.div key="error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden mt-3">
                        <div className="flex items-center justify-between px-4 py-3 bg-red-500/5">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-red-200/80 font-bold">Calculation Failed</span>
                            </div>
                            <button onClick={copyError} className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-[10px] text-red-400 font-bold rounded uppercase tracking-wider transition-colors">
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied' : 'Copy Details'}
                            </button>
                        </div>
                        <div className="p-4 pt-1">
                            <p className="text-xs text-red-300/60 font-mono break-words leading-relaxed">{addEntry.error?.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
