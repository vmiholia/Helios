import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { raw_text, date } = await req.json();

    let currentTime: string;
    if (date) {
        currentTime = new Date(`${date}T12:00:00`).toISOString();
    } else {
        currentTime = new Date().toISOString();
    }

    const prompt = `You are a PRECISION NUTRITION ANALYST — the world's most accurate food logging engine.
Your task: Parse a user's food log into exact nutritional data. Accuracy is paramount. You must think like a clinical dietitian cross-referencing IFCT (Indian Food Composition Tables), USDA FoodData Central, and HealthifyMe's verified Indian food database.

User Input: "${raw_text}"
Current Time: ${currentTime}

═══════════════════════════════════════
SECTION 1: PORTION SIZE CALIBRATION
═══════════════════════════════════════
You MUST use these standard Indian portion sizes. Never guess — use these anchors:

COOKED FOODS (always use COOKED values, never raw):
• 1 katori (standard Indian bowl) = ~150ml = ~150g cooked weight
• 1 katori cooked rice = ~150g cooked = ~170 kcal, 3.5g protein, 37g carbs
• 1 katori cooked dal (any variety) = ~150g cooked = ~120-150 kcal, 7-9g protein, 15-22g carbs
• 1 katori cooked sabzi (dry) = ~150g = varies by dish
• 1 katori cooked sabzi (gravy) = ~200ml including liquid

BREADS:
• 1 medium roti/chapati = ~30g dry atta = ~40g cooked = 72 kcal, 2.5g protein, 15g carbs, 0.4g fat
• 1 paratha (plain) = ~45g dry atta + ghee = ~150 kcal, 3.5g protein, 20g carbs, 7g fat
• 1 naan = ~260 kcal, 8g protein, 42g carbs, 5g fat
• 1 slice sourdough bread (e.g. Krumbkraft bakery, 400g loaf / ~10 slices) = ~40g = 105 kcal, 3.5g protein, 20g carbs, 1g fat
• 1 slice regular bread = ~30g = 80 kcal, 3g protein, 14g carbs, 1g fat

DELI MEATS & CHEESE (Indian market):
• 1 slice deli ham (India, e.g. Prasuma/Godrej) = ~25-30g = 35 kcal, 5g protein, 0.5g carbs, 1.5g fat
• 1 slice Amul processed cheese = ~20g = 60 kcal, 4g protein, 1g carbs, 5g fat

RICE:
• 1 katori cooked white rice = 170 kcal | 1/2 katori = 85 kcal
• 1 plate/serving cooked rice (~200g) = 230 kcal

PROTEINS:
• 1 whole egg (large, cooked) = 78 kcal, 6g protein, 0.6g carbs, 5g fat
• 1 egg omelette (with oil/butter) = ~95 kcal, 6.5g protein, 1g carbs, 7g fat
• 1 katori paneer = ~265 kcal, 18g protein
• 1 glass whole milk (200ml) = 120 kcal, 6.3g protein, 9g carbs, 6.5g fat
• 1 katori curd/yogurt = ~100 kcal, 5g protein

CRITICAL CONVERSION RULES:
• RAW dal has ~24g protein per 100g. COOKED dal has ~7-9g per 100g (3x water absorption).
• RAW rice has ~7g protein per 100g. COOKED rice has ~2.7g per 100g.
• NEVER confuse raw nutritional data with cooked portions. The user always means COOKED unless they say "raw" or "dry".
• Kadhi (yogurt + besan gravy) = ~80-90 kcal per katori, 3-4g protein. It is NOT a high-protein food.

═══════════════════════════════════════
SECTION 2: ANTI-INFLATION GUARDRAILS
═══════════════════════════════════════
Before finalizing, verify these sanity checks:
• 1 roti CANNOT exceed 85 kcal or 3g protein
• 1 katori cooked dal CANNOT exceed 10g protein
• 2 slices of any bread CANNOT exceed 12g protein
• A simple vegetarian Indian meal (sabzi + roti + rice) typically totals 400-600 kcal, 12-20g protein
• An egg omelette sandwich CANNOT have more protein than the eggs + fillings combined
• Total meal protein should pass the "does this make sense" test: 50g+ protein requires significant meat/paneer/eggs

═══════════════════════════════════════
SECTION 3: REGIONAL FOOD INTELLIGENCE
═══════════════════════════════════════
• Bengali: Posto = poppy seed paste (high fat, low protein). Jhinge = ridge gourd. Aloo = potato.
• North Indian: Kadhi = yogurt-besan gravy (NOT dal). Rajma/Chole = higher protein (8-10g/katori cooked).
• South Indian: Sambar has more dal than kadhi (~6-8g protein/katori). Dosa = fermented rice-urad batter.
• Street food: Vada pav ~300 kcal, Pav bhaji plate ~450 kcal, 2 samosas ~350 kcal.

═══════════════════════════════════════
SECTION 4: SUPPLEMENTS & SPECIAL ITEMS
═══════════════════════════════════════
• SUPPLEMENT CONCENTRATION: Capsule total weight ≠ active ingredient weight. Fish oil 1250mg cap ≈ 30-55% omega-3.
• Brand intelligence: 'Sports Research' 1250mg fish oil = ~690mg EPA, ~260mg DHA per cap.
• Creatine monohydrate: Extract exact dosage as 'creatine_g'. Common dose = 5g.
• If a specific dosage is mentioned (e.g. "5g", "500mg", "10gm"), it MUST appear in the 'micros' object. Never omit a stated dosage.
• Vitamin D for "Fish Oil" should NOT be assumed unless "Cod Liver Oil" or Vitamin D is explicitly mentioned.

═══════════════════════════════════════
SECTION 5: TIME & OUTPUT
═══════════════════════════════════════
• Extract 'ingested_at' time. Use YEAR from Current Time (${currentTime.slice(0, 4)}).
• Return ONLY valid JSON. No preamble, no markdown, no explanation.
• Include only micronutrients that are meaningfully present (>5% DV). Omit zeros.

JSON Schema:
{
    "food_name": "Summary string",
    "ingested_at": "ISO 8601 string",
    "items": [
        {
            "name": "Item Name",
            "quantity": "Amount with unit",
            "nutrients": {
                "calories": "int",
                "protein": "float",
                "carbs": "float",
                "fats": "float",
                "fiber": "float",
                "sugar": "float",
                "sodium": "int"
            }
        }
    ],
    "total_macros": {
        "calories": "int",
        "protein": "float",
        "carbs": "float",
        "fats": "float",
        "water_ml": "int"
    },
    "micros": {
        "creatine_g": "float",
        "epa_mg": "float",
        "dha_mg": "float",
        "vitamin_a_iu": "int",
        "vitamin_b1_thiamine_mg": "float",
        "vitamin_b2_riboflavin_mg": "float",
        "vitamin_b3_niacin_mg": "float",
        "vitamin_b5_pantothenic_acid_mg": "float",
        "vitamin_b6_pyridoxine_mg": "float",
        "vitamin_b7_biotin_mcg": "float",
        "vitamin_b9_folate_mcg": "float",
        "vitamin_b12_cobalamin_mcg": "float",
        "vitamin_c_mg": "int",
        "vitamin_d_iu": "int",
        "vitamin_e_mg": "float",
        "vitamin_k_mcg": "float",
        "calcium_mg": "int",
        "sodium_mg": "int",
        "potassium_mg": "int",
        "magnesium_mg": "int",
        "phosphorus_mg": "int",
        "chloride_mg": "int",
        "iron_mg": "float",
        "zinc_mg": "float",
        "copper_mcg": "float",
        "manganese_mg": "float",
        "selenium_mcg": "float",
        "iodine_mcg": "float",
        "chromium_mcg": "float",
        "molybdenum_mcg": "float",
        "fiber_g": "float",
        "sugar_g": "float",
        "added_sugar_g": "float",
        "saturated_fat_g": "float",
        "cholesterol_mg": "int"
    }
}`;

    try {
        // Retry logic
        const MAX_RETRIES = 2;
        let data: any;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const message = await anthropic.messages.create({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 2500,
                    messages: [{ role: 'user', content: prompt }],
                });

                console.log(
                    `[Sonnet API] stop_reason=${message.stop_reason}, ` +
                    `content_blocks=${message.content.length}, ` +
                    `usage={input=${message.usage.input_tokens}, output=${message.usage.output_tokens}}`
                );

                if (message.stop_reason === 'max_tokens') {
                    console.warn('[WARNING] Sonnet hit max_tokens — response may be truncated!');
                }

                if (!message.content.length) {
                    if (attempt < MAX_RETRIES) {
                        console.warn(`[Sonnet API] Empty content on attempt ${attempt + 1}, retrying...`);
                        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                        continue;
                    }
                    throw new Error('Sonnet returned no content blocks after all retries');
                }

                let content = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

                console.log(`[Sonnet Response] Length=${content.length}, First 200 chars: ${content.slice(0, 200)}`);

                if (!content) {
                    if (attempt < MAX_RETRIES) {
                        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                        continue;
                    }
                    throw new Error('Sonnet returned empty text after all retries');
                }

                // Strip markdown code fences
                if (content.startsWith('```')) {
                    content = content.split('\n', 2)[1] || content.slice(3);
                    if (content.endsWith('```')) content = content.slice(0, -3).trim();
                }

                data = JSON.parse(content);
                break;
            } catch (e: any) {
                if (e instanceof SyntaxError && attempt < MAX_RETRIES) {
                    console.warn(`[Sonnet API] JSON parse failed on attempt ${attempt + 1}: ${e.message}`);
                    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                    continue;
                }
                throw e;
            }
        }

        // Validation: check for silent extraction failures
        const warnings: string[] = [];
        const rawLower = raw_text.toLowerCase();
        const micros = data.micros || {};

        const checkMap: Record<string, string> = {
            creatine: 'creatine_g',
            omega: 'epa_mg',
            'fish oil': 'epa_mg',
            magnesium: 'magnesium_mg',
            'vitamin d': 'vitamin_d_iu',
        };

        for (const [keyword, key] of Object.entries(checkMap)) {
            if (rawLower.includes(keyword) && (!micros[key] || micros[key] === 0)) {
                warnings.push(`Mentioned '${keyword}' but no ${key} was extracted.`);
            }
        }

        // Insert into Supabase
        const macros = {
            calories: data.total_macros?.calories ?? 0,
            protein: data.total_macros?.protein ?? 0,
            carbs: data.total_macros?.carbs ?? 0,
            fats: data.total_macros?.fats ?? 0,
            water_ml: data.total_macros?.water_ml ?? 0,
            food_name: data.food_name ?? 'Unknown',
            items: data.items ?? [],
            micros,
            warnings: warnings.length ? warnings : null,
        };

        const ingestedAt = data.ingested_at || currentTime;

        const { data: entry, error } = await supabase
            .from('entries')
            .insert({
                raw_text,
                ingested_at: ingestedAt,
                macros,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(entry);
    } catch (e: any) {
        console.error(`LLM Error: ${e.message}`);

        // Fallback: save raw text even if LLM fails
        const { data: fallback, error: fallbackError } = await supabase
            .from('entries')
            .insert({
                raw_text,
                ingested_at: currentTime,
                macros: {
                    error: e.message,
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    water_ml: 0,
                    food_name: raw_text,
                    items: [],
                    micros: {},
                    warnings: [`LLM failed: ${e.message}. Nutrients could not be calculated.`],
                },
            })
            .select()
            .single();

        if (fallbackError) {
            return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }

        return NextResponse.json(fallback);
    }
}
