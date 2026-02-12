import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get or create daily goal
    let { data: goal } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('date', date)
        .single();

    if (!goal) {
        const { data: newGoal } = await supabase
            .from('daily_goals')
            .insert({ date, calorie_target: 2000, protein_target: 150, water_target_ml: 3000 })
            .select()
            .single();
        goal = newGoal;
    }

    // Get entries for the date
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .gte('ingested_at', startOfDay)
        .lte('ingested_at', endOfDay)
        .order('ingested_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalWater = 0;

    for (const e of entries || []) {
        if (e.macros) {
            totalCalories += e.macros.calories || 0;
            totalProtein += e.macros.protein || 0;
            totalCarbs += e.macros.carbs || 0;
            totalFats += e.macros.fats || 0;
            totalWater += e.macros.water_ml || 0;
        }
    }

    return NextResponse.json({
        date,
        goals: {
            calories: goal?.calorie_target ?? 2000,
            protein: goal?.protein_target ?? 150,
            water_ml: goal?.water_target_ml ?? 3000,
        },
        totals: {
            calories: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fats: totalFats,
            water_ml: totalWater,
        },
        entries: entries || [],
    });
}
