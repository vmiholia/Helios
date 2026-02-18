import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useHealthStore } from '../../store/healthStore';

// Components
import { NutrientDashboardLayout } from './nutrient-matrix/NutrientDashboardLayout';
import { DailyOverviewPanel } from './nutrient-matrix/DailyOverviewPanel';
import { NutrientGrid } from './nutrient-matrix/NutrientGrid';
import { MealsFeed } from './nutrient-matrix/MealsFeed';
import { NutrientDetailModal } from './nutrient-matrix/NutrientDetailModal';

// ─── MAIN COMPONENT ──────────────────────────────────────────

export const NutrientMatrix = () => {
    const { nutrients, targets, entries, date, fetchDashboard } = useHealthStore();

    // State
    const [selectedNutrient, setSelectedNutrient] = useState<any | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'nutrients' | 'meals'>('nutrients');

    // Date Navigation Logic
    const handlePrevDate = () => {
        setSelectedMeal(null);
        const d = new Date(date);
        d.setDate(d.getDate() - 1);
        fetchDashboard(d.toISOString().split('T')[0]);
    };

    const handleNextDate = () => {
        setSelectedMeal(null);
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        fetchDashboard(d.toISOString().split('T')[0]);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMeal(null);
        fetchDashboard(e.target.value);
    };

    // Switch to Meals tab if a meal is selected
    useEffect(() => {
        if (selectedMeal) setActiveTab('meals');
    }, [selectedMeal]);

    // Data Preparation: Macros
    const macros = [
        { key: 'protein_g', label: 'Protein', color: 'text-violet-400', emoji: '⚡' },
        { key: 'carbohydrate_g', label: 'Carbs', color: 'text-cyan-400', emoji: '🌾' },
        { key: 'fat_total_g', label: 'Fats', color: 'text-emerald-400', emoji: '💧' },
        { key: 'fiber_g', label: 'Fiber', color: 'text-amber-500', emoji: '🥗' },
    ].map(m => ({
        ...m,
        value: nutrients[m.key] || 0,
        target: targets[m.key] || 100,
    }));

    // Data Preparation: Meal Specific Macros
    const mealMacros = selectedMeal ? [
        { key: 'protein_g', label: 'Protein', color: 'text-violet-400', emoji: '⚡', value: selectedMeal.macros.protein || 0, target: targets.protein_g },
        { key: 'carbohydrate_g', label: 'Carbs', color: 'text-cyan-400', emoji: '🌾', value: selectedMeal.macros.carbs || 0, target: targets.carbohydrate_g },
        { key: 'fat_total_g', label: 'Fats', color: 'text-emerald-400', emoji: '💧', value: selectedMeal.macros.fats || 0, target: targets.fat_total_g },
        {
            key: 'fiber_g', label: 'Fiber', color: 'text-amber-500', emoji: '🥗',
            value: selectedMeal.macros.items ? selectedMeal.macros.items.reduce((acc: number, item: any) => acc + (item.nutrients?.fiber || 0), 0) : 0,
            target: targets.fiber_g
        }
    ] : [];

    // Data Preparation: Calories
    const calories = selectedMeal
        ? { value: selectedMeal.macros.calories || 0, target: targets.calories }
        : { value: nutrients.calories || 0, target: targets.calories || 2000 };

    // Layout Composition
    return (
        <NutrientDashboardLayout
            // 1. Sidebar (Context)
            sidebar={
                <DailyOverviewPanel
                    date={date}
                    selectedMeal={selectedMeal}
                    calories={calories}
                    macros={selectedMeal ? mealMacros : macros}
                    onPrevDate={handlePrevDate}
                    onNextDate={handleNextDate}
                    onDateChange={handleDateChange}
                    onClearSelection={() => setSelectedMeal(null)}
                />
            }

            // 2. Main Content
            content={
                <>
                    {/* Top Level Tabs */}
                    <div className="flex items-center border-b border-neutral-800/30 bg-neutral-900/20 px-4">
                        <button
                            onClick={() => { setActiveTab('nutrients'); setSelectedMeal(null); }}
                            className={clsx(
                                "px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2",
                                activeTab === 'nutrients'
                                    ? "border-cyan-500 text-cyan-400"
                                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Nutrients
                        </button>
                        <button
                            onClick={() => setActiveTab('meals')}
                            className={clsx(
                                "px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2",
                                activeTab === 'meals'
                                    ? "border-violet-500 text-violet-400"
                                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Meals
                        </button>
                    </div>

                    {/* View Switching */}
                    {activeTab === 'nutrients' ? (
                        <NutrientGrid
                            nutrients={nutrients}
                            targets={targets}
                            onSelectNutrient={setSelectedNutrient}
                        />
                    ) : (
                        <MealsFeed
                            entries={entries}
                            selectedId={selectedMeal?.id}
                            onSelect={setSelectedMeal}
                        />
                    )}
                </>
            }

            // 3. Overlays
            overlay={
                <NutrientDetailModal
                    selectedNutrient={selectedNutrient}
                    onClose={() => setSelectedNutrient(null)}
                />
            }
        />
    );
};
