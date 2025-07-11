// @ts-ignore: Vercel provides these types at runtime
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for debugging (allow all origins)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { foods } = req.body;
  if (!Array.isArray(foods) || foods.length === 0) {
    res.status(400).json({ error: 'Foods array is required' });
    return;
  }
  try {
    const foodList = foods
      .map((f: any) => `${f.food} (${f.grams}g)`)
      .join(', ');
    const exampleJson = `{"totals": {"macronutrients": {"calories": 617, "protein": 11.5, "fats": 24.3, "carbohydrates": 89.2, "fiber": 4.1, "sugar": 28.9}, "micronutrients": {"calcium_mg": 133.5, "iron_mg": 3.6, "magnesium_mg": 53.4, "phosphorus_mg": 162.2, "potassium_mg": 347.8, "sodium_mg": 431.1, "zinc_mg": 1.8, "copper_mg": 0.4, "manganese_mg": 1.5, "selenium_ug": 10.2, "vitamin_a_ug": 135.7, "vitamin_b1_mg": 0.3, "vitamin_b2_mg": 0.3, "vitamin_b3_mg": 3.1, "vitamin_b5_mg": 0.6, "vitamin_b6_mg": 0.2, "vitamin_b12_ug": 0.2, "vitamin_c_mg": 13.1, "vitamin_d_ug": 0, "vitamin_e_mg": 0.6, "vitamin_k_ug": 7.9, "folate_ug": 42.5, "cholesterol_mg": 39.1}}}`;
    const prompt = `For the following foods and their amounts in grams, provide ONLY the total sum of every macronutrient and every micronutrient contributed by all foods combined. Use the EXACT JSON format and keys below, with the same units and all fields present (even if zero). Do not add or remove any fields. Respond in JSON only, no explanation. Example format: ${exampleJson} Foods: ${foodList}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert. Given a list of foods and their amounts in grams, return ONLY the total sum of every macronutrient and every micronutrient contributed by all foods combined. Use the EXACT JSON format and keys below, with the same units and all fields present (even if zero). Do not add or remove any fields. Respond in JSON only, no explanation. Example format: ${exampleJson}`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000
    });
    let result: any;
    let content = completion.choices[0].message?.content || '{}';
    // Try to extract JSON from markdown code block if present
    const match = content.match(/```json\s*([\s\S]*?)```/i);
    if (match) {
      content = match[1];
    }
    try {
      result = JSON.parse(content);
    } catch (e) {
      result = { totals: { macronutrients: {}, micronutrients: {} } };
    }
    // Ensure result has totals field only
    if (!result || typeof result !== 'object') {
      result = { totals: { macronutrients: {}, micronutrients: {} } };
    } else {
      if (!result.totals || typeof result.totals !== 'object') {
        result.totals = { macronutrients: {}, micronutrients: {} };
      } else {
        if (
          !result.totals.macronutrients ||
          typeof result.totals.macronutrients !== 'object'
        )
          result.totals.macronutrients = {};
        if (
          !result.totals.micronutrients ||
          typeof result.totals.micronutrients !== 'object'
        )
          result.totals.micronutrients = {};
      }
    }
    res.status(200).json(result);
  } catch (error: any) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? error.message
        : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
