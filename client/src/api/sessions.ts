import { fetchApi } from './fetcher';

export interface PlaySession {
  id: number;
  user_game_id: number;
  duration: number; // in minutes
  session_date: string; // ISO date string
  notes: string | null;
}

export interface CreateSessionPayload {
  user_game_id: number;
  duration: number;
  session_date?: string;
  notes?: string;
}

export const fetchGameSessions = async (userGameId: number): Promise<PlaySession[]> => {
  return fetchApi<PlaySession[]>(`/api/play-sessions/game/${userGameId}`, {
    method: 'GET',
  });
};

export const logSession = async (payload: CreateSessionPayload): Promise<PlaySession> => {
  return fetchApi<PlaySession>('/api/play-sessions', {
    method: 'POST',
    body: payload,
  });
};

export const deleteSession = async (sessionId: number): Promise<{ message: string; id: number }> => {
  return fetchApi<{ message: string; id: number }>(`/api/play-sessions/${sessionId}`, {
    method: 'DELETE',
  });
};