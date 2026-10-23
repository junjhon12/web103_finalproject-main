import { fetchApi } from './fetcher';

export interface Game {
  id: number;
  title: string;
  platform: string | null;
  genre: string | null;
  cover_image_url: string | null;
}

export interface CreateGamePayload {
  title: string;
  platform?: string;
  genre?: string;
  cover_image_url?: string;
}

export const createGlobalGame = async (payload: CreateGamePayload): Promise<Game> => {
  return fetchApi<Game>('/api/games', {
    method: 'POST',
    body: payload,
  });
};