import { fetchApi } from './fetcher';

export interface Goal {
  id: number;
  user_id: number;
  target_hours: number;
  current_streak: number;
}

export const fetchUserGoal = async (userId: number): Promise<Goal | null> => {
  try {
    return await fetchApi<Goal>(`/api/goals/user/${userId}`, { method: 'GET' });
  } catch (error: unknown) {
    // If no goal exists (404), return null instead of crashing the UI
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};