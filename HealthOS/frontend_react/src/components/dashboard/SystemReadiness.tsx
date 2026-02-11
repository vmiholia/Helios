import React from 'react';
import { CyberCard } from './CyberCard';

interface Metrics {
    recovery_score?: number;
    strain?: number;
    weight?: number;
    body_fat?: number;
    muscle_percent?: number;
    hrv?: number;
    resting_hr?: number;
    sleep_hours?: number;
    sleep_performance?: number;
}

interface Props {
    metrics: Metrics | null;
}

export const SystemReadiness: React.FC<Props> = ({ metrics }) => {
    const recovery = metrics?.recovery_score || 0;
    const strain = metrics?.strain || 0;
    const strainMax = 21; // Whoop typical max

    // Color logic for recovery
    const getRecoveryColor = (val: number) => {
        if (val >= 66) return "text-green-400 border-green-500 shadow-[0_0_10px_rgba(74,222,128,0.4)]";
        if (val >= 33) return "text-yellow-400 border-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.4)]";
        return "text-red-500 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
    };

    const recColor = getRecoveryColor(recovery);

    return (
        <CyberCard title="System Readiness" subtitle="Whoop & Omron" className="h-full">
            <div className="flex flex-col items-center justify-center space-y-6 py-4">

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 w-full px-2 mt-4">
                    <MetricBox label="Recovery" value={`${recovery}%`} color={recColor} />
                    <MetricBox label="Strain" value={`${strain}`} />
                    <MetricBox label="HRV" value={`${metrics?.hrv || '--'} ms`} />
                    <MetricBox label="RHR" value={`${metrics?.resting_hr || '--'} bpm`} />
                    <MetricBox label="Sleep" value={`${metrics?.sleep_hours?.toFixed(1) || '--'} hrs`} />
                    <MetricBox label="Efficiency" value={`${Math.round(metrics?.sleep_performance || 0)}%`} />
                    <MetricBox label="Weight" value={`${metrics?.weight || '--'} KG`} />
                    <MetricBox label="Body Fat" value={`${metrics?.body_fat || '--'}%`} />
                </div>



            </div>
        </CyberCard>
    );
};

const MetricBox = ({ label, value, color }: { label: string, value: string, color?: string }) => (
    <div className={`bg-slate-900/80 border border-slate-800 rounded p-2 text-center shadow-inner ${color ? color.replace('text-', 'border-').split(' ')[0] : ''}`}>
        <div className="text-[10px] text-cyan-500/70 uppercase mb-1">{label}</div>
        <div className={`text-lg font-bold font-mono ${color || 'text-gray-100'}`}>{value}</div>
    </div>
);
