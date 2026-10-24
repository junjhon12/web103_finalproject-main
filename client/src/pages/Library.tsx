import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserLibrary, removeGameFromLibrary, updateLibraryGame, type UserGame } from '../api/library';
import { Link } from 'react-router-dom';
import { AddGameModal } from '../components/AddGameModal';
import { useToast } from '../context/ToastContext';

type FilterStatus = 'all' | 'backlog' | 'playing' | 'completed';

export const Library: React.FC = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<UserGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const { showToast } = useToast();
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadLibrary();
    }
  }, [user]);

  const loadLibrary = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUserLibrary(user!.id);
      setGames(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load library');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userGameId: number, newStatus: string) => {
    try {
      await updateLibraryGame(userGameId, { status: newStatus });
      setGames((prev) => 
        prev.map((g) => g.user_game_id === userGameId ? { ...g, status: newStatus as UserGame['status'] } : g)
      );
      showToast('Game status updated', 'success'); // Replaced alert
    } catch (err) {
      showToast('Failed to update status', 'error'); // Replaced alert
    }
  };

  const handleDelete = async (userGameId: number) => {
    if (!window.confirm('Are you sure you want to remove this game from your library?')) return;
    try {
      await removeGameFromLibrary(userGameId);
      setGames((prev) => prev.filter((g) => g.user_game_id !== userGameId));
      showToast('Game removed from library', 'success'); // Replaced alert
    } catch (err) {
      showToast('Failed to remove game', 'error'); // Replaced alert
    }
  };

  const filteredGames = games.filter((game) => filter === 'all' || game.status === filter);

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    loadLibrary();
  };

  if (isLoading) return <div className="text-white">Loading library...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Library</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          + Add Game
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'backlog', 'playing', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as FilterStatus)}
            className={`px-4 py-2 text-sm font-medium rounded capitalize ${
              filter === status ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredGames.length === 0 ? (
        <div className="p-8 text-center text-gray-400 bg-gray-800 rounded">
          No games found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGames.map((game) => (
            <div key={game.user_game_id} className="flex flex-col p-4 bg-gray-800 rounded-lg shadow">
              <div className="flex-1">
                  <Link 
                    to={`/library/${game.user_game_id}`} 
                    state={{ game }}
                    className="hover:underline"
                  >
                    <h3 className="text-lg font-bold truncate text-blue-400 hover:text-blue-300">
                      {game.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-400">{game.platform || 'Unknown Platform'}</p>
                <div className="mt-2">
                  <select
                    value={game.status}
                    onChange={(e) => handleStatusChange(game.user_game_id, e.target.value)}
                    className="w-full p-1 text-sm text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="playing">Playing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-yellow-400">{game.rating ? `${game.rating}/5 Stars` : 'Unrated'}</span>
                <button
                  onClick={() => handleDelete(game.user_game_id)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Render Modal */}
      <AddGameModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleModalSuccess} 
      />
    </div>
  );
};