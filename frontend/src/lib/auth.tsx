'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, User } from './api';
import { useRouter } from 'next/navigation';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('r53_token');
    if (token) {
      api.auth.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('r53_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.auth.login(email, password);
    localStorage.setItem('r53_token', token);
    setUser(user);
    router.push('/hosted-zones');
  };

  const register = async (name: string, email: string, password: string) => {
    const { token, user } = await api.auth.register(name, email, password);
    localStorage.setItem('r53_token', token);
    setUser(user);
    router.push('/hosted-zones');
  };

  const logout = () => {
    localStorage.removeItem('r53_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
