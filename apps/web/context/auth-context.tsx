"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { LoginDto } from '@repo/shared';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Attempt initial hydration via refresh token
    const hydrate = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (typeof window !== 'undefined') {
             localStorage.setItem('accessToken', data.accessToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email, role: payload.role, fullName: 'User' }); // fallback name
      } catch (e) {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = async (credentials: LoginDto) => {
    const { data } = await api.post('/auth/login', credentials);
    if (typeof window !== 'undefined') {
         localStorage.setItem('accessToken', data.accessToken);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    setUser(data.user);
    
    // Redirect based on role
    if (data.user.role === 'ADMIN') router.push('/admin');
    else if (data.user.role === 'TEACHER') router.push('/teacher');
    else router.push('/student');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
           localStorage.removeItem('accessToken');
      }
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
