import React from 'react';
import { motion } from 'framer-motion';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-cyan-900 selection:text-white flex flex-col items-center py-10 px-4">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-lg mb-8 text-center"
            >
                <h1 className="text-3xl font-light tracking-wide text-cyan-400/80">HealthOS</h1>
                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-[0.2em] opacity-60">System Online</p>
            </motion.header>

            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="w-full max-w-lg space-y-8"
            >
                {children}
            </motion.main>
        </div>
    );
};
