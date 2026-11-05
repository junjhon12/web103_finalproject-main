import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserLibrary, type UserGame } from '../api/library';
import { fetchUserGoal, type Goal } from '../api/goals';
import { fetchUserStats, type DashboardStats } from '../api/stats';
import { Link } from 'react-router-dom';
import { Spinner } from '../components/Spinner';
import { useToast } from '../context/ToastContext';

type TimeAvailable = 'Short' | 'Medium' | 'Long';

const MOOD_KEYWORDS: Record<string, string[]> = {
  'Relaxed': ['puzzle', 'simulation', 'strategy', 'casual'],
  'Action-Oriented': ['action', 'shooter', 'fighting', 'platformer', 'roguelike'],
  'Thoughtful': ['rpg', 'adventure', 'story', 'mystery'],
};

const ENERGY_KEYWORDS: Record<string, string[]> = {
  'High': ['action', 'multiplayer', 'competitive', 'shooter', 'roguelike'],
  'Medium': ['adventure', 'platformer', 'strategy', 'simulation'],
  'Low': ['turn-based', 'narrative', 'casual', 'puzzle', 'simulation'],
};

// Short sessions suit quick-run games; long ones suit sprawling genres.
const TIME_KEYWORDS: Record<TimeAvailable, string[]> = {
  Short: ['roguelike', 'puzzle', 'casual', 'arcade', 'fighting', 'platformer'],
  Medium: ['action', 'adventure', 'simulation', 'strategy', 'shooter'],
  Long: ['rpg', 'open world', 'adventure', 'strategy'],
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [library, setLibrary] = useState<UserGame[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mood Picker State
  const [mood, setMood] = useState('Relaxed');
  const [energy, setEnergy] = useState('Low');
  const [timeAvailable, setTimeAvailable] = useState<TimeAvailable>('Medium');
  const [suggestion, setSuggestion] = useState<UserGame | null>(null);
  const [matchCount, setMatchCount] = useState(0);

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
      showToast("You don't have any uncompleted games in your library!", 'info');
      return;
    }

    const keywordGroups = [MOOD_KEYWORDS[mood], ENERGY_KEYWORDS[energy], TIME_KEYWORDS[timeAvailable]];

    // Score each game by how many of the three answers its genre matches.
    // Games already being played get a small nudge so the pick feels timely.
    const scored = playableGames.map(game => {
      const genre = (game.genre || '').toLowerCase();
      const matches = keywordGroups.filter(group => group.some(k => genre.includes(k))).length;
      return { game, matches, score: matches + (game.status === 'playing' ? 0.5 : 0) };
    });

    const best = Math.max(...scored.map(s => s.score));
    const pool = scored.filter(s => s.score === best);
    const picked = pool[Math.floor(Math.random() * pool.length)];

    setSuggestion(picked.game);
    setMatchCount(picked.matches);
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Total Games</p>
            <p className="text-2xl font-bold">{stats?.totalGames || 0}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Completed Games</p>
            <p className="text-2xl font-bold text-blue-400">{stats?.completedGames || 0}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">Playing Now</p>
            <p className="text-2xl font-bold text-purple-400">{stats?.playingGames || 0}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">In Backlog</p>
            <p className="text-2xl font-bold text-gray-200">{stats?.backlogGames || 0}</p>
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

      {/* Recent Sessions */}
      <section className="p-6 bg-gray-800 rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Sessions</h2>
        {!stats || stats.recentSessions.length === 0 ? (
          <p className="text-gray-400">No sessions logged yet. Open a game in your library to log one.</p>
        ) : (
          <ul className="divide-y divide-gray-700">
            {stats.recentSessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <Link to={`/library/${s.user_game_id}`} className="font-semibold text-blue-400 hover:underline">
                    {s.title}
                  </Link>
                  {s.notes && <p className="text-sm text-gray-400 truncate">{s.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-yellow-400">{s.duration} min</p>
                  <p className="text-xs text-gray-400">
                    {new Date(`${s.session_date.slice(0, 10)}T00:00:00`).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
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
            <div>
              <label className="block text-sm text-gray-400">Time Available</label>
              <select
                value={timeAvailable} onChange={(e) => setTimeAvailable(e.target.value as TimeAvailable)}
                className="w-full p-2 mt-1 text-white bg-gray-700 rounded focus:outline-none focus:border-purple-500 border border-transparent"
              >
                <option value="Short">Short (under 1 hour)</option>
                <option value="Medium">Medium (1-3 hours)</option>
                <option value="Long">Long (3+ hours)</option>
              </select>
            </div>
            <button 
              onClick={handleSuggestGame}
              className="w-full px-4 py-2 font-bold text-white bg-purple-600 rounded hover:bg-purple-700"
            >
              {suggestion ? 'Pick Again' : 'Suggest Game'}
            </button>
            
            {suggestion && (
              <div className="p-4 mt-4 bg-purple-900 border border-purple-500 rounded-lg animate-fade-in-up">
                <p className="text-sm text-purple-300">We recommend:</p>
                <Link to={`/library/${suggestion.user_game_id}`} state={{ game: suggestion }}>
                  <h3 className="text-xl font-bold text-white hover:underline">{suggestion.title}</h3>
                </Link>
                <p className="text-sm text-gray-300">Genre: {suggestion.genre || 'Unknown'}</p>
                <p className="mt-1 text-xs text-purple-300">
                  {matchCount > 0
                    ? `Matches ${matchCount} of your 3 answers.`
                    : 'No genre matched your answers, so this is a random pick from your backlog.'}
                </p>
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