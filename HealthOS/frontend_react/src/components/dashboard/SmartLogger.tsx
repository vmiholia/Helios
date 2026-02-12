import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthStore } from '../../store/healthStore';
import { Plus, X, Send, Loader2, UtensilsCrossed, Sparkles } from 'lucide-react';
import clsx from 'clsx';

/*
 * SmartLogger — A guided food input experience.
 * 
 * Instead of a single free-text box, this component guides users to:
 * 1. Add items one by one with suggested portions
 * 2. Pick quantities from common Indian portions (katori, roti, slice, etc.)
 * 3. See a running preview of what they're logging
 * 4. Send the structured, clear text to the API for accurate extraction
 */

// Portion presets for common Indian foods
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

export const SmartLogger = () => {
    const { addEntry, fetchDashboard } = useHealthStore();
    const [items, setItems] = useState<string[]>([]);
    const [customInput, setCustomInput] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [customTime, setCustomTime] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const addItem = (item: string) => {
        setItems(prev => [...prev, item]);
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const addCustomItem = () => {
        if (customInput.trim()) {
            addItem(customInput.trim());
            setCustomInput('');
        }
    };

    const handleSubmit = async () => {
        if (items.length === 0) return;

        const time = customTime || selectedTime;
        if (!time) return;

        setIsSubmitting(true);

        // Build a clear, structured text from items
        const structuredText = items.join(', ') + ` at ${time}`;

        try {
            await addEntry(structuredText);
            await fetchDashboard();
            setItems([]);
            setSelectedTime('');
            setCustomTime('');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (e) {
            console.error('Smart log failed:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const effectiveTime = customTime || selectedTime;

    return (
        <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 mb-20"
        >
            {/* Section Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] uppercase tracking-widest text-violet-300 font-semibold">Smart Logger</span>
                </div>
                <h2 className="text-2xl font-light text-white mb-2">Build Your Meal</h2>
                <p className="text-neutral-500 text-sm max-w-md mx-auto">
                    Tap items to add them. Pick portions. Get precise nutrition.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Main Container */}
                <div className="bg-neutral-900/50 rounded-2xl border border-neutral-800/50 overflow-hidden backdrop-blur-sm">

                    {/* STEP 1: Category Selector */}
                    <div className="p-5 border-b border-neutral-800/30">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3 font-semibold">① Pick a Category</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(PORTION_PRESETS).map(([category, { label }]) => (
                                <motion.button
                                    key={category}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                                    className={clsx(
                                        "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                                        activeCategory === category
                                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-lg shadow-violet-500/10"
                                            : "bg-neutral-800/50 text-neutral-400 border border-neutral-700/30 hover:border-neutral-600/50 hover:text-neutral-300"
                                    )}
                                >
                                    <span>{label}</span>
                                    <span className="hidden sm:inline">{category}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* STEP 2: Portion Chips */}
                    <AnimatePresence mode="wait">
                        {activeCategory && (
                            <motion.div
                                key={activeCategory}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="p-5 border-b border-neutral-800/30 bg-neutral-900/30">
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3 font-semibold">② Tap to Add</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PORTION_PRESETS[activeCategory].portions.map((portion) => (
                                            <motion.button
                                                key={portion}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.92 }}
                                                onClick={() => addItem(portion)}
                                                className="px-3 py-1.5 rounded-lg bg-neutral-800/80 text-neutral-300 text-sm border border-neutral-700/30 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
                                            >
                                                + {portion}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Custom Item Input */}
                    <div className="p-5 border-b border-neutral-800/30">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3 font-semibold">Or Type Anything</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                                placeholder='e.g. "2 sourdough sandwiches with cheese" or "1 bowl maggi"'
                                className="flex-1 bg-neutral-800/50 border border-neutral-700/30 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/40 focus:bg-neutral-800/80 transition-all"
                            />
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={addCustomItem}
                                disabled={!customInput.trim()}
                                className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700/30 text-neutral-400 hover:text-cyan-400 hover:border-cyan-500/30 disabled:opacity-30 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>

                    {/* STEP 3: Time Selector */}
                    <div className="p-5 border-b border-neutral-800/30">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3 font-semibold">③ When Did You Eat?</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {TIME_PRESETS.map(({ label, value, icon }) => (
                                <motion.button
                                    key={value}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setSelectedTime(value); setCustomTime(''); }}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5",
                                        selectedTime === value && !customTime
                                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                            : "bg-neutral-800/50 text-neutral-400 border border-neutral-700/30 hover:border-neutral-600/50"
                                    )}
                                >
                                    <span>{icon}</span> {label}
                                </motion.button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={customTime}
                            onChange={(e) => { setCustomTime(e.target.value); setSelectedTime(''); }}
                            placeholder="Or type: 11:45 am, 3 pm, etc."
                            className="w-48 bg-neutral-800/50 border border-neutral-700/30 rounded-lg px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                        />
                    </div>

                    {/* STEP 4: Preview & Submit */}
                    <div className="p-5">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3 font-semibold">④ Your Meal</p>

                        {items.length === 0 ? (
                            <div className="text-center py-6 text-neutral-700">
                                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No items added yet. Pick from above or type your own.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 mb-4">
                                <AnimatePresence>
                                    {items.map((item, i) => (
                                        <motion.div
                                            key={`${item}-${i}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, height: 0 }}
                                            className="flex items-center justify-between bg-neutral-800/40 rounded-lg px-3 py-2 border border-neutral-700/20 group"
                                        >
                                            <span className="text-sm text-neutral-300 font-mono">
                                                <span className="text-cyan-500/60 mr-2">•</span>
                                                {item}
                                            </span>
                                            <button
                                                onClick={() => removeItem(i)}
                                                className="text-neutral-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Preview of what will be sent */}
                                {effectiveTime && (
                                    <div className="mt-3 p-3 rounded-lg bg-neutral-950/50 border border-dashed border-neutral-700/30">
                                        <p className="text-[9px] uppercase tracking-widest text-neutral-600 mb-1">Will send to AI:</p>
                                        <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                                            "{items.join(', ')} at {effectiveTime}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={items.length === 0 || !effectiveTime || isSubmitting}
                            className={clsx(
                                "w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
                                items.length > 0 && effectiveTime
                                    ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/20"
                                    : "bg-neutral-800/50 text-neutral-600 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                            ) : showSuccess ? (
                                <><Sparkles className="w-4 h-4" /> Logged Successfully!</>
                            ) : (
                                <><Send className="w-4 h-4" /> Log {items.length > 0 ? `${items.length} Item${items.length > 1 ? 's' : ''}` : 'Meal'}</>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.section>
    );
};
