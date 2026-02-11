import React from 'react';
import { cn } from '@/lib/utils';

interface CyberCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    variant?: 'left' | 'right' | 'center';
}

export const CyberCard: React.FC<CyberCardProps> = ({ title, subtitle, children, className, variant = 'center' }) => {
    return (
        <div className={cn("relative bg-[#0a0a14]/90 backdrop-blur-sm p-1", className)}>

            {/* Sci-Fi Border Container */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Main rounded border */}
                <div className="absolute inset-2 border border-cyan-900/40 rounded-3xl" />

                {/* Heavy Brackets */}
                <svg className="absolute inset-0 w-full h-full p-1" style={{ filter: 'drop-shadow(0 0 4px #06b6d4)' }}>
                    {/* Top Left Bracket */}
                    <path d="M 20,40 V 20 H 40" fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    {/* Top Right Bracket */}
                    <path d="M calc(100% - 40),20 H calc(100% - 20) V 40" fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    {/* Bottom Left Bracket */}
                    <path d="M 20,calc(100% - 40) V calc(100% - 20) H 40" fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    {/* Bottom Right Bracket */}
                    <path d="M calc(100% - 40),calc(100% - 20) H calc(100% - 20) V calc(100% - 40)" fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                </svg>

                {/* Decorative Side Lines */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-12 bg-cyan-900/50 rounded-r" />
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-cyan-900/50 rounded-l" />
            </div>

            {/* Header */}
            <div className="relative z-10 mb-4 pt-6 text-center">
                <div className="inline-block bg-[#0f1020] border border-cyan-800/50 px-8 py-1 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden">
                    <h3 className="font-bold text-cyan-50 tracking-[0.2em] uppercase text-sm">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[10px] text-cyan-400/60 tracking-widest uppercase mt-0.5">({subtitle})</p>
                    )}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 px-6 pb-6">
                {children}
            </div>
        </div>
    );
};
