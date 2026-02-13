import React from 'react';
import { CyberCard } from './CyberCard';
import { Activity, Thermometer, Zap, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';

export const MissionStatus: React.FC = () => {
    const day = format(new Date(), 'EEEE'); // e.g. "Wednesday"

    // Workout Configuration
    const workouts: Record<string, { title: string; exercises: string[] }> = {
        "Wednesday": {
            title: "Lower Body",
            exercises: [
                "Reverse nordic curls",
                "Bicep pulls",
                "Polliquin step up",
                "Dumbbell curl",
                "Seated dumbbell shoulder combo",
                "Dumbbell curtsy lunge",
                "Dragon squat",
                "Pike pushup"
            ]
        },
        "Friday": {
            title: "Whole Body",
            exercises: [
                "Reverse nordic curls",
                "Bicep pulls",
                "Polliquin step up",
                "Dumbbell curl",
                "Seated dumbbell shoulder combo",
                "Dumbbell curtsy lunge",
                "Dragon squat",
                "Pike pushup"
            ]
        }
    };

    const todayMission = workouts[day] || { title: "Rest & Recovery", exercises: [] };

    return (
        <CyberCard title="Mission Status" subtitle="Training & Diagnostics" className="w-full">
            <div className="flex flex-col md:flex-row gap-6 p-4">

                {/* Today's Mission & Exercises */}
                <div className="flex-1">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-900/20 to-transparent border-l-4 border-cyan-500 pl-4 py-3 mb-4">
                        <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Today's Mission
                        </div>
                        <div className="text-2xl font-bold text-white uppercase font-mono tracking-tight">
                            {day} - {todayMission.title}
                        </div>
                    </div>

                    {/* Exercise List */}
                    {todayMission.exercises.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                            {todayMission.exercises.map((ex, i) => (
                                <div key={i} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-800/50 hover:border-cyan-500/30 transition-colors">
                                    <Dumbbell className="w-3 h-3 text-cyan-500" />
                                    <span className="truncate">{ex}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {todayMission.exercises.length === 0 && (
                        <div className="text-gray-500 text-sm italic py-2">
                            No active mission protocols detected for today. maintain system readiness.
                        </div>
                    )}
                </div>

                {/* Diagnostics Hexagons */}
                <div className="flex flex-wrap justify-center gap-4 self-center md:self-start min-w-[300px]">
                    <DiagnosticHex label="Blood Panel" status="Pending" icon={Thermometer} />
                    <DiagnosticHex label="Hormones" status="Pending" icon={Zap} />
                    <DiagnosticHex label="Vitamins" status="Pending" icon={Activity} />
                </div>

            </div>
        </CyberCard>
    );
};

const DiagnosticHex = ({ label, status, icon: Icon }: any) => (
    <div className="flex flex-col items-center">
        <div className="w-16 h-16 relative flex items-center justify-center mb-2 group cursor-pointer">
            {/* Hexagon Shape */}
            <div className="absolute inset-0 bg-slate-900 clip-path-hex border-2 border-slate-700 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            <Icon className="w-6 h-6 text-gray-500 group-hover:text-cyan-400 z-10 relative transition-colors" />
        </div>
        <div className="text-[10px] text-gray-500 uppercase text-center leading-tight">
            <span className="block font-bold text-gray-400 group-hover:text-cyan-300 transition-colors">{label}</span>
            <span className="text-gray-600">({status})</span>
        </div>
    </div>
);
