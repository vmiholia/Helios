import React from 'react';

interface Props {
    activeMuscles: Set<string>;
    className?: string;
    overlayMode?: boolean;
}

export const HumanAnatomy: React.FC<Props> = ({ activeMuscles, className, overlayMode = false }) => {

    // Helper to check if a muscle is active
    const isActive = (muscle: string) => activeMuscles.has(muscle);

    // Common styles
    const baseStroke = overlayMode ? "transparent" : "#0e7490";
    const activeFill = "#22d3ee"; // cyan-400
    const activeFilter = "url(#glow)";
    const inactiveFill = "transparent";
    const inactiveOpacity = overlayMode ? 0 : 0.3;
    const activeOpacity = overlayMode ? 0.6 : 0.8;

    const getStyle = (muscle: string) => ({
        fill: isActive(muscle) ? activeFill : inactiveFill,
        stroke: isActive(muscle) ? "#67e8f9" : baseStroke,
        strokeWidth: isActive(muscle) ? (overlayMode ? 0 : 2) : 1,
        filter: isActive(muscle) ? activeFilter : "none",
        opacity: isActive(muscle) ? activeOpacity : inactiveOpacity,
        transition: "all 0.5s ease"
    });

    return (
        <svg viewBox="0 0 200 400" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* --- BASE SILHOUETTE (for context) --- */}
            {/* Just a rough outline or wireframe feeling behind strictly defined muscles */}

            {/* --- BASE SILHOUETTE --- */}
            {!overlayMode && (
                <path
                    d="M85,30 Q100,20 115,30 Q120,45 115,60 Q100,70 85,60 Q80,45 85,30"
                    fill="none" stroke={baseStroke} strokeWidth="1" opacity="0.3"
                />
            )}

            {/* --- MUSCLE GROUPS --- */}

            {/* NECK / TRAPS */}
            <path d="M85,60 L70,70 L130,70 L115,60" style={getStyle('traps')} />

            {/* CHEST (Pectorals) */}
            <path
                id="chest"
                d="M70,70 L130,70 L125,100 Q100,105 75,100 L70,70"
                style={getStyle('chest')}
            />

            {/* SHOULDERS (Deltoids) */}
            <path id="shoulders-left" d="M70,70 L45,75 Q40,85 45,95 L70,90" style={getStyle('shoulders')} />
            <path id="shoulders-right" d="M130,70 L155,75 Q160,85 155,95 L130,90" style={getStyle('shoulders')} />

            {/* BICEPS / ARMS UPPER */}
            <path id="biceps-left" d="M45,95 L40,130 L55,130 L65,95" style={getStyle('biceps')} />
            <path id="biceps-right" d="M155,95 L160,130 L145,130 L135,95" style={getStyle('biceps')} />

            {/* FOREARMS */}
            <path id="forearms-left" d="M40,130 L30,160 L45,160 L55,130" style={getStyle('forearms')} />
            <path id="forearms-right" d="M160,130 L170,160 L155,160 L145,130" style={getStyle('forearms')} />

            {/* ABS (Abdominals) */}
            <path
                id="abs"
                d="M75,100 Q100,105 125,100 L120,140 Q100,145 80,140 L75,100"
                style={getStyle('abs')}
            />

            {/* BACK (Lats - Visible from front as wings) */}
            {/* Represented as side wedges under arms */}
            <path id="back-left" d="M70,90 L75,100 L70,130 L60,100" style={getStyle('back')} />
            <path id="back-right" d="M130,90 L125,100 L130,130 L140,100" style={getStyle('back')} />

            {/* QUADS (Upper Legs) */}
            <path
                id="quads-left"
                d="M80,140 L65,160 L70,230 L90,230 L95,160"
                style={getStyle('quads')}
            />
            <path
                id="quads-right"
                d="M120,140 L135,160 L130,230 L110,230 L105,160"
                style={getStyle('quads')}
            />

            {/* HAMSTRINGS (Represented as inner/back thigh shadow or alternate zone) */}
            {/* For UI simplicity, we map hamstrings to the same area but maybe a different stroke or slight offset if desired. 
                OR we can just overlay them. Here I'll make them 'behind' the quads slightly offset. */}
            <path
                id="hamstrings-left"
                d="M65,160 L60,225 L70,225"
                style={getStyle('hamstrings')}
            />
            <path
                id="hamstrings-right"
                d="M135,160 L140,225 L130,225"
                style={getStyle('hamstrings')}
            />

            {/* CALVES (Lower Legs) */}
            <path
                id="calves-left"
                d="M70,230 L65,260 L70,300 L85,260 L90,230"
                style={getStyle('calves')}
            />
            <path
                id="calves-right"
                d="M130,230 L135,260 L130,300 L115,260 L110,230"
                style={getStyle('calves')}
            />

            {/* GLUTES (Hips area) */}
            <path
                id="glutes"
                d="M65,140 L135,140 L135,160 L65,160"
                style={getStyle('glutes')}
            />

        </svg>
    );
};
