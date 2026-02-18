export const CATEGORIES: Record<string, string[]> = {
    'Vitamins': ['vitamin_a_iu', 'vitamin_c_mg', 'vitamin_d_iu', 'vitamin_e_mg', 'vitamin_k_mcg', 'vitamin_b1_thiamine_mg', 'vitamin_b2_riboflavin_mg', 'vitamin_b3_niacin_mg', 'vitamin_b5_pantothenic_acid_mg', 'vitamin_b6_pyridoxine_mg', 'vitamin_b7_biotin_mcg', 'vitamin_b9_folate_mcg', 'vitamin_b12_cobalamin_mcg'],
    'Minerals': ['calcium_mg', 'iron_mg', 'magnesium_mg', 'phosphorus_mg', 'potassium_mg', 'sodium_mg', 'zinc_mg', 'copper_mcg', 'manganese_mg', 'selenium_mcg', 'iodine_mcg', 'chromium_mcg', 'molybdenum_mcg', 'chloride_mg'],
    'Supplements': ['creatine_g', 'epa_mg', 'dha_mg'],
};

export const LABEL_MAP: Record<string, { label: string; unit: string; color: string; emoji: string }> = {
    // Macros
    calories: { label: 'Calories', unit: 'kcal', color: 'text-white', emoji: '🔥' },
    protein_g: { label: 'Protein', unit: 'g', color: 'text-violet-400', emoji: '⚡' },
    carbohydrate_g: { label: 'Carbs', unit: 'g', color: 'text-cyan-400', emoji: '🌾' },
    fat_total_g: { label: 'Fats', unit: 'g', color: 'text-emerald-400', emoji: '💧' },
    fiber_g: { label: 'Fiber', unit: 'g', color: 'text-amber-500', emoji: '🥗' },
    sugar_g: { label: 'Sugar', unit: 'g', color: 'text-pink-400', emoji: '🍭' },

    // Vitamins
    vitamin_a_iu: { label: 'Vit A', unit: 'IU', color: 'text-orange-400', emoji: '🥕' },
    vitamin_c_mg: { label: 'Vit C', unit: 'mg', color: 'text-yellow-400', emoji: '🍋' },
    vitamin_d_iu: { label: 'Vit D', unit: 'IU', color: 'text-yellow-200', emoji: '☀️' },
    vitamin_e_mg: { label: 'Vit E', unit: 'mg', color: 'text-emerald-300', emoji: '🥜' },
    vitamin_k_mcg: { label: 'Vit K', unit: 'µg', color: 'text-green-400', emoji: '🥬' },
    vitamin_b1_thiamine_mg: { label: 'B1 (Thiamin)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b2_riboflavin_mg: { label: 'B2 (Ribofl)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b3_niacin_mg: { label: 'B3 (Niacin)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b5_pantothenic_acid_mg: { label: 'B5 (Panto)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b6_pyridoxine_mg: { label: 'B6 (Pyridox)', unit: 'mg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b7_biotin_mcg: { label: 'B7 (Biotin)', unit: 'µg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b9_folate_mcg: { label: 'B9 (Folate)', unit: 'µg', color: 'text-indigo-400', emoji: '🧬' },
    vitamin_b12_cobalamin_mcg: { label: 'B12 (Cobal)', unit: 'µg', color: 'text-indigo-400', emoji: '🧬' },

    // Minerals
    calcium_mg: { label: 'Calcium', unit: 'mg', color: 'text-stone-300', emoji: '🦴' },
    iron_mg: { label: 'Iron', unit: 'mg', color: 'text-red-400', emoji: '🩸' },
    magnesium_mg: { label: 'Magnesium', unit: 'mg', color: 'text-stone-400', emoji: '🐚' },
    phosphorus_mg: { label: 'Phosphorus', unit: 'mg', color: 'text-stone-400', emoji: '🌋' },
    potassium_mg: { label: 'Potassium', unit: 'mg', color: 'text-stone-400', emoji: '🍌' },
    sodium_mg: { label: 'Sodium', unit: 'mg', color: 'text-stone-400', emoji: '🧂' },
    zinc_mg: { label: 'Zinc', unit: 'mg', color: 'text-stone-400', emoji: '🛡️' },
    copper_mcg: { label: 'Copper', unit: 'µg', color: 'text-orange-300', emoji: '🥉' },
    manganese_mg: { label: 'Manganese', unit: 'mg', color: 'text-stone-400', emoji: '🎡' },
    selenium_mcg: { label: 'Selenium', unit: 'µg', color: 'text-stone-400', emoji: '🐚' },
    iodine_mcg: { label: 'Iodine', unit: 'µg', color: 'text-stone-400', emoji: '🐳' },
    chromium_mcg: { label: 'Chromium', unit: 'µg', color: 'text-stone-400', emoji: '🏎️' },
    molybdenum_mcg: { label: 'Molybdenum', unit: 'µg', color: 'text-stone-400', emoji: '🔬' },
    chloride_mg: { label: 'Chloride', unit: 'mg', color: 'text-stone-400', emoji: '🧂' },

    // Supplements
    creatine_g: { label: 'Creatine', unit: 'g', color: 'text-cyan-400', emoji: '⚡' },
    epa_mg: { label: 'EPA', unit: 'mg', color: 'text-blue-400', emoji: '🐟' },
    dha_mg: { label: 'DHA', unit: 'mg', color: 'text-blue-400', emoji: '🐟' },
};
