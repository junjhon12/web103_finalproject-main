import { fetchApi } from './fetcher';

export interface DashboardStats {
  totalGames: number;
  completedGames: number;
  totalHoursPlayed: number;
}

export const fetchUserStats = async (userId: number): Promise<DashboardStats> => {
  return fetchApi<DashboardStats>(`/api/stats/user/${userId}`, {
    method: 'GET',
  });
};