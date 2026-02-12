'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard, useDeleteEntry, useUIStore } from '@/hooks/use-dashboard';
import { Trash2, ChevronDown, ChevronUp, Info, AlertCircle, RotateCcw, Copy, Check } from 'lucide-react';

function EntryCard({ entry }: { entry: any }) {
    const deleteEntry = useDeleteEntry();
    const { setPrefillText } = useUIStore();
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const hasItems = entry.macros?.items && entry.macros.items.length > 0;
    const hasMicros = entry.macros?.micros && Object.keys(entry.macros.micros).length > 0;

    const copyEntry = (e: React.MouseEvent) => {
        e.stopPropagation();
        const m = entry.macros || {};
        const lines = [
            `#${entry.id} — ${m.food_name || entry.raw_text}`,
            `Time: ${new Date(entry.ingested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            `Calories: ${m.calories ?? 0} kcal | Protein: ${m.protein ?? 0}g | Carbs: ${m.carbs ?? 0}g | Fats: ${m.fats ?? 0}g`,
        ];
        if (m.fiber_g) lines.push(`Fiber: ${m.fiber_g}g`);
        if (hasItems) {
            lines.push('', 'Items:');
            m.items.forEach((item: any) => {
                lines.push(`  • ${item.quantity} ${item.name} — ${item.nutrients?.calories || 0} kcal, ${item.nutrients?.protein || 0}g P`);
            });
        }
        if (hasMicros) {
            lines.push('', 'Micros:');
            Object.entries(m.micros).forEach(([k, v]: [string, any]) => {
                if (typeof v === 'number' && v > 0) lines.push(`  • ${k}: ${v}`);
            });
        }
        lines.push('', `Source: "${entry.raw_text}"`);
        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-neutral-900/40 rounded-lg border border-neutral-800/80 hover:border-neutral-700/80 transition-colors overflow-hidden"
        >
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-neutral-600 bg-neutral-800/60 px-1.5 py-0.5 rounded">
                            #{entry.id}
                        </span>
                        <span className="text-sm text-neutral-300 font-light">
                            {entry.macros?.food_name || entry.raw_text}
                        </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                        {entry.ingested_at
                            ? new Date(entry.ingested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {entry.macros?.warnings && entry.macros.warnings.length > 0 && (
                        <div className="text-amber-500 animate-pulse flex items-center gap-1" title={entry.macros.warnings.join(', ')}>
                            <Info className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold uppercase hidden sm:inline">Check Data</span>
                        </div>
                    )}
                    <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs text-neutral-400">{entry.macros?.calories ?? 0} kcal</span>
                        <span className="font-mono text-[10px] text-neutral-600">{entry.macros?.protein ?? 0}g P</span>
                    </div>
                    {/* Copy */}
                    <button
                        onClick={copyEntry}
                        className="p-1 hover:text-violet-400 text-neutral-700 transition-colors"
                        title="Copy entry details"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {/* Re-log */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPrefillText(entry.raw_text);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1 hover:text-cyan-400 text-neutral-700 transition-colors"
                        title="Re-use this input"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteEntry.mutate(entry.id);
                        }}
                        className="p-1 hover:text-red-400 text-neutral-700 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {(hasItems || hasMicros) && (
                        <div className="text-neutral-700">
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </div>
                    )}
                </div>
            </div>

            {/* EXPANDED BREAKDOWN */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-3 border-t border-neutral-800/50 bg-black/20"
                    >
                        {/* Items List */}
                        {hasItems && (
                            <div className="mt-3 space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Itemized Breakdown</h4>
                                {entry.macros.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-xs text-neutral-400 pl-2 border-l border-neutral-800 py-0.5">
                                        <div className="flex flex-col">
                                            <span>{item.name}</span>
                                            <span className="text-[9px] text-neutral-600 italic">{item.quantity}</span>
                                        </div>
                                        <div className="flex gap-4 font-mono text-[10px] items-center">
                                            <div className="flex flex-col items-end">
                                                <span className="text-neutral-300">{item.nutrients?.calories || 0}</span>
                                                <span className="text-[8px] text-neutral-600 uppercase">kcal</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-cyan-500">{item.nutrients?.protein || 0}g</span>
                                                <span className="text-[8px] text-neutral-600 uppercase">Pro</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-amber-500">{item.nutrients?.carbs || 0}g</span>
                                                <span className="text-[8px] text-neutral-600 uppercase">Carb</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-pink-500">{item.nutrients?.fats || 0}g</span>
                                                <span className="text-[8px] text-neutral-600 uppercase">Fat</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Summary Macros Badges */}
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-800/30 pt-3">
                            {['fiber_g', 'cholesterol_mg', 'epa_mg', 'dha_mg', 'creatine_g', 'saturated_fat_g', 'sugar_g'].map(key => {
                                const val = entry.macros?.[key];
                                if (!val || val === 0) return null;
                                return (
                                    <div key={key} className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800/50 border border-neutral-700/30">
                                        <span className="text-[9px] text-neutral-500 uppercase font-bold">{key.replace(/_(g|mg)/, '')}</span>
                                        <span className="text-[10px] text-neutral-300 font-mono">{val}{key.split('_').pop()}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Micros Grid */}
                        {hasMicros && (
                            <div className="mt-4">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Trace Elements</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {Object.entries(entry.macros.micros).map(([key, val]: [string, any]) => {
                                        if (typeof val !== 'number' || val === 0) return null;
                                        return (
                                            <div key={key} className="flex justify-between items-center text-[9px] text-cyan-400 group/micro bg-cyan-950/10 px-2 py-1 rounded border border-cyan-900/20">
                                                <span className="capitalize text-neutral-400 truncate mr-1">
                                                    {key.replace(/_(mg|mcg|iu|g)$/, '').replace(/_/g, ' ')}
                                                </span>
                                                <span className="font-mono font-bold">{val.toFixed(1)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Warnings */}
                        {entry.macros?.warnings && entry.macros.warnings.length > 0 && (
                            <div className="mt-4 p-2 rounded bg-amber-900/20 border border-amber-500/30">
                                <h4 className="text-[10px] uppercase tracking-widest text-amber-500 mb-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Extraction Warning
                                </h4>
                                <ul className="list-disc list-inside text-[10px] text-amber-200/80">
                                    {entry.macros.warnings.map((w: string, i: number) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-4 text-[10px] text-neutral-700 italic border-t border-neutral-800/30 pt-2 line-clamp-1 hover:line-clamp-none transition-all">
                            Source: &quot;{entry.raw_text}&quot;
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function EntryFeed() {
    const { data, isLoading } = useDashboard();

    if (isLoading) {
        return <div className="text-center text-neutral-600 animate-pulse text-xs">Syncing...</div>;
    }

    const entries = data?.entries || [];

    if (entries.length === 0) {
        return <div className="text-center text-neutral-600 text-xs italic">No logs today.</div>;
    }

    return (
        <div className="space-y-3 w-full pb-20">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Today&apos;s Vibe Log</h3>
            <AnimatePresence mode="popLayout">
                {[...entries]
                    .sort((a: any, b: any) => new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime())
                    .map((entry: any) => (
                        <EntryCard key={entry.id} entry={entry} />
                    ))}
            </AnimatePresence>
        </div>
    );
}
