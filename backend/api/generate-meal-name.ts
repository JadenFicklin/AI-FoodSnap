// @ts-ignore: Vercel provides these types at runtime
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { foods } = req.body;

    if (!foods || !Array.isArray(foods)) {
      return res.status(400).json({ error: 'Foods array is required' });
    }

    const foodList = foods
      .map((food: any) => `${food.food} (${food.grams}g)`)
      .join(', ');

    const prompt = `Given these foods: ${foodList}

Please generate a short, descriptive meal name (2-4 words) that captures the essence of this meal. The name should be appetizing and easy to understand.

Examples of good meal names:
- "Grilled Chicken Salad"
- "Pasta Carbonara"
- "Berry Smoothie Bowl"
- "Steak with Vegetables"

Return only the meal name, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates descriptive meal names based on food ingredients.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 20,
      temperature: 0.7
    });

    const mealName =
      completion.choices[0]?.message?.content?.trim() || 'Custom Meal';

    res.status(200).json({ mealName });
  } catch (error) {
    console.error('Error generating meal name:', error);
    res.status(500).json({ error: 'Failed to generate meal name' });
  }
}
