import React from 'react';
import type { NutrientSheetResult } from './types.js';

interface NutrientSheetProps {
  data: NutrientSheetResult;
}

const renderTable = (
  nutrients: { [nutrient: string]: number | string },
  title: string
) => (
  <div className="mb-4">
    <h3 className="font-semibold mb-2">{title}</h3>
    <table className="min-w-full bg-white border rounded shadow text-sm">
      <thead>
        <tr>
          <th className="px-2 py-1 border">Nutrient</th>
          <th className="px-2 py-1 border">Amount</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(nutrients).map(([nutrient, amount]) => (
          <tr key={nutrient}>
            <td className="px-2 py-1 border capitalize">{nutrient}</td>
            <td className="px-2 py-1 border">{amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const NutrientSheet: React.FC<NutrientSheetProps> = ({ data }) => {
  if (!data || !data.totals) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-4 border rounded bg-red-50 text-red-700">
        Nutrient sheet data is missing or malformed.
      </div>
    );
  }
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">
        Macronutrient & Micronutrient Sheet (Totals Only)
      </h2>
      <div className="mt-8 p-4 border rounded bg-green-50">
        <h3 className="font-bold mb-2">Total Macronutrients</h3>
        {renderTable(data.totals.macronutrients, 'Total Macronutrients')}
        <h3 className="font-bold mb-2 mt-6">Total Micronutrients</h3>
        {renderTable(data.totals.micronutrients, 'Total Micronutrients')}
      </div>
    </div>
  );
};

export default NutrientSheet;
