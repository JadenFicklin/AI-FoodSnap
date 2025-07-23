import React from 'react';

interface LoadingAnimationProps {
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = 'Analyzing your food...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border">
      <div className="relative">
        {/* Main spinning circle */}
        <div className="w-16 h-16 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>

        {/* Pulsing dots */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"
              style={{ animationDelay: '0ms' }}></div>
            <div
              className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"
              style={{ animationDelay: '150ms' }}></div>
            <div
              className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"
              style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Generating Nutrient Analysis
        </h3>
        <p className="text-gray-600 text-sm">{message}</p>
        <div className="mt-4 flex justify-center space-x-1">
          <div
            className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}></div>
          <div
            className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: '100ms' }}></div>
          <div
            className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: '200ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
