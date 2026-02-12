"use client";

import { DateNavigator } from '@/components/date-navigator';
import { VibeLog } from '@/components/vibe-log';
import { NutrientMatrix } from '@/components/nutrient-matrix';
import { EntryFeed } from '@/components/entry-feed';
import { Activity, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-cyan-900 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <DateNavigator />
          <div className="flex items-center gap-2">
            <span className="tracking-tight text-neutral-400 text-lg hidden md:block">Helios</span>
            <Activity className="w-5 h-5 text-cyan-500" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">

        {/* PRIMARY INPUT: "What did you eat?" */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl mb-2 text-white font-light">
              What did you eat?
            </h2>
            <p className="text-neutral-400 text-sm opacity-60">Log your meal to see the breakdown.</p>
          </div>
          <VibeLog />
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Nutrient Matrix */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl flex items-center gap-2 text-white font-light">
                <Zap className="w-5 h-5 text-yellow-500" />
                Nutrient Matrix
              </h3>
              <div className="text-xs uppercase tracking-widest text-neutral-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Data
              </div>
            </div>

            <div className="bg-neutral-900/50 border border-white/5 rounded-3xl overflow-hidden p-1 shadow-2xl">
              <NutrientMatrix />
            </div>
          </div>

          {/* Right: Log Feed (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2">
                Log History
              </h3>
              <div className="bg-neutral-900/50 border border-white/5 rounded-3xl overflow-hidden p-1 shadow-xl">
                <EntryFeed />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
