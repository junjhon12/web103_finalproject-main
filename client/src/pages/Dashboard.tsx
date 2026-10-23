import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserLibrary, type UserGame } from '../api/library';
import { fetchUserGoal, type Goal } from '../api/goals';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<UserGame[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mood Picker State
  const [mood, setMood] = useState('Relaxed');
  const [energy, setEnergy] = useState('Low');
  const [suggestion, setSuggestion] = useState<UserGame | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        const [libraryData, goalData] = await Promise.all([
          fetchUserLibrary(user.id),
          fetchUserGoal(user.id)
        ]);
        setLibrary(libraryData);
        setGoal(goalData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const handleSuggestGame = () => {
    const playableGames = library.filter(g => g.status !== 'completed');
    
    if (playableGames.length === 0) {
      alert("You don't have any uncompleted games in your library!");
      return;
    }

    // Simplified recommendation algorithm mapping inputs to genre keywords
    const genreMap: Record<string, string[]> = {
      'Relaxed': ['puzzle', 'simulation', 'strategy', 'casual'],
      'Action-Oriented': ['action', 'shooter', 'fighting', 'platformer'],
      'Thoughtful': ['rpg', 'adventure', 'story', 'mystery'],
      'High': ['action', 'multiplayer', 'competitive'],
      'Low': ['turn-based', 'narrative', 'casual']
    };

    const targetKeywords = [...(genreMap[mood] || []), ...(genreMap[energy] || [])];
    
    // Attempt to find a game matching the genre tags
    const matchedGames = playableGames.filter(g => {
      if (!g.genre) return false;
      const gameGenre = g.genre.toLowerCase();
      return targetKeywords.some(keyword => gameGenre.includes(keyword));
    });

    // Fallback to a random playable game if no strict genre match exists
    const pool = matchedGames.length > 0 ? matchedGames : playableGames;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setSuggestion(pool[randomIndex]);
  };

  if (isLoading) return <div className="text-white">Loading dashboard...</div>;

  const totalGames = library.length;
  // Note: For a production app, totalHours would be aggregated from the backend play_sessions table.
  // For this milestone, we leave it as a placeholder until the backend stats endpoint is built.

  return (
    <div className="space-y-6 text-white">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </header>

      {/* Stats Overview Component */}
      <section className="p-6 bg-gray-800 rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold">Stats Overview</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Total Games</p>
            <p className="text-2xl font-bold">{totalGames}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Hours Played</p>
            <p className="text-2xl font-bold text-gray-500">--</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Active Streak</p>
            <p className="text-2xl font-bold text-green-400">{goal?.current_streak || 0} Days</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Mood/Energy Game Picker Custom Feature */}
        <section className="p-6 bg-gray-800 rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Mood / Energy Game Picker</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400">Select Mood</label>
              <select 
                value={mood} onChange={(e) => setMood(e.target.value)}
                className="w-full p-2 mt-1 text-white bg-gray-700 rounded"
              >
                <option>Relaxed</option>
                <option>Action-Oriented</option>
                <option>Thoughtful</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400">Energy Level</label>
              <select 
                value={energy} onChange={(e) => setEnergy(e.target.value)}
                className="w-full p-2 mt-1 text-white bg-gray-700 rounded"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <button 
              onClick={handleSuggestGame}
              className="w-full px-4 py-2 font-bold text-white bg-purple-600 rounded hover:bg-purple-700"
            >
              Suggest Game
            </button>
            
            {suggestion && (
              <div className="p-4 mt-4 bg-purple-900 border border-purple-500 rounded-lg">
                <p className="text-sm text-purple-300">We recommend:</p>
                <Link to={`/library/${suggestion.user_game_id}`} state={{ game: suggestion }}>
                  <h3 className="text-xl font-bold text-white hover:underline">{suggestion.title}</h3>
                </Link>
                <p className="text-sm text-gray-300">Genre: {suggestion.genre}</p>
              </div>
            )}
          </div>
        </section>

        {/* Action Prompt */}
        <section className="p-6 bg-gray-800 rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="space-y-4">
             <Link to="/library" className="block w-full px-4 py-3 font-bold text-center text-white bg-blue-600 rounded hover:bg-blue-700">
               Manage Library
             </Link>
             <p className="text-sm text-gray-400">
               Navigate to your library to log new play sessions, update your completion statuses, and write reviews.
             </p>
          </div>
        </section>
      </div>
    </div>
  );
};