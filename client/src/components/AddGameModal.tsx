import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createGlobalGame } from '../api/games';
import { addGameToLibrary } from '../api/library';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState<'backlog' | 'playing' | 'completed'>('backlog');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create the game in the global database
      const newGame = await createGlobalGame({ title, platform, genre });
      
      // Step 2: Link the game to the current user's library
      await addGameToLibrary({
        user_id: user.id,
        game_id: newGame.id,
        status,
      });

      // Reset form and notify parent
      setTitle('');
      setPlatform('');
      setGenre('');
      setStatus('backlog');
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add game to library');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-2xl font-bold text-white">Add New Game</h2>
        {error && <div className="p-3 mb-4 text-sm text-red-200 bg-red-900 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Title</label>
            <input
              type="text" required
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300">Platform</label>
              <input
                type="text"
                value={platform} onChange={(e) => setPlatform(e.target.value)}
                placeholder="e.g. PC, PS5"
                className="w-full p-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300">Genre</label>
              <input
                type="text"
                value={genre} onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. RPG, Action"
                className="w-full p-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Initial Status</label>
            <select
              value={status} onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500"
            >
              <option value="backlog">Backlog</option>
              <option value="playing">Playing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" onClick={onClose} disabled={isLoading}
              className="px-4 py-2 text-sm font-bold text-gray-300 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={isLoading}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};