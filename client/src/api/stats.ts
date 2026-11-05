import { fetchApi } from './fetcher';

export interface RecentSession {
  id: number;
  user_game_id: number;
  title: string;
  duration: number; 
  session_date: string; 
  notes: string | null;
}

export interface DashboardStats {
  totalGames: number;
  completedGames: number;
  playingGames: number;
  backlogGames: number;
  totalHoursPlayed: number;
  hoursThisWeek: number;
  recentSessions: RecentSession[];
}

export const fetchUserStats = async (userId: number): Promise<DashboardStats> => {
  return fetchApi<DashboardStats>(`/api/stats/user/${userId}`, {
    method: 'GET',
  });
};
