import { fetchApi } from './fetcher';

export interface ProgressEntry {
  id: number;
  user_game_id: number;
  title: string;
  entry_type: 'milestone' | 'achievement';
  is_completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface CreateProgressPayload {
  user_game_id: number;
  title: string;
  entry_type?: 'milestone' | 'achievement';
  is_completed?: boolean;
  notes?: string | null;
}

export interface UpdateProgressPayload {
  title?: string;
  entry_type?: 'milestone' | 'achievement';
  is_completed?: boolean;
  notes?: string | null;
}

export const fetchProgressEntries = async (userGameId: number): Promise<ProgressEntry[]> => {
  return fetchApi<ProgressEntry[]>(`/api/progress/game/${userGameId}`, { method: 'GET' });
};

export const createProgressEntry = async (payload: CreateProgressPayload): Promise<ProgressEntry> => {
  return fetchApi<ProgressEntry>('/api/progress', { method: 'POST', body: payload });
};

export const updateProgressEntry = async (
  id: number,
  payload: UpdateProgressPayload
): Promise<ProgressEntry> => {
  return fetchApi<ProgressEntry>(`/api/progress/${id}`, { method: 'PATCH', body: payload });
};

export const deleteProgressEntry = async (id: number): Promise<{ message: string; id: number }> => {
  return fetchApi<{ message: string; id: number }>(`/api/progress/${id}`, { method: 'DELETE' });
};
