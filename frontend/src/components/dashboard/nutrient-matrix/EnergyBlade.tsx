import { motion } from 'framer-motion';
import clsx from 'clsx';

export const EnergyBlade = ({ label, value, target, color, emoji }: any) => {
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
