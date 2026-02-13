import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthStore } from '../../store/healthStore';
import { Send, Loader2, Sparkles, CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';

/*
 * Unified Food Logger — Two input modes merged into one:
 *
 * MODE A: Free Text → Haiku parses into items → User reviews → Sonnet calculates
 * MODE B: Category chips → Tap portions to add items → Same review list
 *
 * Both modes feed into the SAME item list, time picker, and submit flow.
 */

// ─── Category Portion Presets (Indian foods) ─────────────────
const PORTION_PRESETS: Record<string, { label: string; portions: string[] }> = {
    'Rice & Grains': {
        label: '🍚',
        portions: ['0.5 katori rice', '1 katori rice', '1 plate rice', '1 katori khichdi', '1 katori poha', '1 plate biryani'],
    },
    'Breads': {
        label: '🫓',
        portions: ['1 roti', '2 roti', '1 paratha', '2 paratha', '1 naan', '2 slices Sourdough Bread', '1 dosa (Stone Ground batter)'],
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
        portions: ['1 glass milk', '1 katori curd', '2 slices Amul Cheese', '1 tbsp ghee', '1 tbsp butter'],
    },
    'Fruits': {
        label: '🍎',
        portions: ['1 banana', '1 apple', '1 katori mixed fruits', '0.5 katori pomegranate', '1 orange', '1 mango'],
    },
    'Supplements': {
        label: '💊',
        portions: ['2 capsules Sports Research Omega-3', '2 tablets Doctor\'s Best Magnesium', '1 scoop whey protein', '5g creatine monohydrate', '1 multivitamin'],
    },
    'Snacks': {
        label: '🍿',
        portions: ['1 samosa', '2 biscuits', '1 handful nuts', '1 vada pav', '1 cup chai', '1 cup coffee'],
    },
};

// ─── Shared Item type ─────────────────────────────────────────
interface MealItem {
    name: string;
    quantity: string;
    note?: string;
    source: 'preset' | 'parsed' | 'custom';
}

export const VibeLog = () => {
    const { deleteEntry, loading, prefillText, setPrefillText } = useHealthStore();
    const [lastLog, setLastLog] = useState<any | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ── Free text input state ──
    const [text, setText] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    // ── Shared state: items, time ──
    const [items, setItems] = useState<MealItem[]>([]);
    const [selectedTime, setSelectedTime] = useState('');
    const [customTime, setCustomTime] = useState('');
    const [timeError, setTimeError] = useState(false);

    // ── Category chips state ──
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

    // Parse free text with Haiku
    const handleParse = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!text.trim() || isParsing || loading) return;
        setTimeError(false);
        setIsParsing(true);

        try {
            const res = await fetch('http://localhost:8000/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_text: text })
            });
            if (!res.ok) throw new Error('Parse failed');
            const data = await res.json();

            // Merge parsed items into the list
            const parsedItems: MealItem[] = (data.items || []).map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                note: item.note,
                source: 'parsed' as const,
            }));
            setItems(prev => [...prev, ...parsedItems]);

            // Set time if extracted and not already set
            if (data.time && !effectiveTime) {
                setCustomTime(data.time);
            }
            setText(''); // Clear the input
        } catch (err) {
            console.error('Parse error:', err);
        } finally {
            setIsParsing(false);
        }
    };

    // Add a preset portion from category chips
    const addPresetItem = (portion: string) => {
        const match = portion.match(/^([\d.]+\s*(?:katori|slices?|eggs?|pieces?|cups?|glass|tbsp|tsp|g|mg|ml|plate|bowl|handful|scoop|capsules?|boiled|x)\s+)(.+)$/i);
        if (match) {
            setItems(prev => [...prev, { quantity: match[1].trim(), name: match[2].trim(), source: 'preset' }]);
        } else {
            setItems(prev => [...prev, { quantity: '1x', name: portion, source: 'preset' }]);
        }
    };

    // Remove item
    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Submit: Send to Sonnet
    const handleSubmit = async () => {
        const hasInput = items.length > 0 || text.trim().length > 0;
        if (!hasInput) return;

        if (!effectiveTime) {
            setTimeError(true);
            return;
        }
        setTimeError(false);

        let logText = "";

        if (items.length > 0) {
            logText = items.map(item => `${item.quantity} ${item.name}`).join(', ') + ` at ${effectiveTime}`;
        } else {
            // Auto-parse flow (direct text submit)
            // We'll just send text directly to log endpoint, backend prompt handles parsing too
            logText = `${text} at ${effectiveTime}`;
        }

        const logTextFinal = logText;

        try {
            // Get the ID from the new entry by querying store entries after add
            // Wait, addEntry in store is void. We need to fetch dashboard to get latest.
            // But we don't get the NEW ID returned easily from useHealthStore.addEntry.
            // We should modify useHealthStore to return the ID or response.
            // For now, let's just assume success and refetch.
            // Actually, we need the response to show the summary.
            // I'll manually call the API here to get the data, then update store.

            // NOTE: Ideally store handles this. I will bypass store.addEntry and call API directly then fetchDashboard.

            // Using store-like logic but capturing response:
            const store = useHealthStore.getState();
            store.setPrefillText(null); // using this to trigger loading state if I could access setters, but I can't outside hook.
            // Just use component state for local loading if simpler, but `loading` from store is used for shared UI.

            // Let's rely on store for loading state? No, I need the data. 
            // I'll duplicate the fetch logic here for "Magic" feedback.

            // Or better: modify store later. For now, manual fetch.

            setIsParsing(true); // Re-use parsing state for "Processing" spinner

            const res = await fetch('http://localhost:8000/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    raw_text: logTextFinal,
                    date: useHealthStore.getState().date
                })
            });

            if (!res.ok) throw new Error('Failed to log entry');
            const data = await res.json();

            // Update Dashboard
            await useHealthStore.getState().fetchDashboard(useHealthStore.getState().date);

            // Set Success State
            setLastLog({ ...data, originalText: logText }); // Save logText to restore on Undo
            setItems([]);
            setText('');
            setSelectedTime('');
            setCustomTime('');

        } catch (e: any) {
            console.error(e);
            // Error handling
        } finally {
            setIsParsing(false);
        }
    };

    const handleUndo = async () => {
        if (!lastLog) return;
        try {
            await deleteEntry(lastLog.id);
            // Restore text if it was direct log, or items if they were parsed
            if (lastLog.originalText.includes(',')) {
                // Heuristic: if it has commas, it was likely multiple items. 
                // But safer to just restore the text part.
                setText(lastLog.originalText.split(' at ')[0]);
            } else {
                setText(lastLog.originalText.split(' at ')[0]);
            }
            setCustomTime(lastLog.originalText.split(' at ')[1] || '');
            setLastLog(null);
        } catch (e) {
            console.error("Undo failed", e);
        }
    };

    const handleOk = () => {
        setLastLog(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleParse();
        }
    };

    // Processing Animation Component
    const ProcessingOverlay = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-neutral-900/80 backdrop-blur-sm rounded-2xl"
        >
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
                <Sparkles className="w-10 h-10 text-cyan-400 animate-spin-slow relative z-10" />
            </div>
            <p className="mt-4 text-xs font-bold text-cyan-300 tracking-widest uppercase animate-pulse">
                Analyzing Nutrients...
            </p>
        </motion.div>
    );

    // Summary Card Component
    const SummaryCard = () => {
        if (!lastLog) return null;

        // Flatten items from the log
        const logItems = lastLog.macros.items || [];

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-500/20 p-1.5 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Logged Successfully</span>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden mb-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[9px] text-neutral-500 uppercase tracking-wider font-bold">
                                <th className="p-2 pl-3">Item</th>
                                <th className="p-2 text-right">Qty</th>
                                <th className="p-2 text-right text-cyan-400">Calories</th>
                                <th className="p-2 text-right text-violet-400">Protein</th>
                                <th className="p-2 text-right text-blue-400">Carbs</th>
                                <th className="p-2 text-right text-emerald-400">Fats</th>
                                <th className="p-2 text-right text-amber-500">Fiber</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px] text-neutral-300 font-mono divide-y divide-white/5">
                            {logItems.length > 0 ? logItems.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="p-2 pl-3 font-sans font-medium text-white">{item.name}</td>
                                    <td className="p-2 text-right opacity-70">{item.quantity}</td>
                                    <td className="p-2 text-right font-bold">{Math.round(item.nutrients?.calories || 0)}</td>
                                    <td className="p-2 text-right">{Math.round(item.nutrients?.protein || 0)}</td>
                                    <td className="p-2 text-right">{Math.round(item.nutrients?.carbs || 0)}</td>
                                    <td className="p-2 text-right">{Math.round(item.nutrients?.fats || 0)}</td>
                                    <td className="p-2 text-right">{Math.round(item.nutrients?.fiber || 0)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="p-3 text-center opacity-50">No detailed items derived.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-white/5 font-bold text-[10px] border-t border-white/10">
                            <tr>
                                <td className="p-2 pl-3 text-white">TOTAL</td>
                                <td className="p-2"></td>
                                <td className="p-2 text-right text-cyan-400">{Math.round(lastLog.macros.calories)}</td>
                                <td className="p-2 text-right text-violet-400">{Math.round(lastLog.macros.protein)}</td>
                                <td className="p-2 text-right text-blue-400">{Math.round(lastLog.macros.carbs)}</td>
                                <td className="p-2 text-right text-emerald-400">{Math.round(lastLog.macros.fats)}</td>
                                {/* Sum fiber from items if not in top level macros */}
                                <td className="p-2 text-right text-amber-500">
                                    {Math.round(logItems.reduce((acc: number, cur: any) => acc + (cur.nutrients?.fiber || 0), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleUndo}
                        className="flex-1 py-2 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 border border-transparent transition-all text-xs font-bold uppercase tracking-wide"
                    >
                        Undo
                    </button>
                    <button
                        onClick={handleOk}
                        className="flex-[2] py-2 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase tracking-wide text-xs shadow-lg shadow-cyan-900/20 transition-all"
                    >
                        Looks Good (OK)
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="w-full relative group">
            <div className="relative rounded-2xl overflow-hidden backdrop-blur-xl bg-neutral-900/40 border border-neutral-800/60 shadow-2xl min-h-[300px]">

                <AnimatePresence mode="wait">
                    {isParsing && <ProcessingOverlay key="processing" />}

                    {lastLog ? (
                        <SummaryCard key="summary" />
                    ) : (
                        <motion.div
                            key="input-form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* 1. INPUT AREA */}
                            <div className="relative p-5">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 opacity-50" />
                                <form onSubmit={handleParse}>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center mb-0 gap-2">
                                            <Sparkles className="w-3 h-3 text-cyan-400" />
                                            Describe Your Meal
                                        </label>
                                        <AnimatePresence>
                                            {text.length > 0 && !isParsing && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="text-[9px] text-cyan-500/70 font-mono"
                                                >
                                                    Press Enter ↵
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            ref={textareaRef}
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g., '2 sourdough sandwiches with omelette, ham, cheese at 10:30 am'"
                                            className="w-full bg-neutral-950/30 rounded-xl border border-neutral-800/50 focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 p-3 pr-12 resize-none outline-none placeholder:text-neutral-700 min-h-[80px] text-sm font-light text-neutral-200 leading-relaxed transition-all"
                                            disabled={isParsing || loading}
                                        />
                                        <div className="absolute bottom-3 right-3">
                                            <button
                                                type="submit"
                                                disabled={isParsing || loading || !text.trim()}
                                                className={clsx(
                                                    "p-2 rounded-lg transition-all duration-300 transform",
                                                    isParsing || loading
                                                        ? "bg-neutral-800/50 text-neutral-600"
                                                        : text.trim() ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-neutral-800 text-neutral-600"
                                                )}
                                                title="Quick Analyze"
                                            >
                                                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* 2. CATEGORY QUICK ADD & 3. REVIEW (ALWAYS VISIBLE) */}
                            <div className="bg-neutral-900/30 border-t border-neutral-800/50 backdrop-blur-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-neutral-800/50">
                                    <p className="text-[9px] uppercase tracking-widest text-neutral-600 mb-2.5 font-semibold flex items-center gap-2">
                                        Quick Add
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(PORTION_PRESETS).map(([category, { label }]) => (
                                            <button
                                                key={category}
                                                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                                                className={clsx(
                                                    "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 border flex items-center gap-1.5",
                                                    activeCategory === category
                                                        ? "bg-violet-500/20 text-violet-200 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                                                        : "bg-neutral-800/30 text-neutral-500 border-neutral-800/50 hover:border-neutral-700 hover:text-neutral-300"
                                                )}
                                            >
                                                <span className="opacity-70">{label}</span>
                                                <span>{category}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {activeCategory && (
                                        <motion.div
                                            key={activeCategory}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-neutral-900/50 shadow-inner"
                                        >
                                            <div className="px-5 pb-3">
                                                <div className="flex flex-wrap gap-1.5 pt-2">
                                                    {PORTION_PRESETS[activeCategory].portions.map((portion) => (
                                                        <button
                                                            key={portion}
                                                            onClick={() => addPresetItem(portion)}
                                                            className="px-2 py-1 rounded-md bg-neutral-800/50 text-neutral-400 text-[10px] border border-neutral-700/30 hover:bg-cyan-950/30 hover:border-cyan-500/30 hover:text-cyan-200 transition-all"
                                                        >
                                                            + {portion}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* 3. REVIEW & SUBMIT */}
                                <div className="p-5 bg-neutral-900/10">
                                    <div className="flex items-center justify-between mb-3 border-b border-neutral-800/50 pb-2">
                                        <div className="flex items-center gap-4">
                                            <p className="text-[9px] uppercase tracking-widest text-neutral-600 font-semibold mb-0">Time</p>
                                            <input
                                                type="text"
                                                value={customTime}
                                                onChange={(e) => { setCustomTime(e.target.value); setSelectedTime(''); setTimeError(false); }}
                                                placeholder="now"
                                                className={clsx(
                                                    "bg-transparent border-none text-[10px] placeholder:text-neutral-600 focus:ring-0 p-0 w-20 font-mono transition-colors",
                                                    timeError ? "text-red-400 placeholder:text-red-400/50" : "text-cyan-400"
                                                )}
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            {['Morning', 'Lunch', 'Dinner'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => { setCustomTime(t); setTimeError(false); }}
                                                    className="text-[9px] text-neutral-600 hover:text-neutral-300 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Active Items List */}
                                    {hasItems && (
                                        <div className="space-y-1.5 mb-4">
                                            <AnimatePresence>
                                                {items.map((item, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="flex items-center justify-between group p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                                    >
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-cyan-400 text-xs font-mono">{item.quantity}</span>
                                                            <span className="text-neutral-300 text-xs">{item.name}</span>
                                                        </div>
                                                        <button onClick={() => removeItem(i)} className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 transition-opacity">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!hasItems && !text.trim()}
                                        className={clsx(
                                            "w-full py-2.5 rounded-xl font-medium text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2",
                                            (hasItems || text.trim()) && !loading
                                                ? "bg-white text-black hover:bg-cyan-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                                        )}
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        {items.length > 0 ? `Log ${items.length} Item${items.length > 1 ? 's' : ''}` : 'Log Entry'}
                                    </button>

                                    {timeError && (
                                        <p className="text-[9px] text-red-400 text-center mt-2 animate-pulse">
                                            Please select or type a time
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
