import { create } from 'zustand';

// ─── Constants ───────────────────────────────────────────────
const DEFAULT_TARGETS: Record<string, number> = {
    // Macros
    calories: 2000,
    protein_g: 150,
    carbohydrate_g: 250,
    fat_total_g: 70,
    sugar_g: 30,
    fiber_g: 30,

    // Vitamins
    vitamin_a_iu: 3000,
    vitamin_c_mg: 90,
    vitamin_d_iu: 600,
    vitamin_e_mg: 15,
    vitamin_k_mcg: 120,
    vitamin_b1_thiamine_mg: 1.2,
    vitamin_b2_riboflavin_mg: 1.3,
    vitamin_b3_niacin_mg: 16,
    vitamin_b5_pantothenic_acid_mg: 5,
    vitamin_b6_pyridoxine_mg: 1.3,
    vitamin_b7_biotin_mcg: 30,
    vitamin_b9_folate_mcg: 400,
    vitamin_b12_cobalamin_mcg: 2.4,

    // Minerals
    calcium_mg: 1000,
    iron_mg: 8,
    magnesium_mg: 400,
    phosphorus_mg: 700,
    potassium_mg: 3400,
    sodium_mg: 2300,
    zinc_mg: 11,
    copper_mcg: 900,
    manganese_mg: 2.3,
    selenium_mcg: 55,
    iodine_mcg: 150,
    chromium_mcg: 35,
    molybdenum_mcg: 45,
    chloride_mg: 2300,

    // Other / Derived
    epa_mg: 250,
    dha_mg: 250,
    creatine_g: 5,
};

// ─── Interfaces ──────────────────────────────────────────────

interface Entry {
    id: number;
    raw_text: string;
    ingested_at: string;
    macros: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        water_ml: number;
        food_name: string;
        // Expanded Data
        items?: Array<{
            name: string;
            quantity: string;
            nutrients: {
                calories: number;
                protein: number;
                carbs: number;
                fats: number;
                fiber: number;
                sugar: number;
                sodium: number;
                [key: string]: number;
            };
        }>;
        micros?: {
            [key: string]: number;
        };
    };
}

interface Goals {
    calories: number;
    protein: number;
    water_ml: number;
}

interface Totals {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    water_ml: number;
}

interface HealthState {
    date: string;
    goals: Goals;
    totals: Totals;
    entries: Entry[];

    // UI Data for Nutrient Matrix
    nutrients: Record<string, number>;
    targets: Record<string, number>;

    loading: boolean;
    error: string | null;
    prefillText: string | null;

    // Actions
    fetchDashboard: (date?: string) => Promise<void>;
    addEntry: (text: string) => Promise<void>;
    deleteEntry: (id: number) => Promise<void>;
    setPrefillText: (text: string | null) => void;
}

// ─── Store Helper ────────────────────────────────────────────

const aggregateNutrients = (entries: Entry[]): Record<string, number> => {
    const totalNutrients: Record<string, number> = {};

    entries.forEach(entry => {
        // MICRO-NUTRIENTS STRATEGY:
        // The backend provides a comprehensive 'micros' object at the entry level which contains 
        // the sum of all vitamins/minerals for that log. Item-level 'nutrients' only contain 
        // basic macros (protein/fats/carbs). Therefore, we MUST use the top-level 'micros' 
        // object for all micronutrient calculations.

        if (entry.macros && entry.macros.micros) {
            Object.entries(entry.macros.micros).forEach(([key, value]) => {
                // Accumulate values. 
                // Ensure we handle strings that might slip through (though types say numbers)
                const val = Number(value) || 0;
                totalNutrients[key] = (totalNutrients[key] || 0) + val;
            });
        }
    });

    return totalNutrients;
};

export const useHealthStore = create<HealthState>((set, get) => ({
    date: new Date().toISOString().split('T')[0],
    goals: { calories: 2000, protein: 150, water_ml: 3000 },
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0, water_ml: 0 },
    entries: [],

    // Initial State
    nutrients: {},
    targets: DEFAULT_TARGETS,

    loading: false,
    error: null,
    prefillText: null,

    setPrefillText: (text) => set({ prefillText: text }),

    fetchDashboard: async (date) => {
        const effectiveDate = date || get().date;
        set({ loading: true, error: null });
        try {
            const url = `http://localhost:8000/dashboard?date=${effectiveDate}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch dashboard');
            const data = await res.json();

            // Calculate Aggregated Nutrients from Entries
            const aggregated = aggregateNutrients(data.entries || []);

            // Merge with main totals for macros to ensure accuracy
            aggregated.calories = data.totals.calories;
            aggregated.protein_g = data.totals.protein;
            aggregated.carbohydrate_g = data.totals.carbs;
            aggregated.fat_total_g = data.totals.fats;

            set({
                date: data.date,
                goals: data.goals,
                totals: data.totals,
                entries: data.entries,
                nutrients: aggregated,
                targets: { ...DEFAULT_TARGETS, ...data.goals }, // Override defaults with user goals if any
                loading: false
            });
        } catch (err: any) {
            set({ loading: false, error: err.message });
        }
    },

    addEntry: async (text) => {
        set({ loading: true, error: null });
        try {
            const currentDate = get().date; // Get currently selected date
            const res = await fetch('http://localhost:8000/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    raw_text: text,
                    date: currentDate
                })
            });
            if (!res.ok) throw new Error('Failed to log entry');

            const selectedDate = get().date;
            await get().fetchDashboard(selectedDate);
            set({ loading: false }); // Clear loading state on success
        } catch (err: any) {
            set({ loading: false, error: err.message });
        }
    },

    deleteEntry: async (id) => {
        const currentEntries = get().entries;
        set({ entries: currentEntries.filter(e => e.id !== id) });

        try {
            const res = await fetch(`http://localhost:8000/log/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            const selectedDate = get().date;
            await get().fetchDashboard(selectedDate);
        } catch (err: any) {
            set({ entries: currentEntries, error: err.message });
        }
    }
}));
