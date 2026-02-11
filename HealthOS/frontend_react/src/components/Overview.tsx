import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { SystemReadiness } from './dashboard/SystemReadiness';
import { FuelLogistics } from './dashboard/FuelLogistics';
import { OperatorStatus } from './dashboard/OperatorStatus';
import { MissionStatus } from './dashboard/MissionStatus';

interface OverviewProps {
    metrics: any;
    loading: boolean;
}

export const Overview: React.FC<OverviewProps> = ({ metrics, loading }) => {
    const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

    // Fetch today's nutrition on mount
    useEffect(() => {
        async function fetchTodayNutrition() {
            try {
                const today = format(new Date(), 'yyyy-MM-dd');
                const res = await axios.get(`http://localhost:8000/api/nutrition/analytics?start_date=${today}&end_date=${today}`);

                if (res.data.analytics && res.data.analytics.length > 0) {
                    const data = res.data.analytics[0];
                    setNutrition({
                        calories: data.calories || 0,
                        protein: data.protein_g || 0,
                        carbs: data.carbs_g || 0,
                        fats: data.fats_g || 0
                    });
                }
            } catch (e) {
                console.error("Failed to fetch nutrition summary", e);
            }
        }
        fetchTodayNutrition();
    }, []);

    if (loading) return <div className="text-cyan-500 animate-pulse flex h-full items-center justify-center">Initializing System...</div>;

    const latest = metrics?.latest || {};

    return (
        <div className="relative w-full max-w-[1600px] mx-auto h-full flex flex-col justify-center">

            {/* Connector Lines SVG Layer */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-50">
                <svg width="100%" height="100%">
                    <defs>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="50%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    {/* Lines connecting center figure to side panels */}
                    <path d="M 30% 20% L 40% 20% L 42% 30%" stroke="url(#lineGrad)" strokeWidth="1" fill="none" className="animate-pulse" />
                    <path d="M 70% 20% L 60% 20% L 58% 30%" stroke="url(#lineGrad)" strokeWidth="1" fill="none" className="animate-pulse" />

                    <path d="M 30% 80% L 40% 80% L 42% 70%" stroke="url(#lineGrad)" strokeWidth="1" fill="none" opacity="0.5" />
                    <path d="M 70% 80% L 60% 80% L 58% 70%" stroke="url(#lineGrad)" strokeWidth="1" fill="none" opacity="0.5" />

                    {/* Center circle ring */}
                    <circle cx="50%" cy="45%" r="15%" stroke="#06b6d4" strokeWidth="1" strokeDasharray="5,5" fill="none" opacity="0.3" />
                </svg>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-center">

                {/* LEFT PANEL: System Readiness */}
                <div className="lg:col-span-3 lg:col-start-2 h-[400px]">
                    <SystemReadiness metrics={latest} />
                </div>

                {/* CENTER PANEL: Mission Status */}
                <div className="lg:col-span-4 h-[500px] flex items-center justify-center">
                    <MissionStatus />
                </div>

                {/* RIGHT PANEL: Fuel Logistics */}
                <div className="lg:col-span-3 h-[400px]">
                    <FuelLogistics
                        calories={nutrition.calories}
                        protein={nutrition.protein}
                        carbs={nutrition.carbs}
                        fats={nutrition.fats}
                    />
                </div>
            </div>


        </div>
    );
};
