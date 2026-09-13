/**
 * Categoric AI - Authentication & Global User State
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, CreditWallet, Plan } from '../types.js';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  wallet: CreditWallet | null;
  plan: Plan | null;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  socialLogin: (email: string, name: string) => Promise<void>;
  switchAccount: (role: 'user' | 'admin') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: User; wallet: CreditWallet; plan: Plan | null }>('/api/auth/me');
      setUser(data.user);
      setWallet(data.wallet);
      setPlan(data.plan);
    } catch (err) {
      console.warn('Failed to load user session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthToken(res.token);
    await refreshUserData();
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await apiRequest<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    setAuthToken(res.token);
    await refreshUserData();
  };

  const socialLogin = async (email: string, name: string) => {
    const res = await apiRequest<{ user: User; token: string }>('/api/auth/social', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    });
    setAuthToken(res.token);
    await refreshUserData();
  };

  const switchAccount = async (role: 'user' | 'admin') => {
    setIsLoading(true);
    try {
      if (role === 'admin') {
        await login('admin@categoric.ai', 'admin123');
      } else {
        await login('creator@categoric.ai', 'demo123');
      }
    } catch {
      // Fallback
      await refreshUserData();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setWallet(null);
    setPlan(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        plan,
        isLoading,
        refreshUserData,
        login,
        register,
        socialLogin,
        switchAccount,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
