import React, { useState, useRef } from 'react';

function parseNutrition(raw: string | object) {
  if (typeof raw === 'object' && raw !== null) return raw;
  if (typeof raw !== 'string') return null;
  // Remove markdown code block if present
  const cleaned = raw.replace(/^```json|```$/gim, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function normalizeNutrition(nutrition: any) {
  if (!nutrition) return nutrition;
  return {
    food: nutrition.food || nutrition.foodName || 'N/A',
    estimated_calories:
      nutrition.estimated_calories || nutrition.estimatedCalories || 'N/A',
    macronutrients: nutrition.macronutrients || {},
    micronutrients: nutrition.micronutrients || {}
  };
}

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [nutrition, setNutrition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setPreview(URL.createObjectURL(e.dataTransfer.files[0]));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setNutrition(null);
    if (!file) {
      setError('Please select an image.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch('http://localhost:3001/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
      // Try to parse nutrition info
      let nutritionData = null;
      if (data.analysis) {
        nutritionData = data.analysis;
        if (nutritionData.raw) {
          nutritionData = parseNutrition(nutritionData.raw);
        }
      }
      setNutrition(normalizeNutrition(nutritionData));
    } catch (err) {
      setError('An error occurred while uploading.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Upload Food Image</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 w-full max-w-md">
        <div
          className={`w-full h-48 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
            file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 bg-white hover:bg-gray-100'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleClick}>
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-40 object-contain"
            />
          ) : (
            <span className="text-gray-400">
              Drag & drop an image here, or click to select
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {error && <div className="text-red-500 mt-4">{String(error)}</div>}
      {nutrition && (
        <div className="mt-6 w-full max-w-md">
          <div className="p-4 rounded shadow bg-white border mb-4">
            <h2 className="font-semibold text-lg mb-2">Nutrition Summary</h2>
            <div className="mb-2">
              <span className="font-bold">Food:</span> {nutrition.food || 'N/A'}
            </div>
            <div className="mb-2">
              <span className="font-bold">Estimated Calories:</span>{' '}
              {nutrition.estimated_calories || 'N/A'}
            </div>
            <div className="mb-2">
              <span className="font-bold">Macronutrients:</span>
              <ul className="list-disc list-inside ml-4">
                {nutrition.macronutrients &&
                  Object.entries(nutrition.macronutrients).map(([k, v]) => (
                    <li key={k}>
                      <span className="capitalize">{k}:</span> {String(v)}
                    </li>
                  ))}
              </ul>
            </div>
            {nutrition.micronutrients && (
              <div className="mb-2">
                <span className="font-bold">Micronutrients:</span>
                <ul className="list-disc list-inside ml-4">
                  {Object.entries(nutrition.micronutrients).map(([k, v]) => (
                    <li key={k}>
                      <span className="capitalize">{k}:</span> {String(v)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Food</th>
                  <th className="px-4 py-2 border">Calories</th>
                  <th className="px-4 py-2 border">Protein</th>
                  <th className="px-4 py-2 border">Carbs</th>
                  <th className="px-4 py-2 border">Fat</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border">
                    {nutrition.food || 'N/A'}
                  </td>
                  <td className="px-4 py-2 border">
                    {nutrition.estimated_calories || 'N/A'}
                  </td>
                  <td className="px-4 py-2 border">
                    {nutrition.macronutrients?.protein || 'N/A'}
                  </td>
                  <td className="px-4 py-2 border">
                    {nutrition.macronutrients?.carbohydrates || 'N/A'}
                  </td>
                  <td className="px-4 py-2 border">
                    {nutrition.macronutrients?.fat || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {result && (
        <div className="mt-4 p-4 border rounded bg-gray-100 w-full max-w-md">
          <h2 className="font-semibold mb-2">Full Server Response:</h2>
          <pre className="text-xs whitespace-pre-wrap">
            {String(
              typeof result === 'string'
                ? result
                : JSON.stringify(result, null, 2)
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Upload;
