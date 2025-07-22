import React from 'react';
import type { NutrientSheetResult } from './types.js';

interface NutrientSheetProps {
  data: NutrientSheetResult;
}

const formatValue = (value: number | string, nutrient: string): string => {
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return value.toString();

  // Round to 1 decimal place
  const roundedValue = Math.round(numValue * 10) / 10;

  // Add units based on nutrient name
  if (nutrient.includes('_mg')) return `${roundedValue} mg`;
  if (nutrient.includes('_ug')) return `${roundedValue} µg`;
  if (nutrient === 'calories') return `${roundedValue} kcal`;
  if (['protein', 'fats', 'carbohydrates', 'fiber', 'sugar'].includes(nutrient))
    return `${roundedValue}g`;

  return roundedValue.toString();
};

const CalorieCard: React.FC<{ calories: number | string }> = ({ calories }) => {
  const formattedValue = formatValue(calories, 'calories');

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
      <span className="text-3xl font-bold text-gray-800">{formattedValue}</span>
      <span className="text-lg text-gray-600 mt-2">Total Calories</span>
    </div>
  );
};

const MacroCard: React.FC<{ nutrient: string; amount: number | string }> = ({
  nutrient,
  amount
}) => {
  const formattedValue = formatValue(amount, nutrient);
  const displayName = nutrient
    .split('_')
    .join(' ')
    .replace(/(mg|ug)$/, '');

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
      <span className="text-2xl font-semibold text-gray-800">
        {formattedValue}
      </span>
      <span className="text-sm text-gray-600 capitalize mt-2">
        {displayName}
      </span>
    </div>
  );
};

const NutrientRow: React.FC<{ nutrient: string; amount: number | string }> = ({
  nutrient,
  amount
}) => {
  const formattedValue = formatValue(amount, nutrient);
  const displayName = nutrient
    .split('_')
    .join(' ')
    .replace(/(mg|ug)$/, '');

  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-700 capitalize">{displayName}</span>
      <span className="text-gray-900 font-medium">{formattedValue}</span>
    </div>
  );
};

const NutrientSheet: React.FC<NutrientSheetProps> = ({ data }) => {
  if (!data || !data.totals) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 p-4 rounded-lg bg-red-50 text-red-700">
        Nutrient sheet data is missing or malformed.
      </div>
    );
  }

  const { macronutrients, micronutrients } = data.totals;
  const mainMacros = ['protein', 'fats', 'carbohydrates'];
  const otherMacros = ['fiber', 'sugar'];

  // Group micronutrients by type
  const vitaminKeys = Object.keys(micronutrients).filter((k) =>
    k.startsWith('vitamin')
  );

  // Specific mineral groupings
  const mineralKeys = [
    'calcium_mg',
    'iron_mg',
    'magnesium_mg',
    'phosphorus_mg',
    'potassium_mg',
    'sodium_mg',
    'zinc_mg',
    'copper_mg',
    'manganese_mg',
    'selenium_ug'
  ];

  // Other micronutrients (not vitamins or minerals)
  const otherMicroKeys = Object.keys(micronutrients).filter(
    (k) => !k.startsWith('vitamin') && !mineralKeys.includes(k)
  );

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Nutrition Analysis
      </h2>

      {/* Calories Card */}
      <div className="mb-8">
        <CalorieCard calories={macronutrients.calories} />
      </div>

      {/* Main Macronutrients Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Main Macronutrients
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {mainMacros.map((macro) => (
            <MacroCard
              key={macro}
              nutrient={macro}
              amount={macronutrients[macro]}
            />
          ))}
        </div>
      </div>

      {/* Dietary Fiber & Sugar Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Dietary Fiber & Sugar
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {otherMacros.map((macro) => (
            <MacroCard
              key={macro}
              nutrient={macro}
              amount={macronutrients[macro]}
            />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Vitamins */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vitamins</h3>
          {vitaminKeys.map((nutrient) => (
            <NutrientRow
              key={nutrient}
              nutrient={nutrient}
              amount={micronutrients[nutrient]}
            />
          ))}
        </div>

        {/* Minerals */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Essential Minerals
          </h3>
          <div className="space-y-2">
            {mineralKeys.map((nutrient) => (
              <NutrientRow
                key={nutrient}
                nutrient={nutrient}
                amount={micronutrients[nutrient]}
              />
            ))}
          </div>
        </div>

        {/* Other Micronutrients */}
        {otherMicroKeys.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Other Nutrients
            </h3>
            <div className="grid md:grid-cols-2 gap-x-8">
              {otherMicroKeys.map((nutrient) => (
                <NutrientRow
                  key={nutrient}
                  nutrient={nutrient}
                  amount={micronutrients[nutrient]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutrientSheet;
