import type { NutrientSheetResult } from './types.js';

// NOTE: This function calls the backend endpoint for nutrient sheet analysis.
export async function getNutrientSheet(
  foods: { food: string; grams: number }[]
): Promise<NutrientSheetResult> {
  const response = await fetch(
    'http://localhost:3001/api/openai-nutrient-sheet',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foods })
    }
  );
  const data = await response.json();
  return data as NutrientSheetResult;
}
