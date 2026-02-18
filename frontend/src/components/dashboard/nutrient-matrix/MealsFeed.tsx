import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Utensils } from 'lucide-react';

export const MealsFeed = ({ entries, onSelect, selectedId }: { entries: any[], onSelect: (entry: any) => void, selectedId: number | null }) => {
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
