import { fetchApi } from './fetcher';

export interface RecentSession {
  id: number;
  user_game_id: number;
  title: string;
  duration: number; // in minutes
  session_date: string; // YYYY-MM-DD
  notes: string | null;
}

export interface DashboardStats {
  totalGames: number;
  completedGames: number;
  totalHoursPlayed: number;
  hoursThisWeek: number;
  recentSessions: RecentSession[];
}

export const fetchUserStats = async (userId: number): Promise<DashboardStats> => {
  return fetchApi<DashboardStats>(`/api/stats/user/${userId}`, {
    method: 'GET',
  });
};
