import React from 'react';
import { CyberCard } from './CyberCard';

interface MacroProps {
    label: string;
    value: number;
    target: number;
    color: string;
}

const MacroBar: React.FC<MacroProps> = ({ label, value, target, color }) => {
    const percent = Math.min((value / target) * 100, 100);

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs text-cyan-400 mb-1 font-mono uppercase">
                <span>{label}:</span>
                <span>{Math.round(value)}g / {target}g</span>
            </div>
            <div className="w-full h-3 bg-gray-900 rounded-full border border-gray-800 overflow-hidden relative">
                <div
                    className={`h-full ${color} shadow-[0_0_8px_currentColor]`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

interface FuelProps {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export const FuelLogistics: React.FC<FuelProps> = ({ calories, protein, carbs, fats }) => {
    const targets = {
        calories: 2600,
        protein: 155,
        carbs: 200,
        fats: 75
    };

    return (
        <CyberCard title="Fuel Logistics" subtitle="Nutrition" className="h-full">
            <div className="p-2 space-y-6">

                {/* Macros */}
                <div>
                    <MacroBar label="Protein" value={protein} target={targets.protein} color="bg-cyan-500" />
                    <MacroBar label="Carbs" value={carbs} target={targets.carbs} color="bg-blue-500" />
                    <MacroBar label="Fats" value={fats} target={targets.fats} color="bg-teal-500" />
                </div>

                {/* Total Calories */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Total Calories</div>
                        <div className="text-3xl font-bold text-white font-mono">
                            {Math.round(calories)} <span className="text-gray-500 text-lg">/ {targets.calories}</span>
                        </div>
                    </div>
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/5 blur-xl pointer-events-none" />
                </div>

            </div>
        </CyberCard>
    );
};
