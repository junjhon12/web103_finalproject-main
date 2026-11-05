import { ApiError, fetchApi } from './fetcher';

export interface Goal {
  id: number;
  user_id: number;
  target_hours: number;
  current_streak: number;
  longest_streak?: number; // derived from play sessions
  weekly_hours?: number; // hours played this calendar week
}

export interface CreateGoalPayload {
  user_id: number;
  target_hours: number;
}

export interface UpdateGoalPayload {
  target_hours?: number;
  current_streak?: number;
}

export const fetchUserGoal = async (userId: number): Promise<Goal | null> => {
  try {
    return await fetchApi<Goal>(`/api/goals/user/${userId}`, { method: 'GET' });
  } catch (error: unknown) {
    // The server answers 404 when the user has not created a goal yet.
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
};

export const createGoal = async (payload: CreateGoalPayload): Promise<Goal> => {
  return fetchApi<Goal>('/api/goals', {
    method: 'POST',
    body: payload,
  });
};

export const updateGoal = async (goalId: number, payload: UpdateGoalPayload): Promise<Goal> => {
  return fetchApi<Goal>(`/api/goals/${goalId}`, {
    method: 'PATCH',
    body: payload,
  });
};