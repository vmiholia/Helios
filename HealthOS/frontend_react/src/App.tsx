import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VibeLog } from './components/dashboard/VibeLog';
import { NutrientMatrix } from './components/dashboard/NutrientMatrix';
import { EntryFeed } from './components/dashboard/EntryFeed';
import { DateNavigator } from './components/layout/DateNavigator';
import { useHealthStore } from './store/healthStore';
import { Activity, Zap } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const { fetchDashboard } = useHealthStore();

  React.useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-cyan-900 selection:text-white overflow-x-hidden">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Date Navigation */}
          <DateNavigator />

          {/* Right: Helios Logo */}
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white text-lg">Helios</span>
            <Activity className="w-5 h-5 text-cyan-500" />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">

        {/* PRIMARY INPUT: "What did you eat?" */}
        <div className="max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-light text-white mb-2">What did you eat?</h2>
            <p className="text-neutral-500 text-sm">Log your meal to see the breakdown.</p>
          </motion.div>

          <VibeLog />
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Nutrient Matrix (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-light text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Nutrient Matrix
              </h3>
              <div className="text-xs uppercase tracking-widest text-neutral-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live Data
              </div>
            </div>
            <NutrientMatrix />
          </div>

          {/* RIGHT: Log Feed (1/3 width, Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2">
                Log History
              </h3>
              <EntryFeed />
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}

export default App;
