import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useHealthStore } from '../../store/healthStore';
import { motion } from 'framer-motion';

export const DateNavigator = () => {
    const { date, fetchDashboard } = useHealthStore();

    const handlePrev = () => {
        const d = new Date(date);
        d.setDate(d.getDate() - 1);
        fetchDashboard(d.toISOString().split('T')[0]);
    };

    const handleNext = () => {
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        fetchDashboard(d.toISOString().split('T')[0]);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        fetchDashboard(e.target.value);
    };

    const isToday = date === new Date().toISOString().split('T')[0];

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handlePrev}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                title="Previous Day"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="relative group">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl cursor-pointer hover:border-cyan-500/50 hover:bg-neutral-800 transition-all group-hover:shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)]"
                >
                    <CalendarIcon className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm font-medium text-white min-w-[100px] text-center font-mono select-none">
                        {isToday ? 'Today' : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <ChevronDown className="w-3 h-3 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
                </motion.div>

                {/* Tooltip on Hover */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-cyan-500 bg-neutral-950/90 border border-neutral-800 px-2 py-1 rounded pointer-events-none whitespace-nowrap z-50">
                    Select Date
                </div>

                {/* Invisible date input covering the text for triggering picker */}
                <input
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                    title="Choose a specific date"
                />
            </div>

            <button
                onClick={handleNext}
                disabled={isToday}
                className={`p-2 rounded-lg transition-colors ${isToday ? 'text-neutral-800 cursor-not-allowed' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                title="Next Day"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};
