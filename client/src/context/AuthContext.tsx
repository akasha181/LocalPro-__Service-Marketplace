import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import type { User, UserRole } from '../types';
import { DEMO_USERS } from '../services/mockStore';

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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('localpro_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('localpro_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success) {
          setUser(res.data.data.user);
          localStorage.setItem('localpro_user', JSON.stringify(res.data.data.user));
        }
      } catch (err) {
        // Backend offline / network error: keep existing session or default to customer
        const saved = localStorage.getItem('localpro_user');
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            setUser(DEMO_USERS[4]);
          }
        } else {
          setUser(DEMO_USERS[4]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { user: loggedInUser, token: receivedToken } = res.data.data;
        setUser(loggedInUser);
        setToken(receivedToken);
        localStorage.setItem('localpro_token', receivedToken);
        localStorage.setItem('localpro_user', JSON.stringify(loggedInUser));
        return;
      }
    } catch (err: any) {
      // Offline fallback: match demo users or create session
      const demoMatch = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      const selectedUser: User = demoMatch || {
        _id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        phone: '+1 (555) 000-0000',
        isVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const mockToken = `demo_token_${selectedUser.role}_${Date.now()}`;
      setUser(selectedUser);
      setToken(mockToken);
      localStorage.setItem('localpro_token', mockToken);
      localStorage.setItem('localpro_user', JSON.stringify(selectedUser));
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'customer',
    phone?: string
  ) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role, phone });
      if (res.data?.success) {
        const { user: registeredUser, token: receivedToken } = res.data.data;
        setUser(registeredUser);
        setToken(receivedToken);
        localStorage.setItem('localpro_token', receivedToken);
        localStorage.setItem('localpro_user', JSON.stringify(registeredUser));
        return;
      }
    } catch (err: any) {
      // Offline fallback: create local user session
      const newUser: User = {
        _id: `user_${Date.now()}`,
        name,
        email,
        role,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
        phone: phone || '+1 (555) 000-0000',
        isVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const mockToken = `demo_token_${role}_${Date.now()}`;
      setUser(newUser);
      setToken(mockToken);
      localStorage.setItem('localpro_token', mockToken);
      localStorage.setItem('localpro_user', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('localpro_token');
    localStorage.removeItem('localpro_user');
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
