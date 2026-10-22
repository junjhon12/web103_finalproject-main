const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  body?: any;
}

export const fetchApi = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const token = localStorage.getItem('gamelog_token');
  
  // Initialize a native Headers object to satisfy strict TypeScript definitions
  const headers = new Headers(options.headers);
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};