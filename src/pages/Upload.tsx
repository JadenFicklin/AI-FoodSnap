import React, { useState, useRef, useEffect } from 'react';
import {
  getNutrientSheet,
  generateMealName
} from '../features/nutrientSheet/openaiNutrientService';
import NutrientSheet from '../features/nutrientSheet/NutrientSheet';
import LoadingAnimation from '../components/LoadingAnimation';
import { useAuth } from '../contexts/AuthContext';
import { getUserData, saveMealData } from '../services/firebase';

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
  const { user, logout, deleteAccount } = useAuth();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userData, setUserData] = useState<any>(null);
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
    setNutrientSheet(null);
    setNutrientSheetRaw(null);
    setSheetError(null);
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

      // Automatically generate nutrient sheet if foods are detected
      if (foodsData.length > 0) {
        await generateNutrientSheet(foodsData);
      }
    } catch (err) {
      setError('An error occurred while uploading.');
    } finally {
      setLoading(false);
    }
  };

  const generateNutrientSheet = async (foodsData: any[]) => {
    setSheetError(null);
    setSheetLoading(true);
    setNutrientSheet(null);
    setNutrientSheetRaw(null);
    try {
      // Generate nutrient sheet first
      const nutrientResult = await getNutrientSheet(foodsData);
      console.log('Nutrient sheet response:', nutrientResult);

      setNutrientSheet(nutrientResult);
      setNutrientSheetRaw(nutrientResult);

      // Try to generate meal name, but don't fail if it doesn't work
      let mealName = 'Custom Meal';
      try {
        mealName = await generateMealName(foodsData);
        console.log('Meal name:', mealName);
      } catch (mealNameError) {
        console.warn(
          'Failed to generate meal name, using default:',
          mealNameError
        );
      }

      // Save meal data to Firebase
      if (user?.uid) {
        const mealData = {
          mealName: mealName,
          foods: foodsData,
          nutrients: nutrientResult,
          uploadTime: new Date().toISOString()
        };

        await saveMealData(user.uid, mealData);
        console.log('Meal data saved to Firebase');
      }
    } catch (err) {
      console.error('Error generating nutrient sheet:', err);
      setSheetError('Failed to generate nutrient sheet.');
    } finally {
      setSheetLoading(false);
    }
  };

  const handleGenerateSheet = async () => {
    await generateNutrientSheet(foods);
  };

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        const data = await getUserData(user.uid);
        setUserData(data);
      }
    };
    fetchUserData();
  }, [user]);

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      try {
        await deleteAccount();
        // User will be automatically redirected to login page
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info and logout */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">AI Food Snap</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {userData?.username || user?.email}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
              Logout
            </button>
            <button
              onClick={handleDeleteAccount}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-red-200">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Upload Food Image</h2>
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
          {!loading && (
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition-colors"
              disabled={loading}>
              Upload & Analyze
            </button>
          )}
        </form>

        {loading && (
          <div className="mt-6">
            <LoadingAnimation message="Analyzing your food image..." />
          </div>
        )}

        {error && <div className="text-red-500 mt-4">{String(error)}</div>}
        {foods && foods.length > 0 && !loading && (
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

            {sheetLoading && (
              <div className="mt-6">
                <LoadingAnimation message="Analyzing nutrients in your food..." />
              </div>
            )}

            {sheetError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">
                  <p className="font-medium">
                    Failed to generate nutrient analysis
                  </p>
                  <p className="mt-1">{sheetError}</p>
                  <button
                    onClick={handleGenerateSheet}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {nutrientSheet && <NutrientSheet data={nutrientSheet} />}
      </div>
    </div>
  );
};

export default Upload;
