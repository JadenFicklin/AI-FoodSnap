import React, { useState, useRef } from 'react';
import { getNutrientSheet } from '../features/nutrientSheet/openaiNutrientService';
import NutrientSheet from '../features/nutrientSheet/NutrientSheet';

function parseFoods(raw: string | object) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && raw !== null) return [raw];
  if (typeof raw !== 'string') return [];
  // Remove markdown code block if present
  const cleaned = raw.replace(/^```json|```$/gim, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [foods, setFoods] = useState<any[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [nutrientSheet, setNutrientSheet] = useState<any>(null);
  const [nutrientSheetRaw, setNutrientSheetRaw] = useState<any>(null);
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
    setFoods([]);
    if (!file) {
      setError('Please select an image.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    const rawBackendUrl =
      import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
    const BACKEND_URL = rawBackendUrl.replace(/\/$/, '');
    try {
      const response = await fetch(`${BACKEND_URL}/api/upload-image`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
      // Foods array from backend
      let foodsData = [];
      if (Array.isArray(data.foods)) {
        foodsData = data.foods;
      } else if (data.foods && data.foods.raw) {
        foodsData = parseFoods(data.foods.raw);
      }
      setFoods(foodsData);
    } catch (err) {
      setError('An error occurred while uploading.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSheet = async () => {
    setSheetError(null);
    setSheetLoading(true);
    setNutrientSheet(null);
    setNutrientSheetRaw(null);
    try {
      const result = await getNutrientSheet(foods);
      console.log('Nutrient sheet response:', result);
      setNutrientSheet(result);
      setNutrientSheetRaw(result);
    } catch (err) {
      setSheetError('Failed to generate nutrient sheet.');
    } finally {
      setSheetLoading(false);
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
      {foods && foods.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="font-semibold text-lg mb-4">Detected Foods</h2>
          <div className="grid grid-cols-1 gap-4">
            {foods.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border rounded shadow p-4 flex flex-col items-center">
                <span className="text-xl font-bold mb-2 capitalize">
                  {item.food}
                </span>
                <span className="text-gray-700 text-lg">
                  {item.grams} grams
                </span>
              </div>
            ))}
          </div>
          <button
            className="mt-6 bg-green-600 text-white px-4 py-2 rounded w-full font-semibold"
            onClick={handleGenerateSheet}
            disabled={sheetLoading}>
            {sheetLoading
              ? 'Generating Nutrient Sheet...'
              : 'Generate Nutrient Sheet'}
          </button>
          {sheetError && <div className="text-red-500 mt-2">{sheetError}</div>}
        </div>
      )}
      {nutrientSheet && <NutrientSheet data={nutrientSheet} />}
      {nutrientSheetRaw && (
        <div className="mt-4 p-4 border rounded bg-yellow-50 w-full max-w-2xl mx-auto">
          <h2 className="font-semibold mb-2 text-yellow-800">
            Nutrient Sheet Raw Response:
          </h2>
          <pre className="text-xs whitespace-pre-wrap text-yellow-900">
            {JSON.stringify(nutrientSheetRaw, null, 2)}
          </pre>
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
