import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTokenExpired = (token: string): boolean => {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return true;

    // JWT payloads use base64url, which atob does not accept directly.
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const isValidUser = (value: unknown): value is User => {
  const user = value as User | null;
  return !!user && typeof user.id === 'number' && typeof user.username === 'string';
};

const readStoredSession = (): { token: string | null; user: User | null } => {
  const token = localStorage.getItem('gamelog_token');
  const storedUser = localStorage.getItem('gamelog_user');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('gamelog_token');
    localStorage.removeItem('gamelog_user');
    return { token: null, user: null };
  }

  try {
    const user = storedUser ? (JSON.parse(storedUser) as unknown) : null;
    if (!isValidUser(user)) throw new Error('Invalid stored user');
    return { token, user };
  } catch {
    localStorage.removeItem('gamelog_token');
    localStorage.removeItem('gamelog_user');
    return { token: null, user: null };
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize synchronously so a refresh never flashes the login screen.
  const [session, setSession] = useState(readStoredSession);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('gamelog_token', newToken);
    localStorage.setItem('gamelog_user', JSON.stringify(userData));
    setSession({ token: newToken, user: userData });
  };

  const logout = () => {
    localStorage.removeItem('gamelog_token');
    localStorage.removeItem('gamelog_user');
    setSession({ token: null, user: null });
  };

  // fetchApi fires this after the server rejects an expired/invalid token.
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('gamelog_token');
      localStorage.removeItem('gamelog_user');
      setSession({ token: null, user: null });
    };
    window.addEventListener('gamelog:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('gamelog:unauthorized', handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        token: session.token,
        login,
        logout,
        isAuthenticated: !!session.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
