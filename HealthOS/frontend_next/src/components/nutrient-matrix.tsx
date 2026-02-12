'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/hooks/use-dashboard';
import { X, ChevronRight } from 'lucide-react';

// --- Types & Constants ---
const TABS = [
    { id: 'macros', label: 'Macros' },
    { id: 'vitamins', label: 'Vitamins' },
    { id: 'minerals', label: 'Minerals' },
];

const TARGETS: Record<string, number> = {
    // Macros
    calories: 2000, protein: 150, carbs: 200, fats: 75,
    fiber_g: 40, sugar_g: 50, saturated_fat_g: 25, cholesterol_mg: 300,

    // Water-Soluble Vitamins
    vitamin_b1_thiamine_mg: 1.2, vitamin_b2_riboflavin_mg: 1.3, vitamin_b3_niacin_mg: 16,
    vitamin_b5_pantothenic_acid_mg: 5, vitamin_b6_pyridoxine_mg: 1.7, vitamin_b7_biotin_mcg: 30,
    vitamin_b9_folate_mcg: 400, vitamin_b12_cobalamin_mcg: 2.4, vitamin_c_mg: 90,

    // Fat-Soluble Vitamins
    vitamin_a_iu: 3000, vitamin_d_iu: 600, vitamin_e_mg: 15, vitamin_k_mcg: 120,

    // Macro Minerals
    calcium_mg: 1000, sodium_mg: 2300, potassium_mg: 3400, magnesium_mg: 420,
    phosphorus_mg: 700, chloride_mg: 2300,

    // Trace Minerals
    iron_mg: 8, zinc_mg: 11, copper_mcg: 900, manganese_mg: 2.3, selenium_mcg: 55,
    iodine_mcg: 150, chromium_mcg: 35, molybdenum_mcg: 45, creatine_g: 5,
};

// --- NutrientRow Component ---
function NutrientRow({
    label, current, target, unit, onClick,
}: {
    label: string; current: number; target: number; unit: string; onClick: () => void;
}) {
    const percent = Math.min(100, (current / (target || 1)) * 100);
    const isMet = percent >= 100;

    return (
        <motion.div
            layout
            className="group relative flex items-center gap-4 py-3 border-b border-neutral-800/50 hover:bg-neutral-900/40 px-2 rounded-lg cursor-pointer transition-colors"
            onClick={onClick}
        >
            <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm text-neutral-400 font-medium group-hover:text-cyan-400 transition-colors uppercase tracking-tight text-[11px]">
                        {label}
                    </span>
                    <span className="font-mono text-xs text-neutral-500">
                        <span className={`font-bold ${isMet ? 'text-green-500' : 'text-neutral-200'}`}>
                            {current?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-neutral-600"> / {target || '-'} {unit}</span>
                    </span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden w-full">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${isMet ? 'bg-green-500' : 'bg-cyan-600'}`}
                    />
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-800 group-hover:text-neutral-600 transition-colors" />
        </motion.div >
    );
}

// --- Label Formatter ---
function formatLabel(key: string) {
    return key
        .replace(/_(mg|mcg|iu|g)$/, '')
        .replace(/_/g, ' ');
}

export function NutrientMatrix() {
    const { data, isLoading } = useDashboard();
    const [activeTab, setActiveTab] = useState('macros');
    const [inspector, setInspector] = useState<{ key: string; label: string } | null>(null);

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-neutral-600 animate-pulse text-xs">Syncing nutrient data...</div>
            </div>
        );
    }

    if (!data) return null;

    const { totals, entries } = data;

    // --- Aggregate micros from all entries ---
    const calculatedMicros: Record<string, number> = {};
    (entries || []).forEach((e: any) => {
        // Top-level nutrients (fiber, EPA, DHA, etc.)
        Object.entries(e.macros || {}).forEach(([k, v]) => {
            if (typeof v === 'number' && !['calories', 'protein', 'carbs', 'fats', 'water_ml'].includes(k)) {
                calculatedMicros[k] = (calculatedMicros[k] || 0) + v;
            }
        });
        // Micros dictionary
        if (e.macros?.micros) {
            Object.entries(e.macros.micros).forEach(([k, v]) => {
                let key = k;
                if (key === 'omega3_epa_mg') key = 'epa_mg';
                if (key === 'omega3_dha_mg') key = 'dha_mg';
                calculatedMicros[key] = (calculatedMicros[key] || 0) + (v as number);
            });
        }
        // Items
        e.macros?.items?.forEach((item: any) => {
            if (item.nutrients) {
                Object.entries(item.nutrients).forEach(([k, v]) => {
                    if (typeof v === 'number' && !['calories', 'protein', 'carbs', 'fats', 'water_ml'].includes(k)) {
                        calculatedMicros[k] = (calculatedMicros[k] || 0) + v;
                    }
                });
            }
        });
    });

    const displayData: any = { ...totals, ...calculatedMicros };

    // --- Source Inspector Logic ---
    const getContributors = (key: string) => {
        const contributors: any[] = [];
        const keysToSearch = [key];
        if (key === 'epa_mg') keysToSearch.push('omega3_epa_mg');
        if (key === 'dha_mg') keysToSearch.push('omega3_dha_mg');

        (entries || []).forEach((entry: any) => {
            let foundInItems = false;
            entry.macros?.items?.forEach((item: any) => {
                const itemVal = keysToSearch.reduce((sum: number, k: string) => sum + (item.nutrients?.[k] || 0), 0);
                if (itemVal > 0) {
                    contributors.push({ name: item.name, value: itemVal, date: entry.ingested_at });
                    foundInItems = true;
                }
            });
            if (!foundInItems) {
                const entryVal = keysToSearch.reduce((sum: number, k: string) => {
                    const topLevel = entry.macros?.[k] || 0;
                    const microLevel = entry.macros?.micros?.[k] || 0;
                    return sum + (typeof topLevel === 'number' ? topLevel : 0) + (typeof microLevel === 'number' ? microLevel : 0);
                }, 0);
                if (entryVal > 0) {
                    contributors.push({ name: entry.macros?.food_name || 'Aggregated Entry', value: entryVal, date: entry.ingested_at });
                }
            }
        });
        return contributors.sort((a, b) => b.value - a.value).slice(0, 10);
    };

    // --- Render tab content ---
    const renderContent = () => {
        switch (activeTab) {
            case 'macros':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-neutral-600 mb-4 border-b border-neutral-800 pb-2">Core Energy</h4>
                            <NutrientRow label="Calories" current={totals.calories} target={TARGETS.calories} unit="kcal" onClick={() => setInspector({ key: 'calories', label: 'Calories' })} />
                            <NutrientRow label="Protein" current={totals.protein} target={TARGETS.protein} unit="g" onClick={() => setInspector({ key: 'protein', label: 'Protein' })} />
                            <NutrientRow label="Carbohydrates" current={totals.carbs} target={TARGETS.carbs} unit="g" onClick={() => setInspector({ key: 'carbs', label: 'Carbs' })} />
                            <NutrientRow label="Fats" current={totals.fats} target={TARGETS.fats} unit="g" onClick={() => setInspector({ key: 'fats', label: 'Fats' })} />
                        </div>
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-neutral-600 mb-4 border-b border-neutral-800 pb-2">Composition</h4>
                            <NutrientRow label="Fiber" current={displayData.fiber_g} target={TARGETS.fiber_g} unit="g" onClick={() => setInspector({ key: 'fiber_g', label: 'Fiber' })} />
                            <NutrientRow label="Cholesterol" current={displayData.cholesterol_mg} target={TARGETS.cholesterol_mg} unit="mg" onClick={() => setInspector({ key: 'cholesterol_mg', label: 'Cholesterol' })} />
                            <NutrientRow label="EPA" current={displayData.epa_mg} target={TARGETS.epa_mg} unit="mg" onClick={() => setInspector({ key: 'epa_mg', label: 'EPA' })} />
                            <NutrientRow label="DHA" current={displayData.dha_mg} target={TARGETS.dha_mg} unit="mg" onClick={() => setInspector({ key: 'dha_mg', label: 'DHA' })} />
                            <NutrientRow label="Creatine" current={displayData.creatine_g} target={TARGETS.creatine_g} unit="g" onClick={() => setInspector({ key: 'creatine_g', label: 'Creatine' })} />
                        </div>
                    </div>
                );
            case 'vitamins':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-neutral-600 mb-4 border-b border-neutral-800 pb-2">Water Soluble (Replenish Daily)</h4>
                            {['vitamin_c_mg', 'vitamin_b1_thiamine_mg', 'vitamin_b2_riboflavin_mg', 'vitamin_b3_niacin_mg', 'vitamin_b5_pantothenic_acid_mg', 'vitamin_b6_pyridoxine_mg', 'vitamin_b7_biotin_mcg', 'vitamin_b9_folate_mcg', 'vitamin_b12_cobalamin_mcg'].map(k => (
                                <NutrientRow key={k} label={formatLabel(k)} current={displayData[k]} target={TARGETS[k]} unit={k.split('_').pop() || ''} onClick={() => setInspector({ key: k, label: formatLabel(k) })} />
                            ))}
                        </div>
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-neutral-600 mb-4 border-b border-neutral-800 pb-2">Fat Soluble (Stored)</h4>
                            {['vitamin_a_iu', 'vitamin_d_iu', 'vitamin_e_mg', 'vitamin_k_mcg'].map(k => (
                                <NutrientRow key={k} label={formatLabel(k)} current={displayData[k]} target={TARGETS[k]} unit={k.split('_').pop() || ''} onClick={() => setInspector({ key: k, label: formatLabel(k) })} />
                            ))}
                        </div>
                    </div>
                );
            case 'minerals':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-neutral-600 mb-4 border-b border-neutral-800 pb-2">Macrominerals</h4>
                            {['calcium_mg', 'magnesium_mg', 'potassium_mg', 'sodium_mg', 'phosphorus_mg', 'chloride_mg'].map(k => (
                                <NutrientRow key={k} label={formatLabel(k)} current={displayData[k]} target={TARGETS[k]} unit={k.split('_').pop() || ''} onClick={() => setInspector({ key: k, label: formatLabel(k) })} />
                            ))}
                        </div>
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-neutral-600 mb-4 border-b border-neutral-800 pb-2">Trace Minerals</h4>
                            {['iron_mg', 'zinc_mg', 'selenium_mcg', 'iodine_mcg', 'copper_mcg', 'manganese_mg', 'chromium_mcg', 'molybdenum_mcg'].map(k => (
                                <NutrientRow key={k} label={formatLabel(k)} current={displayData[k]} target={TARGETS[k]} unit={k.split('_').pop() || ''} onClick={() => setInspector({ key: k, label: formatLabel(k) })} />
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative">
            {/* TABS HEADER */}
            <div className="flex gap-8 border-b border-neutral-800 mb-6 overflow-x-auto scrollbar-hide">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 text-sm font-medium tracking-wide uppercase transition-colors relative ${activeTab === tab.id ? 'text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="min-h-[400px]"
            >
                {renderContent()}
            </motion.div>

            {/* INSPECTOR OVERLAY (Modal) */}
            <AnimatePresence>
                {inspector && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setInspector(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/30">
                                <h3 className="font-bold text-lg text-white capitalize">{inspector.label} Sources</h3>
                                <button onClick={() => setInspector(null)} className="p-1 rounded-full hover:bg-neutral-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto">
                                <div className="space-y-3">
                                    {getContributors(inspector.key).map((c, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-neutral-950/50 border border-neutral-800">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-neutral-200">{c.name}</span>
                                                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                                    {new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <span className="font-mono font-bold text-cyan-400">
                                                {c.value.toFixed(1)}{' '}
                                                <span className="text-xs text-neutral-600 font-normal">{inspector.key.split('_').pop()}</span>
                                            </span>
                                        </div>
                                    ))}
                                    {getContributors(inspector.key).length === 0 && (
                                        <div className="text-center py-8 text-neutral-500 italic">
                                            No specific sources recorded for this nutrient today.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
