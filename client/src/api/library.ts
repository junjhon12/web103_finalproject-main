import { fetchApi } from './fetcher';

export interface UserGame {
  user_game_id: number;
  user_id: number;
  status: 'backlog' | 'playing' | 'completed';
  rating: number | null;
  review: string | null;
  id: number; // Global game ID
  title: string;
  platform: string | null;
  genre: string | null;
  cover_image_url: string | null;
}

export interface UpdateLibraryPayload {
  status?: string;
  rating?: number | null;
  review?: string | null;
}

export const fetchUserLibrary = async (userId: number): Promise<UserGame[]> => {
  return fetchApi<UserGame[]>(`/api/user-library/user/${userId}`, {
    method: 'GET',
  });
};

export const updateLibraryGame = async (userGameId: number, payload: UpdateLibraryPayload): Promise<UserGame> => {
  return fetchApi<UserGame>(`/api/user-library/${userGameId}`, {
    method: 'PATCH',
    body: payload,
  });
};

export const removeGameFromLibrary = async (userGameId: number): Promise<{ message: string; id: number }> => {
  return fetchApi<{ message: string; id: number }>(`/api/user-library/${userGameId}`, {
    method: 'DELETE',
  });
};

export interface AddGamePayload {
  user_id: number;
  game_id: number;
  status?: 'backlog' | 'playing' | 'completed';
}

export const addGameToLibrary = async (payload: AddGamePayload): Promise<void> => {
  await fetchApi('/api/user-library', {
    method: 'POST',
    body: payload,
  });
};