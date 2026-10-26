import React, { createContext, useContext, useState, type ReactNode } from 'react';

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Synchronously initialize state to prevent race conditions on refresh
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('gamelog_user');
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('gamelog_token');
  });

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('gamelog_token', newToken);
    localStorage.setItem('gamelog_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('gamelog_token');
    localStorage.removeItem('gamelog_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
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