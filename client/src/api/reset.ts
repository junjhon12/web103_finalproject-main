import { fetchApi } from './fetcher';

export const resetDatabase = async (): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>('/api/reset', { method: 'POST' });
};
