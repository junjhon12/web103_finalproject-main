import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserLibrary, type UserGame } from '../api/library';
import { fetchUserGoal, type Goal } from '../api/goals';
import { fetchUserStats, type DashboardStats as DashboardStatsData } from '../api/stats';
import { Spinner } from '../components/Spinner';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { RecentSessions } from '../components/dashboard/RecentSessions';
import { GoalProgress } from '../components/dashboard/GoalProgress';
import { GamePicker } from '../components/dashboard/GamePicker';
import { QuickActions } from '../components/dashboard/QuickActions';
import { focusRingClass } from '../components/dashboard/styles';

export interface DashboardData {
  library: UserGame[];
  goal: Goal | null;
  stats: DashboardStatsData;
}

export type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DashboardData };

interface DashboardViewProps {
  username: string;
  state: DashboardState;
  onRetry: () => void;
  /** Injectable random source for the game picker (tests). */
  random?: () => number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ username, state, onRetry, random }) => {
  if (state.status === 'loading') return <Spinner />;

  return (
    <div className="space-y-6 text-white">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-gray-300 break-words">Welcome back, {username}!</p>
      </header>

      {state.status === 'error' ? (
        <div role="alert" className="p-4 border border-red-500 rounded-lg bg-red-900/60">
          <p className="font-semibold text-red-100">Couldn&apos;t load your dashboard.</p>
          <p className="mt-1 text-sm text-red-200 break-words">{state.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className={`px-4 py-2 mt-3 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 ${focusRingClass}`}
          >
            Try again
          </button>
        </div>
      ) : (
        <DashboardContent data={state.data} random={random} />
      )}
    </div>
  );
};

const DashboardContent: React.FC<{ data: DashboardData; random?: () => number }> = ({
  data,
  random,
}) => {
  const { library, goal, stats } = data;

  return (
    <>
      {stats.totalGames === 0 && (
        <section
          aria-labelledby="empty-library-heading"
          className="p-4 border border-blue-500 rounded-lg bg-blue-900/40"
        >
          <h2 id="empty-library-heading" className="font-semibold">
            Your library is empty
          </h2>
          <p className="mt-1 text-sm text-gray-300">
            Add games you own or want to play to start tracking sessions and stats.
          </p>
          <Link
            to="/library"
            className={`inline-block px-4 py-2 mt-3 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 ${focusRingClass}`}
          >
            Browse and add games
          </Link>
        </section>
      )}

      <DashboardStats stats={stats} currentStreak={goal?.current_streak ?? 0} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentSessions sessions={stats.recentSessions} />
        <GoalProgress goal={goal} hoursThisWeek={stats.hoursThisWeek} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GamePicker library={library} random={random} />
        <QuickActions />
      </div>
    </>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadDashboardData = async () => {
      try {
        // Fetch all dependencies concurrently to avoid a request waterfall.
        const [library, goal, stats] = await Promise.all([
          fetchUserLibrary(user.id),
          fetchUserGoal(user.id),
          fetchUserStats(user.id),
        ]);
        if (!cancelled) setState({ status: 'ready', data: { library, goal, stats } });
      } catch (error: unknown) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : 'Something went wrong loading your data.';
        setState({ status: 'error', message });
      }
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const handleRetry = useCallback(() => {
    setState({ status: 'loading' });
    setReloadKey((key) => key + 1);
  }, []);

  return <DashboardView username={user?.username ?? ''} state={state} onRetry={handleRetry} />;
};
