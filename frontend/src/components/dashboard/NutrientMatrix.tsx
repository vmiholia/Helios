import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, X, ArrowLeft, Utensils } from 'lucide-react';
import clsx from 'clsx';
import { useHealthStore } from '../../store/healthStore';

// ─── CONSTANTS ─────────────────────────────────────────────────

const ITEMS_PER_PAGE = 9;

const CATEGORIES: Record<string, string[]> = {
    'Vitamins': ['vitamin_a_iu', 'vitamin_c_mg', 'vitamin_d_iu', 'vitamin_e_mg', 'vitamin_k_mcg', 'vitamin_b1_thiamine_mg', 'vitamin_b2_riboflavin_mg', 'vitamin_b3_niacin_mg', 'vitamin_b5_pantothenic_acid_mg', 'vitamin_b6_pyridoxine_mg', 'vitamin_b7_biotin_mcg', 'vitamin_b9_folate_mcg', 'vitamin_b12_cobalamin_mcg'],
    'Minerals': ['calcium_mg', 'iron_mg', 'magnesium_mg', 'phosphorus_mg', 'potassium_mg', 'sodium_mg', 'zinc_mg', 'copper_mcg', 'manganese_mg', 'selenium_mcg', 'iodine_mcg', 'chromium_mcg', 'molybdenum_mcg', 'chloride_mg'],
    'Supplements': ['creatine_g', 'epa_mg', 'dha_mg'],
};

const LABEL_MAP: Record<string, { label: string; unit: string; color: string; emoji: string }> = {
    // Macros
    calories: { label: 'Calories', unit: 'kcal', color: 'text-white', emoji: '🔥' },
    protein_g: { label: 'Protein', unit: 'g', color: 'text-violet-400', emoji: '⚡' },
    carbohydrate_g: { label: 'Carbs', unit: 'g', color: 'text-cyan-400', emoji: '🌾' },
    fat_total_g: { label: 'Fats', unit: 'g', color: 'text-emerald-400', emoji: '💧' },
    fiber_g: { label: 'Fiber', unit: 'g', color: 'text-amber-500', emoji: '🥗' },
    sugar_g: { label: 'Sugar', unit: 'g', color: 'text-pink-400', emoji: '🍭' },

    // Vitamins
    vitamin_a_iu: { label: 'Vit A', unit: 'IU', color: 'text-orange-400', emoji: '🥕' },
    vitamin_c_mg: { label: 'Vit C', unit: 'mg', color: 'text-yellow-400', emoji: '🍋' },
    vitamin_d_iu: { label: 'Vit D', unit: 'IU', color: 'text-yellow-200', emoji: '☀️' },
    vitamin_e_mg: { label: 'Vit E', unit: 'mg', color: 'text-emerald-300', emoji: '🥜' },
    vitamin_k_mcg: { label: 'Vit K', unit: 'µg', color: 'text-green-400', emoji: '🥬' },
    vitamin_b1_thiamine_mg: { label: 'B1 (Thiamin)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b2_riboflavin_mg: { label: 'B2 (Ribofl)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b3_niacin_mg: { label: 'B3 (Niacin)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b5_pantothenic_acid_mg: { label: 'B5 (Panto)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b6_pyridoxine_mg: { label: 'B6 (Pyridox)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b7_biotin_mcg: { label: 'B7 (Biotin)', unit: 'µg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b9_folate_mcg: { label: 'B9 (Folate)', unit: 'µg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b12_cobalamin_mcg: { label: 'B12 (Cobal)', unit: 'µg', color: 'text-indigo-400', emoji: '🧬' },

    // Minerals
    calcium_mg: { label: 'Calcium', unit: 'mg', color: 'text-stone-300', emoji: '🦴' },
    iron_mg: { label: 'Iron', unit: 'mg', color: 'text-red-400', emoji: '🩸' },
    magnesium_mg: { label: 'Magnesium', unit: 'mg', color: 'text-stone-400', emoji: '🐚' },
    phosphorus_mg: { label: 'Phosphorus', unit: 'mg', color: 'text-stone-400', emoji: '🌋' },
    potassium_mg: { label: 'Potassium', unit: 'mg', color: 'text-stone-400', emoji: '🍌' },
    sodium_mg: { label: 'Sodium', unit: 'mg', color: 'text-stone-400', emoji: '🧂' },
    zinc_mg: { label: 'Zinc', unit: 'mg', color: 'text-stone-400', emoji: '🛡️' },
    copper_mcg: { label: 'Copper', unit: 'µg', color: 'text-orange-300', emoji: '🥉' },
    manganese_mg: { label: 'Manganese', unit: 'mg', color: 'text-stone-400', emoji: '🎡' },
    selenium_mcg: { label: 'Selenium', unit: 'µg', color: 'text-stone-400', emoji: '🐚' },
    iodine_mcg: { label: 'Iodine', unit: 'µg', color: 'text-stone-400', emoji: '🐳' },
    chromium_mcg: { label: 'Chromium', unit: 'µg', color: 'text-stone-400', emoji: '🏎️' },
    molybdenum_mcg: { label: 'Molybdenum', unit: 'µg', color: 'text-stone-400', emoji: '🔬' },
    chloride_mg: { label: 'Chloride', unit: 'mg', color: 'text-stone-400', emoji: '🧂' },

    // Supplements
    creatine_g: { label: 'Creatine', unit: 'g', color: 'text-cyan-400', emoji: '⚡' },
    epa_mg: { label: 'EPA', unit: 'mg', color: 'text-blue-400', emoji: '🐟' },
    dha_mg: { label: 'DHA', unit: 'mg', color: 'text-blue-400', emoji: '🐟' },
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────

const EnergyBlade = ({ label, value, target, color, emoji }: any) => {
    const percentage = Math.min((value / target) * 100, 100);

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors group">
            <div className={clsx("p-2 rounded-md bg-neutral-950 border border-neutral-800 group-hover:bg-neutral-900 transition-colors text-lg")}>
                {emoji}
            </div>
            <div className="flex-1 flex flex-col justify-center gap-1">
                <div className="flex justify-between items-end leading-none">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">{label}</span>
                    <span className="text-xs font-mono font-bold text-white">
                        {Math.round(value)} <span className="text-[10px] text-neutral-600 font-normal">/ {target}</span>
                    </span>
                </div>
                {/* Blade Progress Bar */}
                <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className={clsx("h-full rounded-full shadow-[0_0_10px_currentColor]", color.replace('text-', 'bg-'))}
                    />
                </div>
            </div>
        </div>
    );
};

const MicroNode = ({ item, onClick }: { item: any; onClick: () => void }) => {
    const config = LABEL_MAP[item.key] || {};
    const label = config.label || item.label || item.key;
    const unit = config.unit || item.unit || '';
    const color = config.color || item.color || 'text-white';
    const emoji = config.emoji || item.emoji || '🧬';
    const value = item.value || 0;
    const target = item.target || 1;

    const progress = Math.min((value / target) * 100, 100);

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/50 hover:bg-neutral-800/60 hover:border-cyan-500/30 transition-all cursor-pointer h-24 overflow-hidden"
        >
            <div className={`absolute top-0 left-0 w-full h-0.5 ${color.replace('text-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
                    <span className="text-xl font-black text-white leading-none mt-1">
                        {Number(value).toFixed(0)} <span className="text-[9px] text-neutral-600 font-normal">{unit}</span>
                    </span>
                </div>
                <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">{emoji}</span>
            </div>

            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mt-auto">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={clsx("h-full rounded-full", color.replace('text-', 'bg-'))}
                />
            </div>
        </div>
    );
};

// ─── MEALS VIEW COMPONENT ────────────────────────────────────

const MealsList = ({ entries, onSelect, selectedId }: { entries: any[], onSelect: (entry: any) => void, selectedId: number | null }) => {
    if (!entries || entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10 h-full text-neutral-500">
                <Utensils className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs uppercase tracking-widest">No Meals Logged</span>
            </div>
        );
    }

    // Group entries by time of day
    const grouped = {
        Morning: [] as any[],
        Lunch: [] as any[],
        Evening: [] as any[],
        Dinner: [] as any[],
        Unknown: [] as any[],
    };

    entries.forEach(entry => {
        const timeSource = entry.ingested_at || entry.created_at;
        const date = new Date(timeSource);
        const hour = date.getHours();

        if (isNaN(hour)) {
            grouped.Unknown.push(entry);
            return;
        }

        if (hour >= 4 && hour < 11) grouped.Morning.push(entry);
        else if (hour >= 11 && hour < 16) grouped.Lunch.push(entry);
        else if (hour >= 16 && hour < 20) grouped.Evening.push(entry);
        else grouped.Dinner.push(entry);
    });

    // Helper to render an entry detail
    const EntryCard = ({ entry }: { entry: any }) => (
        <div
            onClick={() => onSelect(entry)}
            className={clsx(
                "border rounded-xl p-3 flex flex-col gap-2 mb-3 last:mb-0 cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                selectedId === entry.id
                    ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
            )}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 w-full relative">
                    {/* Time Badge */}
                    <div className="absolute right-0 top-0 text-[9px] text-neutral-600 font-mono">
                        {new Date(entry.ingested_at || entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {entry.macros.items && entry.macros.items.length > 0 ? (
                        entry.macros.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start text-xs border-b border-neutral-800/50 pb-1 last:border-0 last:pb-0 pr-12">
                                <span className={clsx("font-medium", selectedId === entry.id ? "text-cyan-100" : "text-neutral-300")}>{item.name}</span>
                                <span className="text-neutral-500 font-mono text-[10px]">
                                    {Math.round(item.nutrients?.calories || item.calories || 0)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <span className="text-sm text-neutral-400 italic pr-12">{entry.food_name || "Custom Entry"}</span>
                    )}
                </div>
            </div>

            {/* Totals Footer for the Entry */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/50 mt-1">
                <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-violet-500" /> P: {Math.round(entry.macros?.protein || 0)}</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> C: {Math.round(entry.macros?.carbs || 0)}</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> F: {Math.round(entry.macros?.fats || 0)}</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Fib: {Math.round(entry.macros?.micros?.fiber_g || 0)}</span>
                </div>
                <span className={clsx("text-[10px] font-bold font-mono", selectedId === entry.id ? "text-white" : "text-cyan-400")}>
                    {Math.round(entry.macros?.calories || 0)} kcal
                </span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-6 pb-20">
            {Object.entries(grouped).map(([time, group]) => (
                group.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={time}
                    >
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
                            <div className={clsx("w-1.5 h-1.5 rounded-full", {
                                'bg-amber-400': time === 'Morning',
                                'bg-orange-500': time === 'Lunch',
                                'bg-indigo-400': time === 'Evening',
                                'bg-violet-600': time === 'Dinner',
                                'bg-neutral-600': time === 'Unknown',
                            })} />
                            {time}
                        </h4>
                        {group.map((entry: any, i: number) => (
                            <EntryCard key={entry.id || i} entry={entry} />
                        ))}
                    </motion.div>
                )
            ))}
        </div>
    );
};


// ─── MAIN COMPONENT ──────────────────────────────────────────

export const NutrientMatrix = () => {
    const { nutrients, targets, entries, date, fetchDashboard } = useHealthStore();
    const [selectedNutrient, setSelectedNutrient] = useState<any | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'nutrients' | 'meals'>('nutrients');
    const [activeCategory, setActiveCategory] = useState('Vitamins');

    // Pagination State
    const [page, setPage] = useState(0);

    // Date Navigation Logic
    const handlePrevDate = () => {
        setSelectedMeal(null); // Clear selection on navigate
        const d = new Date(date);
        d.setDate(d.getDate() - 1);
        fetchDashboard(d.toISOString().split('T')[0]);
    };

    const handleNextDate = () => {
        setSelectedMeal(null); // Clear selection on navigate
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        fetchDashboard(d.toISOString().split('T')[0]);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMeal(null); // Clear selection on navigate
        fetchDashboard(e.target.value);
    };

    const isToday = date === new Date().toISOString().split('T')[0];
    const displayDate = new Date(date);
    const month = displayDate.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = displayDate.getDate();
    const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'short' });

    // Reset pagination when category changes
    useEffect(() => {
        setPage(0);
    }, [activeCategory]);

    // Switch to Meals tab if a meal is selected (redundant if selection only happens IN meals tab, but good for linking)
    useEffect(() => {
        if (selectedMeal) setActiveTab('meals');
    }, [selectedMeal]);

    // Filter & Prepare Data
    const macros = [
        { key: 'protein_g', label: 'Protein', color: 'text-violet-400', emoji: '⚡' },
        { key: 'carbohydrate_g', label: 'Carbs', color: 'text-cyan-400', emoji: '🌾' },
        { key: 'fat_total_g', label: 'Fats', color: 'text-emerald-400', emoji: '💧' },
        { key: 'fiber_g', label: 'Fiber', color: 'text-amber-500', emoji: '🥗' },
    ].map(m => ({
        ...m,
        value: nutrients[m.key] || 0,
        target: targets[m.key] || 100, // Default target fallback
    }));

    // Meal Specific Macros Logic
    const mealMacros = selectedMeal ? [
        { key: 'protein_g', label: 'Protein', color: 'text-violet-400', emoji: '⚡', value: selectedMeal.macros.protein || 0, target: targets.protein_g },
        { key: 'carbohydrate_g', label: 'Carbs', color: 'text-cyan-400', emoji: '🌾', value: selectedMeal.macros.carbs || 0, target: targets.carbohydrate_g },
        { key: 'fat_total_g', label: 'Fats', color: 'text-emerald-400', emoji: '💧', value: selectedMeal.macros.fats || 0, target: targets.fat_total_g },
        {
            key: 'fiber_g', label: 'Fiber', color: 'text-amber-500', emoji: '🥗',
            value: selectedMeal.macros.items ? selectedMeal.macros.items.reduce((acc: number, item: any) => acc + (item.nutrients?.fiber || 0), 0) : 0,
            target: targets.fiber_g
        }
    ] : [];

    // Helper to get grouped nutrients
    const getGroupedNutrients = (category: string) => {
        const keys = CATEGORIES[category] || [];
        return keys.map(key => ({
            key,
            label: key.replace(/_/g, ' '),
            value: nutrients[key] || 0,
            target: typeof targets[key] === 'number' ? targets[key] : (nutrients[key] ? nutrients[key] * 2 : 1),
        }))
            .filter(item => LABEL_MAP[item.key] !== undefined)
            .sort((a, b) => {
                const pa = (a.value / (a.target || 1));
                const pb = (b.value / (b.target || 1));
                return pb - pa;
            });
    };

    const currentMicros = getGroupedNutrients(activeCategory);

    // PAGINATION LOGIC
    const totalPages = Math.ceil(currentMicros.length / ITEMS_PER_PAGE);
    const paginatedMicros = currentMicros.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    const nextPage = () => setPage(p => Math.min(p + 1, totalPages - 1));
    const prevPage = () => setPage(p => Math.max(p - 1, 0));

    const calories = selectedMeal
        ? { value: selectedMeal.macros.calories || 0, target: targets.calories }
        : { value: nutrients.calories || 0, target: targets.calories || 2000 };

    return (
        <div className="relative w-full h-full flex flex-col bg-neutral-950/80 backdrop-blur-3xl rounded-3xl border border-neutral-800/80 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-cyan-900/10 hover:border-neutral-700/80">
            {/* Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)] pointer-events-none" />

            {/* ═══════════════════════════════════════ */}
            {/* CONTENT BODY                           */}
            {/* ═══════════════════════════════════════ */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row p-0 overflow-hidden">

                {/* ── LEFT: CONTEXTUAL PANEL ── */}
                <div className="w-full lg:w-[320px] bg-neutral-900/30 border-b lg:border-b-0 lg:border-r border-neutral-800/50 p-6 flex flex-col justify-center relative transition-all duration-300">

                    {/* Header: Date Nav OR Back Button */}
                    <div className="absolute top-6 left-6 flex items-center gap-1 group">
                        {selectedMeal ? (
                            <button
                                onClick={() => setSelectedMeal(null)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-neutral-700"
                            >
                                <ArrowLeft size={12} /> Back
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handlePrevDate}
                                    className="p-1 rounded text-neutral-600 hover:text-white hover:bg-neutral-800 transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                </button>

                                <div className="relative flex flex-col items-center justify-center border border-neutral-800 bg-neutral-900/50 rounded-lg p-2 w-14 shadow-lg backdrop-blur-md cursor-pointer hover:border-cyan-500/30 transition-colors">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={handleDateChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
                                    />
                                    <span className="text-[8px] uppercase font-bold text-red-500 tracking-wider">{month}</span>
                                    <span className="text-xl font-bold text-white leading-none">{dayNum}</span>
                                    <span className="text-[8px] text-neutral-500 uppercase">{dayName}</span>
                                </div>

                                <button
                                    onClick={handleNextDate}
                                    disabled={isToday}
                                    className={clsx(
                                        "p-1 rounded transition-colors",
                                        isToday ? "text-neutral-800 cursor-not-allowed" : "text-neutral-600 hover:text-white hover:bg-neutral-800"
                                    )}
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="mb-10 text-center mt-11">
                        <div className="flex items-center justify-center gap-2 mb-2 text-cyan-500">
                            <Flame className="w-5 h-5" fill="currentColor" />
                            <span className="text-xs font-bold tracking-widest uppercase">
                                {selectedMeal ? "Meal Calories" : "Total Calories"}
                            </span>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                                {Math.round(calories.value)}
                            </span>
                        </div>
                        <div className="text-xs text-neutral-500 font-mono mt-1">
                            {selectedMeal ? (
                                <span className="opacity-80">
                                    {new Date(selectedMeal.ingested_at || selectedMeal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            ) : (
                                <>GOAL: <span className="text-neutral-300">{calories.target}</span> KCAL</>
                            )}
                        </div>
                    </div>

                    <div className="w-full space-y-2">
                        {(selectedMeal ? mealMacros : macros).map((macro) => (
                            <EnergyBlade
                                key={macro.key}
                                label={macro.label}
                                value={macro.value}
                                target={macro.target || 100}
                                color={macro.color}
                                emoji={macro.emoji}
                            />
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: MAIN CONTENT AREA ── */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950/20">

                    {/* Top Level Tabs: Nutrients vs Meals */}
                    <div className="flex items-center border-b border-neutral-800/30 bg-neutral-900/20 px-4">
                        <button
                            onClick={() => { setActiveTab('nutrients'); setSelectedMeal(null); }}
                            className={clsx(
                                "px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2",
                                activeTab === 'nutrients'
                                    ? "border-cyan-500 text-cyan-400"
                                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Nutrients
                        </button>
                        <button
                            onClick={() => setActiveTab('meals')}
                            className={clsx(
                                "px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2",
                                activeTab === 'meals'
                                    ? "border-violet-500 text-violet-400"
                                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Meals
                        </button>
                    </div>

                    {activeTab === 'nutrients' ? (
                        <>
                            {/* CATEGORY TABS & PAGINATION */}

                            <div className="p-2 border-b border-neutral-800/30 flex justify-between items-center bg-neutral-900/10">
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                    {Object.keys(CATEGORIES).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={clsx(
                                                "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                                activeCategory === cat
                                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                                                    : "bg-neutral-900/50 text-neutral-500 border border-transparent hover:bg-neutral-800 hover:text-neutral-300"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Pagination Controls - 50% Smaller Width */}
                                <div className="flex items-center gap-1 pl-2 border-l border-neutral-800/30 ml-2">
                                    <button
                                        onClick={prevPage}
                                        disabled={page === 0}
                                        className="p-0.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronLeft className="w-3 h-3 text-neutral-400" />
                                    </button>
                                    <span className="text-[9px] font-mono text-neutral-500 w-6 text-center">
                                        {page + 1}/{totalPages || 1}
                                    </span>
                                    <button
                                        onClick={nextPage}
                                        disabled={page >= totalPages - 1}
                                        className="p-0.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronRight className="w-3 h-3 text-neutral-400" />
                                    </button>
                                </div>
                            </div>

                            {/* GRID (Fixed 3x3) */}
                            <div className="p-6 grid grid-cols-3 grid-rows-3 gap-4 content-start h-full">
                                <AnimatePresence mode='wait'>
                                    {paginatedMicros.map((item) => (
                                        <motion.div
                                            key={item.key}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <MicroNode
                                                item={item}
                                                onClick={() => setSelectedNutrient(item)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {currentMicros.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center p-10 text-neutral-600 h-full">
                                        <Utensils className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-xs uppercase tracking-widest">No Data Available</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <MealsList entries={entries} onSelect={setSelectedMeal} selectedId={selectedMeal?.id} />
                    )}
                </div>

            </div>

            {/* ═══════════════════════════════════════ */}
            {/* INSPECTOR OVERLAY                      */}
            {/* ═══════════════════════════════════════ */}
            <AnimatePresence>
                {selectedNutrient && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                        onClick={() => setSelectedNutrient(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 to-cyan-500" />

                            <div className="flex justify-between items-start mb-6 pt-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                                        {(LABEL_MAP[selectedNutrient.key]?.label || selectedNutrient.label).split('|')[0]}
                                    </h3>
                                    <p className="text-xs text-cyan-500 font-mono mt-1">MOLECULAR ANALYSIS</p>
                                </div>
                                <button
                                    onClick={() => setSelectedNutrient(null)}
                                    className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>

                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <span className="text-5xl font-black text-white tracking-tighter">{Number(selectedNutrient.value).toFixed(1)}</span>
                                    <span className="text-sm text-neutral-500 ml-1 font-medium">/ {selectedNutrient.target}</span>
                                </div>
                                <div className={clsx(
                                    "px-3 py-1.5 rounded-md text-xs font-bold border",
                                    selectedNutrient.value >= selectedNutrient.target
                                        ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                                        : "bg-neutral-800 border-neutral-700 text-neutral-400"
                                )}>
                                    {Math.round((selectedNutrient.value / (selectedNutrient.target || 1)) * 100)}% MET
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 font-bold">Primary Sources</p>
                                <div className="text-xs text-neutral-400 italic">
                                    Source breakdown data coming soon...
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
