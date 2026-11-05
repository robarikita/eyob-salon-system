import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUserData, authApi } from '../api/authApi';

interface AuthContextType {
  user: AuthUserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUserData, token: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<AuthUserData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserData | null>(() => {
    try {
      const savedUser = localStorage.getItem('eyob_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('eyob_auth_token') ||
      null
    );
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync tokens to all storage keys used across frontend API modules
  const persistSession = (newUser: AuthUserData | null, newToken: string | null) => {
    if (newToken && newUser) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('eyob_auth_token', newToken);
      localStorage.setItem('eyob_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('eyob_auth_token');
      localStorage.removeItem('eyob_user');
    }
  };

  const login = (newUser: AuthUserData, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    persistSession(newUser, newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    persistSession(null, null);
  };

  const updateProfile = (data: Partial<AuthUserData>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('eyob_user', JSON.stringify(updated));
  };

  useEffect(() => {
    const verifyToken = async () => {
      const activeToken =
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('eyob_auth_token');

      if (!activeToken) {
        setIsLoading(false);
        return;
      }

      try {
        const liveUser = await authApi.getMe(activeToken);
        setUser(liveUser);
        localStorage.setItem('eyob_user', JSON.stringify(liveUser));
      } catch (err) {
        console.warn('Session verification failed, clearing credentials:', err);
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('eyob_auth_token');
        localStorage.removeItem('eyob_user');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
