import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Capsule, Box } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ----------------------------------------------------------------------
// TYPES & DATA
// ----------------------------------------------------------------------

interface HologramProps {
    activeMuscles: Set<string>;
    label?: string; // Optional label to show near active group
}

// ----------------------------------------------------------------------
// 3D SCENE COMPONENT
// ----------------------------------------------------------------------

const MuscleGroup = ({
    name,
    position,
    rotation = [0, 0, 0],
    args = [0.1, 0.5, 4, 8], // radius, length, capSegments, radialSegments (Capsule)
    activeMuscles,
    label
}: {
    name: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    args?: any;
    activeMuscles: Set<string>;
    label?: string;
}) => {

    const meshRef = useRef<THREE.Mesh>(null);
    const isActive = activeMuscles.has(name);
    const isHovered = false; // Could add hover logic

    // ANIMATION: Pulse effect for active muscles
    useFrame((state) => {
        if (meshRef.current && isActive) {
            const t = state.clock.getElapsedTime();
            if (activeMuscles.has(name)) { // Double check
                (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + Math.sin(t * 4);
            }
        }
    });

    const activeColor = new THREE.Color("#ff6600"); // Orange for active
    const inactiveColor = new THREE.Color("#0044aa"); // Dim blue/wireframe for inactive

    return (
        <group position={position} rotation={rotation as any}>
            <Capsule args={args} ref={meshRef}>
                {isActive ? (
                    <meshStandardMaterial
                        color={activeColor}
                        emissive={activeColor}
                        emissiveIntensity={2}
                        roughness={0.2}
                        metalness={0.8}
                    />
                ) : (
                    <meshBasicMaterial
                        color={inactiveColor}
                        wireframe={true}
                        transparent={true}
                        opacity={0.15}
                    />
                )}
            </Capsule>

            {isActive && label && (
                <Html distanceFactor={10} position={[0.2, 0, 0]}>
                    <div className="px-2 py-1 bg-black/60 border border-orange-500 rounded text-[8px] text-orange-400 font-mono whitespace-nowrap backdrop-blur-md">
                        {name.toUpperCase()}
                    </div>
                </Html>
            )}
        </group>
    );
};


const AnatomyModel = ({ activeMuscles }: { activeMuscles: Set<string> }) => {
    // A procedural "Mannequin" built from basic shapes since we lack a GLB
    // Coordinates approximated to look like a standing figure

    return (
        <group position={[0, -1.8, 0]}>

            {/* HEAD */}
            <MuscleGroup name="head" position={[0, 3.6, 0]} args={[0.25, 0.4]} activeMuscles={activeMuscles} />

            {/* NECK/TRAPS */}
            <MuscleGroup name="traps" position={[0, 3.2, 0]} args={[0.15, 0.2]} activeMuscles={activeMuscles} />

            {/* CHEST */}
            <MuscleGroup name="chest" position={[0, 2.7, 0]} args={[0.35, 0.5]} rotation={[0, 0, Math.PI / 2]} activeMuscles={activeMuscles} label="Pecs" />

            {/* ABS */}
            <MuscleGroup name="abs" position={[0, 2.0, 0]} args={[0.25, 0.8]} activeMuscles={activeMuscles} />

            {/* BACK (Behind Chest - offset slightly z) - simplified as just same height but logically distinct */}
            <MuscleGroup name="back" position={[0, 2.7, -0.2]} args={[0.4, 0.6]} rotation={[0, 0, Math.PI / 2]} activeMuscles={activeMuscles} />

            {/* SHOULDERS */}
            <MuscleGroup name="shoulders" position={[-0.5, 3.0, 0]} args={[0.18, 0.3]} activeMuscles={activeMuscles} />
            <MuscleGroup name="shoulders" position={[0.5, 3.0, 0]} args={[0.18, 0.3]} activeMuscles={activeMuscles} />

            {/* ARMS (Biceps/Triceps combined area) */}
            <MuscleGroup name="arms" position={[-0.6, 2.4, 0]} args={[0.12, 0.6]} activeMuscles={activeMuscles} />
            <MuscleGroup name="arms" position={[0.6, 2.4, 0]} args={[0.12, 0.6]} activeMuscles={activeMuscles} />
            {/* Alias 'biceps' and 'triceps' to same geometry for demo if needed, or split */}
            {activeMuscles.has('biceps') && <MuscleGroup name="biceps" position={[-0.6, 2.4, 0.1]} args={[0.1, 0.4]} activeMuscles={activeMuscles} />}
            {activeMuscles.has('biceps') && <MuscleGroup name="biceps" position={[0.6, 2.4, 0.1]} args={[0.1, 0.4]} activeMuscles={activeMuscles} />}
            {activeMuscles.has('triceps') && <MuscleGroup name="triceps" position={[-0.6, 2.4, -0.1]} args={[0.1, 0.4]} activeMuscles={activeMuscles} />}
            {activeMuscles.has('triceps') && <MuscleGroup name="triceps" position={[0.6, 2.4, -0.1]} args={[0.1, 0.4]} activeMuscles={activeMuscles} />}


            {/* FOREARMS */}
            <MuscleGroup name="forearms" position={[-0.7, 1.6, 0]} args={[0.1, 0.6]} activeMuscles={activeMuscles} />
            <MuscleGroup name="forearms" position={[0.7, 1.6, 0]} args={[0.1, 0.6]} activeMuscles={activeMuscles} />

            {/* HIPS/GLUTES */}
            <MuscleGroup name="glutes" position={[0, 1.4, -0.1]} args={[0.3, 0.4]} rotation={[0, 0, Math.PI / 2]} activeMuscles={activeMuscles} />

            {/* QUADS (Upper Legs) */}
            <MuscleGroup name="quads" position={[-0.25, 0.8, 0.1]} args={[0.18, 0.8]} activeMuscles={activeMuscles} label="Quads" />
            <MuscleGroup name="quads" position={[0.25, 0.8, 0.1]} args={[0.18, 0.8]} activeMuscles={activeMuscles} label="Quads" />

            {/* HAMSTRINGS (Back Legs) */}
            <MuscleGroup name="hamstrings" position={[-0.25, 0.8, -0.1]} args={[0.17, 0.8]} activeMuscles={activeMuscles} />
            <MuscleGroup name="hamstrings" position={[0.25, 0.8, -0.1]} args={[0.17, 0.8]} activeMuscles={activeMuscles} />


            {/* CALVES */}
            <MuscleGroup name="calves" position={[-0.25, -0.2, -0.05]} args={[0.12, 0.7]} activeMuscles={activeMuscles} />
            <MuscleGroup name="calves" position={[0.25, -0.2, -0.05]} args={[0.12, 0.7]} activeMuscles={activeMuscles} />

        </group>
    );
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export const Hologram3D: React.FC<HologramProps> = ({ activeMuscles }) => {
    return (
        <div className="w-full h-full relative">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                {/* 1. Lighting */}
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} color="#0044aa" intensity={2} />

                {/* 2. Controls */}
                <OrbitControls
                    enableZoom={false}
                    autoRotate={true}
                    autoRotateSpeed={1}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 3}
                />

                {/* 3. The Model */}
                <AnatomyModel activeMuscles={activeMuscles} />

                {/* 4. Post Processing (Bloom) */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={0}
                        luminanceSmoothing={0.9}
                        height={300}
                        intensity={1.5}
                    />
                </EffectComposer>
            </Canvas>

            {/* Overlay Grid / Scan lines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:100%_4px]" />
        </div>
    );
};
