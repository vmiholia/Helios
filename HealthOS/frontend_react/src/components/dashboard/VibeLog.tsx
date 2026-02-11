import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthStore } from '../../store/healthStore';
import { Send, Loader2, Sparkles, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

export const VibeLog = () => {
    const [text, setText] = useState('');
    const { addEntry, loading, error } = useHealthStore();
    const [isFocused, setIsFocused] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [copied, setCopied] = useState(false);

    const [timeError, setTimeError] = useState(false);

    // Consolidated handler for all submissions (Form, Button, Enter)
    const handleAdd = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!text.trim() || loading) return;

        setTimeError(false);
        setShowSuccess(false);

        // Basic check for time indicators: "at", "am", "pm" (as words) or ":" (for 10:30)
        const hasTime = /\b(at|am|pm)\b|(\d{1,2}:\d{2})/i.test(text);
        if (!hasTime) {
            setTimeError(true);
            return;
        }

        try {
            await addEntry(text);
            setText('');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (e) {
            // Error is handled by store
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
        }
    };

    const copyError = () => {
        if (error) {
            navigator.clipboard.writeText(error);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="w-full space-y-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full relative group transition-all duration-500 ease-out ${isFocused ? 'scale-[1.02]' : ''}`}
            >
                <div className="relative">
                    <div
                        className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-20 blur group-hover:opacity-40 transition duration-1000 ${isFocused ? 'opacity-60 blur-md' : ''}`}
                    ></div>

                    <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
                        <form onSubmit={handleAdd}>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-cyan-500" />
                                    Log Meal
                                </label>
                                <AnimatePresence>
                                    {text.length > 0 && !loading && (
                                        <motion.span
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="text-[10px] text-neutral-600 animate-pulse"
                                        >
                                            Press Enter to calculate
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g., 'Ate grilled salmon with quinoa and asparagus'"
                                className="w-full bg-transparent resize-none outline-none placeholder:text-neutral-700 min-h-[60px] text-xl font-light text-white leading-relaxed"
                                disabled={loading}
                            />

                            <div className="flex justify-between items-end mt-2">
                                <span className="text-[10px] text-neutral-700 font-mono">
                                    AI-Powered Extraction
                                </span>
                                <button
                                    type="submit"
                                    disabled={loading || !text.trim()}
                                    className={`p-3 rounded-xl transition-all duration-300 transform ${loading
                                        ? 'bg-neutral-800 text-neutral-500 cursor-wait'
                                        : 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-black active:scale-90'
                                        }`}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>

            {/* STATUS FEEDBACK BAR */}
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-3 px-4 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl"
                    >
                        <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                        <span className="text-sm text-cyan-200/80 font-medium">Analyzing your meal...</span>
                        <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden ml-4">
                            <motion.div
                                className="h-full bg-cyan-500"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                style={{ width: '40%' }}
                            />
                        </div>
                    </motion.div>
                )}

                {showSuccess && !loading && !error && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl"
                    >
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-200/80 font-medium">Meal logged successfully!</span>
                    </motion.div>
                )}

                {timeError && !loading && (
                    <motion.div
                        key="time-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                    >
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-200/80 font-medium">Please specify a time (e.g., "at 2pm" or "14:30")</span>
                    </motion.div>
                )}

                {error && !loading && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 bg-red-500/5">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-red-200/80 font-bold">Calculation Failed</span>
                            </div>
                            <button
                                onClick={copyError}
                                className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-[10px] text-red-400 font-bold rounded uppercase tracking-wider transition-colors"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied' : 'Copy Details'}
                            </button>
                        </div>
                        <div className="p-4 pt-1">
                            <p className="text-xs text-red-300/60 font-mono break-words leading-relaxed">
                                {error}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
