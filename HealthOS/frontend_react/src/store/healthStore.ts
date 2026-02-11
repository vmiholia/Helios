import { create } from 'zustand';

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
    loading: boolean;
    error: string | null;

    // Actions
    fetchDashboard: (date?: string) => Promise<void>;
    addEntry: (text: string) => Promise<void>;
    deleteEntry: (id: number) => Promise<void>;
}

export const useHealthStore = create<HealthState>((set, get) => ({
    date: new Date().toISOString().split('T')[0],
    goals: { calories: 2000, protein: 150, water_ml: 3000 },
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0, water_ml: 0 },
    entries: [],
    loading: false,
    error: null,

    fetchDashboard: async (date) => {
        set({ loading: true, error: null });
        try {
            const url = date ? `http://localhost:8000/dashboard?date=${date}` : `http://localhost:8000/dashboard`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch dashboard');
            const data = await res.json();

            set({
                date: data.date,
                goals: data.goals,
                totals: data.totals,
                entries: data.entries,
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
