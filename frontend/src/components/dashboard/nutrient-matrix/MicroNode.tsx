import { motion } from 'framer-motion';
import clsx from 'clsx';
import { LABEL_MAP } from './constants';

export const MicroNode = ({ item, onClick }: { item: any; onClick: () => void }) => {
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
