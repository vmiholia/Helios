'use client';

import { useUIStore } from '@/hooks/use-dashboard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export function DateNavigator() {
    const { date, setDate } = useUIStore();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = date === todayStr;

    const shift = (days: number) => {
        const d = new Date(date + 'T12:00:00');
        d.setDate(d.getDate() + days);
        const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setDate(newDate);
    };

    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <div className="flex items-center gap-1.5">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => shift(-1)}
                className="h-8 w-8 text-neutral-400 hover:text-white"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm text-neutral-300 border-none outline-none cursor-pointer font-medium tracking-tight w-[140px] text-center"
            />

            <Button
                variant="ghost"
                size="icon"
                onClick={() => shift(1)}
                disabled={isToday}
                className="h-8 w-8 text-neutral-400 hover:text-white disabled:opacity-20"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {!isToday && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDate(todayStr)}
                    className="h-7 text-xs border-cyan-800 text-cyan-400 hover:bg-cyan-950"
                >
                    <CalendarDays className="h-3 w-3 mr-1" />
                    TODAY
                </Button>
            )}
        </div>
    );
}
