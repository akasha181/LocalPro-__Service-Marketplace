import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole, phone?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('localpro_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session verification failed', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: loggedInUser, token: receivedToken } = res.data.data;
      setUser(loggedInUser);
      setToken(receivedToken);
      localStorage.setItem('localpro_token', receivedToken);
    } else {
      throw new Error(res.data.message || 'Login failed');
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'customer',
    phone?: string
  ) => {
    const res = await api.post('/auth/register', { name, email, password, role, phone });
    if (res.data.success) {
      const { user: registeredUser, token: receivedToken } = res.data.data;
      setUser(registeredUser);
      setToken(receivedToken);
      localStorage.setItem('localpro_token', receivedToken);
    } else {
      throw new Error(res.data.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('localpro_token');
    api.post('/auth/logout').catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        setUser,
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
