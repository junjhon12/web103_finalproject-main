const BASE_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3101' : '');

interface FetchOptions extends RequestInit {
  body?: any;
}

const clearStoredSession = () => {
  localStorage.removeItem('gamelog_token');
  localStorage.removeItem('gamelog_user');
  // Let AuthContext clear its in-memory state so ProtectedRoute redirects.
  window.dispatchEvent(new Event('gamelog:unauthorized'));
};

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
    if ((response.status === 401 || response.status === 403) && token) {
      clearStoredSession();
    }

    const errorData = await response.json().catch(() => ({} as { error?: string }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  // DELETE-style endpoints may legitimately return no content.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};
