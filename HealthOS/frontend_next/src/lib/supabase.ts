import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized Supabase client (avoids build-time env var errors)
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key || url === 'your-supabase-url') {
            throw new Error(
                'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
            );
        }
        _supabase = createClient(url, key);
    }
    return _supabase;
}

// Re-export for convenience (lazy)
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabase() as any)[prop];
    },
});

// Type definitions matching our database schema
export interface Entry {
    id: number;
    raw_text: string;
    created_at: string;
    ingested_at: string | null;
    macros: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        water_ml: number;
        food_name: string;
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
        micros?: Record<string, number>;
        warnings?: string[] | null;
        error?: string;
    } | null;
}

export interface DailyGoal {
    date: string;
    calorie_target: number;
    protein_target: number;
    water_target_ml: number;
}

export interface DashboardData {
    date: string;
    goals: { calories: number; protein: number; water_ml: number };
    totals: { calories: number; protein: number; carbs: number; fats: number; water_ml: number };
    entries: Entry[];
}
