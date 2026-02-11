import React from 'react';
import { Hologram3D } from './Hologram3D';

// ----------------------------------------------------------------------
// DATA & MAPPINGS
// ----------------------------------------------------------------------

// 1. Muscle Mapping: Which muscles are activated by which exercises?
// Ideally this would come from a database, but we map strictly for UI here.
const EXERCISE_TO_MUSCLES: Record<string, string[]> = {
    // Leg Day
    "Best Curls": ["hamstrings"],
    "Carolat Curls": ["hamstrings"],
    "Reverse Nordic Curls": ["quads"],
    "Hend Mise Herins": ["glutes", "hamstrings"],
    "Cruchjooms": ["calves"],
    "Upglimsets": ["quads"],
    "Stilf Guix Kary": ["glutes"], // Mock names from user's image

    // Push/Pull example
    "Bench Press": ["chest", "shoulders", "triceps"],
    "Pull Ups": ["back", "biceps"],
    "Squats": ["quads", "glutes"],
    "Deadlifts": ["hamstrings", "back"]
};

// 2. Schedule: What exercises are we doing today relative to the user?
const SCHEDULE: Record<string, { type: string; focus: string; exercises: string[] }> = {
    Wednesday: {
        type: "LOWER BODY",
        focus: "Hypertrophy & Strength",
        exercises: ["Best Curls", "Carolat Curls", "Reverse Nordic Curls", "Hend Mise Herins", "Cruchjooms", "Upglimsets", "Stilf Guix Kary"]
    },
    Friday: {
        type: "WHOLE BODY",
        focus: "General Conditioning",
        exercises: ["Squats", "Deadlifts", "Bench Press", "Pull Ups"]
    },
    // Default fallback for other days
    Sunday: {
        type: "ACTIVE RECOVERY",
        focus: "Mobility",
        exercises: []
    }
};

interface Props {
    metrics?: any; // Kept for interface consistency if needed, though mostly unused now
}

export const OperatorStatus: React.FC<Props> = () => {
    // 1. Get Today's Workout
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const activeDay = (SCHEDULE[today] ? today : "Wednesday");
    const workout = SCHEDULE[activeDay];

    // State for interactive highlighting
    const [selectedExercise, setSelectedExercise] = React.useState<string | null>(null);

    // 2. Determine Active Muscles
    // Default: Show all muscles for the day
    // Interactive: Show only muscles for selected exercise
    const getActiveMuscles = () => {
        const targetMuscles = new Set<string>();

        if (selectedExercise) {
            // Show only selected
            const muscles = EXERCISE_TO_MUSCLES[selectedExercise] || [];
            muscles.forEach(m => targetMuscles.add(m));
        } else {
            // Show all for day
            workout.exercises.forEach(ex => {
                const muscles = EXERCISE_TO_MUSCLES[ex] || [];
                muscles.forEach(m => targetMuscles.add(m));
            });
        }
        return targetMuscles;
    };

    const activeMuscles = getActiveMuscles();

    // Helper to check if a muscle group is active
    const isHot = (group: string) => activeMuscles.has(group);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center relative min-h-[500px] overflow-hidden">

            {/* Header / Protocol Status */}
            <div className="absolute top-0 text-center z-20 w-full border-b border-cyan-900/30 pb-2">
                <div className="text-[10px] text-cyan-500 uppercase tracking-[0.3em]">Operator Protocol</div>
                <div className="text-2xl font-bold text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                    {workout.type}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex w-full h-full items-center justify-center gap-10 relative mt-8">

                {/* LEFT: Workout Matrix */}
                <div className="hidden lg:flex flex-col w-64 h-[350px] bg-black/40 border border-cyan-500/30 rounded-lg overflow-hidden backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <div className="bg-cyan-900/20 p-2 border-b border-cyan-500/30 flex justify-between items-center">
                        <span className="text-xs text-cyan-400 font-bold tracking-wider">{activeDay.toUpperCase()}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 scrollbar-hide">
                        <ul className="space-y-3">
                            {workout.exercises.map((ex, i) => (
                                <li
                                    key={i}
                                    onClick={() => setSelectedExercise(selectedExercise === ex ? null : ex)}
                                    className={`group flex items-center cursor-pointer p-1 rounded transition-all ${selectedExercise === ex ? 'bg-cyan-900/40 border-r-2 border-cyan-400' : 'hover:bg-cyan-900/20'}`}
                                >
                                    <div className={`w-1 h-full mr-3 transition-all duration-300 ${selectedExercise === ex ? 'bg-cyan-400 h-4' : 'bg-cyan-800 h-1 group-hover:h-3 group-hover:bg-cyan-400'}`} />
                                    <span className={`text-xs font-mono transition-colors ${selectedExercise === ex ? 'text-cyan-100 font-bold' : 'text-gray-400 group-hover:text-cyan-200'}`}>
                                        {ex}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* CENTER: Hologram & Overlays */}
                <div className="relative h-[480px] w-full flex items-center justify-center group">
                    <Hologram3D activeMuscles={activeMuscles} />
                </div>

                {/* RIGHT: Focus Details (Simplified, Removed 'Active Zones' text list) */}
                <div className="hidden lg:flex flex-col w-56 h-[300px] justify-between">

                    <div className="bg-black/40 border-r-2 border-cyan-500 p-4 rounded backdrop-blur-sm text-right">
                        <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">Primary Focus</div>
                        <div className="text-sm font-bold text-gray-100">{workout.focus}</div>
                    </div>

                    {/* Decorative Hex/Radar instead of text list */}
                    <div className="mt-auto w-full aspect-square border border-cyan-900/30 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 animate-spin-slow border-t border-cyan-500/50 rounded-full"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">{activeMuscles.size}</div>
                            <div className="text-[8px] text-cyan-600 uppercase">Zones Active</div>
                        </div>
                    </div>

                </div>

            </div>

            {/* Footer */}
            <div className="absolute bottom-2 flex space-x-4">
                <div className="text-[10px] text-cyan-600">HOLOGRAM: ONLINE</div>
                <div className="text-[10px] text-cyan-600">INPUT: NEURAL LINK</div>
            </div>

        </div>
    );
};
