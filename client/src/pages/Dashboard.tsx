import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 text-white">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </header>

      {/* Stats Overview Component Placeholder */}
      <section className="p-6 bg-gray-800 rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold">Stats Overview</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Total Games</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Hours Played</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Active Streak</p>
            <p className="text-2xl font-bold text-green-400">0 Days</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Mood/Energy Game Picker Placeholder */}
        <section className="p-6 bg-gray-800 rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Mood / Energy Game Picker</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400">Select Mood</label>
              <select className="w-full p-2 mt-1 text-white bg-gray-700 rounded">
                <option>Relaxed</option>
                <option>Action-Oriented</option>
                <option>Thoughtful</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400">Energy Level</label>
              <select className="w-full p-2 mt-1 text-white bg-gray-700 rounded">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <button className="w-full px-4 py-2 font-bold text-white bg-purple-600 rounded hover:bg-purple-700">
              Suggest Game
            </button>
          </div>
        </section>

        {/* Recent Sessions Placeholder */}
        <section className="p-6 bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Sessions</h2>
            <button className="px-3 py-1 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
              + Log Session
            </button>
          </div>
          <div className="text-sm text-gray-400">
            No recent sessions logged.
          </div>
        </section>
      </div>
    </div>
  );
};