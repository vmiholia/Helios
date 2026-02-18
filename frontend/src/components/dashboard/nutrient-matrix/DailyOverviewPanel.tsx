import { ChevronLeft, ChevronRight, Flame, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { EnergyBlade } from './EnergyBlade';

interface DailyOverviewPanelProps {
    date: string;
    selectedMeal: any | null;
    calories: { value: number; target: number };
    macros: any[];
    onPrevDate: () => void;
    onNextDate: () => void;
    onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearSelection: () => void;
}

export const DailyOverviewPanel = ({
    date,
    selectedMeal,
    calories,
    macros,
    onPrevDate,
    onNextDate,
    onDateChange,
    onClearSelection
}: DailyOverviewPanelProps) => {
    const isToday = date === new Date().toISOString().split('T')[0];
    const displayDate = new Date(date);
    const month = displayDate.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = displayDate.getDate();
    const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'short' });

    return (
        <>
            {/* Header: Date Nav OR Back Button */}
            <div className="absolute top-6 left-6 flex items-center gap-1 group">
                {selectedMeal ? (
                    <button
                        onClick={onClearSelection}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-neutral-700"
                    >
                        <ArrowLeft size={12} /> Back
                    </button>
                ) : (
                    <>
                        <button
                            onClick={onPrevDate}
                            className="p-1 rounded text-neutral-600 hover:text-white hover:bg-neutral-800 transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>

                        <div className="relative flex flex-col items-center justify-center border border-neutral-800 bg-neutral-900/50 rounded-lg p-2 w-14 shadow-lg backdrop-blur-md cursor-pointer hover:border-cyan-500/30 transition-colors">
                            <input
                                type="date"
                                value={date}
                                onChange={onDateChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
                            />
                            <span className="text-[8px] uppercase font-bold text-red-500 tracking-wider">{month}</span>
                            <span className="text-xl font-bold text-white leading-none">{dayNum}</span>
                            <span className="text-[8px] text-neutral-500 uppercase">{dayName}</span>
                        </div>

                        <button
                            onClick={onNextDate}
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
                {macros.map((macro) => (
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
        </>
    );
};
