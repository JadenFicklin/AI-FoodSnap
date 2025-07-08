export {};

export interface NutrientBreakdown {
  [nutrient: string]: number | string; // e.g., 'Protein': 12, 'Vitamin C': 5.2
}

export interface FoodNutrient {
  food: string;
  grams: number;
  macronutrients: NutrientBreakdown;
  micronutrients: NutrientBreakdown;
}

export interface NutrientSheetResult {
  foods: FoodNutrient[];
  totals: {
    macronutrients: NutrientBreakdown;
    micronutrients: NutrientBreakdown;
  };
}
