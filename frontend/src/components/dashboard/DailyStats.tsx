import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useHealthStore } from '../../store/healthStore';
import { Droplet, Beef, Zap } from 'lucide-react';
import clsx from 'clsx';

const StatCard = ({ label, current, target, unit, icon: Icon, color }: any) => {
    const percent = Math.min(100, Math.round((current / target) * 100));

    return (
        <div className="flex flex-col gap-2 p-4 bg-neutral-900/40 rounded-xl border border-neutral-800/80 hover:border-neutral-700/80 transition-colors">
            <div className="flex justify-between items-center text-xs uppercase tracking-widest text-neutral-500 font-medium">
                <span className="flex items-center gap-2">
                    <Icon className={clsx("w-3 h-3", color)} /> {label}
                </span>
                <span className="font-mono text-neutral-400">{percent}%</span>
            </div>

            <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-light text-neutral-200 font-mono tracking-tight">{current}</span>
                <span className="text-xs text-neutral-600 font-mono">/ {target} {unit}</span>
            </div>

            {/* Micro Progress Bar */}
            <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, type: "spring" }}
                    className={clsx("h-full rounded-full shadow-[0_0_10px_2px_currentColor]", color.replace("text-", "bg-"))}
                />
            </div>
        </div>
    );
};

export const DailyStats = () => {
    const { totals, goals, fetchDashboard } = useHealthStore();

    useEffect(() => {
        fetchDashboard();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            <StatCard
                label="Energy"
                current={totals.calories}
                target={goals.calories}
                unit="kcal"
                icon={Zap}
                color="text-yellow-500"
            />
            <StatCard
                label="Protein"
                current={totals.protein}
                target={goals.protein}
                unit="g"
                icon={Beef}
                color="text-red-500"
            />
            <StatCard
                label="Hydration"
                current={totals.water_ml}
                target={goals.water_ml}
                unit="ml"
                icon={Droplet}
                color="text-cyan-500"
            />
        </div>
    );
};
