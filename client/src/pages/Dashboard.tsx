import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserLibrary, type UserGame } from '../api/library';
import { fetchUserGoal, type Goal } from '../api/goals';
import { fetchUserStats, type DashboardStats } from '../api/stats';
import { Link } from 'react-router-dom';
import { Spinner } from '../components/Spinner';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<UserGame[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mood Picker State
  const [mood, setMood] = useState('Relaxed');
  const [energy, setEnergy] = useState('Low');
  const [suggestion, setSuggestion] = useState<UserGame | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        // Fetch all dependencies concurrently to minimize waterfall loading
        const [libraryData, goalData, statsData] = await Promise.all([
          fetchUserLibrary(user.id),
          fetchUserGoal(user.id),
          fetchUserStats(user.id)
        ]);
        setLibrary(libraryData);
        setGoal(goalData);
        setStats(statsData);
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

    const genreMap: Record<string, string[]> = {
      'Relaxed': ['puzzle', 'simulation', 'strategy', 'casual'],
      'Action-Oriented': ['action', 'shooter', 'fighting', 'platformer'],
      'Thoughtful': ['rpg', 'adventure', 'story', 'mystery'],
      'High': ['action', 'multiplayer', 'competitive'],
      'Low': ['turn-based', 'narrative', 'casual']
    };

    const targetKeywords = [...(genreMap[mood] || []), ...(genreMap[energy] || [])];
    
    const matchedGames = playableGames.filter(g => {
      if (!g.genre) return false;
      const gameGenre = g.genre.toLowerCase();
      return targetKeywords.some(keyword => gameGenre.includes(keyword));
    });

    const pool = matchedGames.length > 0 ? matchedGames : playableGames;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setSuggestion(pool[randomIndex]);
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6 text-white">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </header>

      {/* Stats Overview Component */}
      <section className="p-6 bg-gray-800 rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold">Stats Overview</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Total Games</p>
            <p className="text-2xl font-bold">{stats?.totalGames || 0}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Completed Games</p>
            <p className="text-2xl font-bold text-blue-400">{stats?.completedGames || 0}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Hours Played</p>
            <p className="text-2xl font-bold text-yellow-400">{stats?.totalHoursPlayed || 0}h</p>
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
                className="w-full p-2 mt-1 text-white bg-gray-700 rounded focus:outline-none focus:border-purple-500 border border-transparent"
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
                className="w-full p-2 mt-1 text-white bg-gray-700 rounded focus:outline-none focus:border-purple-500 border border-transparent"
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
              <div className="p-4 mt-4 bg-purple-900 border border-purple-500 rounded-lg animate-fade-in-up">
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