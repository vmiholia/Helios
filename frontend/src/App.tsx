import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VibeLog } from './components/dashboard/VibeLog';
import { NutrientMatrix } from './components/dashboard/NutrientMatrix';
import { EntryFeed } from './components/dashboard/EntryFeed';

import { ShuffleText } from './components/ui/ShuffleText';
import { useHealthStore } from './store/healthStore';
import { ScrollText, X, Zap } from 'lucide-react';

function App() {
  const { fetchDashboard } = useHealthStore();
  const [showLogs, setShowLogs] = useState(false);

  React.useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-cyan-900 selection:text-white overflow-x-hidden">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Branding */}
          <div className="flex items-center gap-2">
            <ShuffleText text="HELIOS" className="font-bold tracking-tight text-white text-lg font-mono" />
            <Zap className="w-5 h-5 text-cyan-500 fill-cyan-500/20" />
          </div>

          {/* Right: Logs Toggle */}
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-white transition-colors"
          >
            <ScrollText className="w-4 h-4" />
            LOGS
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: Input & Quick Add (Fixed 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <VibeLog />
          </div>

          {/* RIGHT COLUMN: Nutrient Matrix (Fixed 7 Cols) */}
          <div className="lg:col-span-7 sticky top-24">
            <NutrientMatrix />
          </div>

        </div>

      </main>

      {/* LOGS OVERLAY */}
      <AnimatePresence>
        {showLogs && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogs(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-neutral-900 border-l border-neutral-800 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur">
                <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <ScrollText className="w-4 h-4" /> Recent Logs
                </h2>
                <button
                  onClick={() => setShowLogs(false)}
                  className="p-2 hover:bg-neutral-800 rounded-full text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <EntryFeed />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
