import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[50vh] space-y-4">
      <div className="w-12 h-12 border-4 border-gray-700 rounded-full border-t-purple-500 animate-spin"></div>
      <p className="text-sm font-medium text-gray-400 animate-pulse">Loading data...</p>
    </div>
  );
};