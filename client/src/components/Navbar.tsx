import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resetDatabase } from '../api/reset';
import { useToast } from '../context/ToastContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // The server refuses resets in production, so only offer the button in development.
  const canReset = import.meta.env.DEV;

  const handleReset = async () => {
    if (!window.confirm('Reset the database to its default state? This deletes ALL users and data.')) return;
    try {
      await resetDatabase();
      logout(); // every account was wiped, so the old session is no longer valid
      navigate('/login');
      showToast('Database reset. Please register or log in again.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reset database', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-white">
              GameLog
            </Link>
            <div className="hidden md:block">
              <div className="flex items-baseline ml-10 space-x-4">
                <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">Dashboard</Link>
                <Link to="/library" className="px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">Library</Link>
                <Link to="/reviews" className="px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">Reviews</Link>
                <Link to="/goals" className="px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">Goals</Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Welcome, {user?.username}</span>
            {canReset && (
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm font-medium text-yellow-300 border border-yellow-600 rounded-md hover:bg-gray-700"
              >
                Reset DB
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};