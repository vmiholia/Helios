import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { raw_text } = await req.json();

    const prompt = `You are a food log parser. Break the user's messy food log into discrete, structured items with clear quantities.

User Input: "${raw_text}"

RULES:
1. Identify each distinct food item mentioned.
2. For each item, infer a reasonable quantity with a UNIT (slices, eggs, katori, pieces, g, ml, cups, etc.).
3. If the user mentions "sandwiches", calculate how many bread slices that implies (2 sandwiches = 4 slices).
4. If the user mentions "omelette" without specifying eggs, assume 2 eggs and note it.
5. Extract the time if mentioned, even if it has typos (e.g., "arond 10 30 amm" → "10:30 am").
6. Add a brief 'note' explaining any assumptions you made, so the user can correct them.
7. Set 'confidence' to "high", "medium", or "low" based on how clear the input was.
8. Return ONLY valid JSON. No preamble, no markdown.

JSON Schema:
{
    "items": [
        {
            "name": "Item name (clean, title case)",
            "quantity": "Amount with unit (e.g., '4 slices', '2 eggs', '1 katori')",
            "note": "Brief assumption explanation"
        }
    ],
    "time": "Extracted time string (e.g., '10:30 am') or null if not found",
    "confidence": "high|medium|low"
}

EXAMPLE:
Input: "2 sandwiches sourdough bread, omelette, ham, cheese at 10 30 am"
Output:
{
    "items": [
        {"name": "Sourdough Bread", "quantity": "4 slices", "note": "2 sandwiches = 4 slices"},
        {"name": "Egg Omelette", "quantity": "2 eggs", "note": "Standard 2-egg omelette assumed"},
        {"name": "Ham", "quantity": "2 slices", "note": "Deli ham, 1 slice per sandwich"},
        {"name": "Cheese", "quantity": "1 slice", "note": "1 slice total assumed"}
    ],
    "time": "10:30 am",
    "confidence": "medium"
}`;

    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }],
        });

        let content = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

        if (content.startsWith('```')) {
            content = content.split('\n', 2)[1] || content.slice(3);
            content = content.replace(/```\s*$/, '').trim();
        }

        return NextResponse.json(JSON.parse(content));
    } catch (e: any) {
        return NextResponse.json({ error: `Parse failed: ${e.message}` }, { status: 500 });
    }
}
