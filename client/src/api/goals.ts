import { fetchApi } from './fetcher';

export interface Goal {
  id: number;
  user_id: number;
  target_hours: number;
  current_streak: number;
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
    if (error instanceof Error && error.message.includes('404')) {
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