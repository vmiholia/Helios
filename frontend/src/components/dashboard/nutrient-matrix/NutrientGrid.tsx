import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { MicroNode } from './MicroNode';
import { CATEGORIES, LABEL_MAP } from './constants';

const ITEMS_PER_PAGE = 9;

interface NutrientGridProps {
    nutrients: Record<string, number>;
    targets: Record<string, number>;
    onSelectNutrient: (item: any) => void;
}

export const NutrientGrid = ({ nutrients, targets, onSelectNutrient }: NutrientGridProps) => {
    const [activeCategory, setActiveCategory] = useState('Vitamins');
    const [page, setPage] = useState(0);

    // Reset pagination when category changes
    useEffect(() => {
        setPage(0);
    }, [activeCategory]);

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

    return (
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
                                onClick={() => onSelectNutrient(item)}
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
    );
};
