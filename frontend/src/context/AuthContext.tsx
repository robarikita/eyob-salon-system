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
  loginWithDemo: (role: 'CUSTOMER' | 'EMPLOYEE' | 'BRANCH_ADMIN' | 'OWNER') => void;
}

const DEMO_ACCOUNTS: Record<'CUSTOMER' | 'EMPLOYEE' | 'BRANCH_ADMIN' | 'OWNER', { user: AuthUserData; token: string }> = {
  CUSTOMER: {
    user: {
      id: 'demo-cust-01',
      firstName: 'Sara',
      lastName: 'Tadesse',
      phone: '+251911234567',
      email: 'sara.t@eyobsalon.com',
      role: 'CUSTOMER',
      branchId: 'bole',
    },
    token: 'eyob-demo-token-customer',
  },
  EMPLOYEE: {
    user: {
      id: 'demo-emp-01',
      firstName: 'Sara',
      lastName: 'Ahmed',
      phone: '+251911234567',
      email: 'sara.ahmed@eyobbeauty.com',
      role: 'EMPLOYEE',
      branchId: 'bole',
      workstation: 'Hair',
    },
    token: 'eyob-demo-token-employee',
  },
  BRANCH_ADMIN: {
    user: {
      id: 'demo-admin-01',
      firstName: 'Bole',
      lastName: 'Manager',
      phone: '+251911000002',
      email: 'admin@eyobsalon.com',
      role: 'BRANCH_ADMIN',
      branchId: 'bole',
    },
    token: 'eyob-demo-token-admin',
  },
  OWNER: {
    user: {
      id: 'demo-owner-01',
      firstName: 'Eyob',
      lastName: 'Hailu',
      phone: '+251911000001',
      email: 'owner@eyobbeauty.com',
      role: 'OWNER',
      branchId: null,
    },
    token: 'eyob-demo-token-owner',
  },
};

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

  const loginWithDemo = (role: 'CUSTOMER' | 'EMPLOYEE' | 'BRANCH_ADMIN' | 'OWNER') => {
    const demo = DEMO_ACCOUNTS[role];
    if (demo) {
      login(demo.user, demo.token);
    }
  };

  useEffect(() => {
    // Attempt profile verification if token exists
    const verifyToken = async () => {
      const activeToken =
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('eyob_auth_token');

      if (!activeToken) {
        setIsLoading(false);
        return;
      }

      // If it's a demo token, preserve current state
      if (activeToken.startsWith('eyob-demo-token')) {
        setIsLoading(false);
        return;
      }

      try {
        const liveUser = await authApi.getMe(activeToken);
        setUser(liveUser);
        localStorage.setItem('eyob_user', JSON.stringify(liveUser));
      } catch (err) {
        console.warn('Session verification fallback to stored session:', err);
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
        loginWithDemo,
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
