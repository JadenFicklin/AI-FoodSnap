import type { NutrientSheetResult } from './types.js';

// NOTE: This function calls the backend endpoint for nutrient sheet analysis.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';

export async function getNutrientSheet(
  foods: { food: string; grams: number }[]
): Promise<NutrientSheetResult> {
  const response = await fetch(`${BACKEND_URL}/api/openai-nutrient-sheet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foods })
  });
  const data = await response.json();
  return data as NutrientSheetResult;
}
