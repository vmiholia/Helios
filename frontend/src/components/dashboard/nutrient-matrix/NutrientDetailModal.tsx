import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { LABEL_MAP } from './constants';

export const NutrientDetailModal = ({ selectedNutrient, onClose }: { selectedNutrient: any | null, onClose: () => void }) => {
    return (
        <AnimatePresence>
            {selectedNutrient && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                    onClick={onClose}
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
                                onClick={onClose}
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
    );
};
