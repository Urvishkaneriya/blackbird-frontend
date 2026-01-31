'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiClient } from '@/app/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  /** Set for employees from /api/auth/me */
  branchId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from stored token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }
        const userData = await apiClient.getCurrentUser();
        if (userData) {
          setUser({
            id: (userData._id ?? userData.id) as string,
            email: userData.email as string,
            name: (userData.name ?? userData.fullName) as string,
            role: userData.role as 'admin' | 'employee',
            branchId: userData.branchId as string | undefined,
          });
        }
      } catch {
        apiClient.clearToken();
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.login(email, password);
      const userData = await apiClient.getCurrentUser();
      if (userData) {
        setUser({
          id: (userData._id ?? userData.id) as string,
          email: userData.email as string,
          name: (userData.name ?? userData.fullName) as string,
          role: userData.role as 'admin' | 'employee',
          branchId: userData.branchId as string | undefined,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiClient.clearToken();
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, error }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
