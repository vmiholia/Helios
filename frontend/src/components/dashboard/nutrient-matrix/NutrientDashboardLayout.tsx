import React from 'react';

interface NutrientDashboardLayoutProps {
    sidebar: React.ReactNode;
    content: React.ReactNode;
    overlay?: React.ReactNode;
}

export const NutrientDashboardLayout = ({ sidebar, content, overlay }: NutrientDashboardLayoutProps) => {
    return (
        <div className="relative w-full h-full flex flex-col bg-neutral-950/80 backdrop-blur-3xl rounded-3xl border border-neutral-800/80 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-cyan-900/10 hover:border-neutral-700/80">
            {/* Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)] pointer-events-none" />

            {/* ═══════════════════════════════════════ */}
            {/* CONTENT BODY                           */}
            {/* ═══════════════════════════════════════ */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row p-0 overflow-hidden">

                {/* ── LEFT: CONTEXTUAL PANEL ── */}
                <div className="w-full lg:w-[320px] bg-neutral-900/30 border-b lg:border-b-0 lg:border-r border-neutral-800/50 p-6 flex flex-col justify-center relative transition-all duration-300">
                    {sidebar}
                </div>

                {/* ── RIGHT: MAIN CONTENT AREA ── */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950/20">
                    {content}
                </div>

            </div>

            {/* ═══════════════════════════════════════ */}
            {/* OVERLAYS                               */}
            {/* ═══════════════════════════════════════ */}
            {overlay}
        </div>
    );
};
