import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  switchUser: (targetUser: User) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const storedId = localStorage.getItem('tripmates_user_id');
      const { user: fetchedUser } = await api.getMe(storedId || undefined);
      if (fetchedUser) {
        setUser(fetchedUser);
        localStorage.setItem('tripmates_user_id', fetchedUser.id);
      }
    } catch (err) {
      console.warn('Could not load user, default demo fallback will apply', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (identifier: string, pass: string) => {
    const { user: loggedInUser } = await api.login(identifier, pass);
    setUser(loggedInUser);
    localStorage.setItem('tripmates_user_id', loggedInUser.id);
  };

  const register = async (data: Partial<User> & { password: string }) => {
    const { user: newUser } = await api.register(data);
    setUser(newUser);
    localStorage.setItem('tripmates_user_id', newUser.id);
  };

  const logout = () => {
    localStorage.removeItem('tripmates_user_id');
    // Load default first user for easy browsing
    initAuth();
  };

  const switchUser = (targetUser: User) => {
    setUser(targetUser);
    localStorage.setItem('tripmates_user_id', targetUser.id);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const { user: updated } = await api.updateUser(user.id, updates);
    setUser(updated);
  };

  const refreshUser = async () => {
    if (!user) return;
    const { user: refreshed } = await api.getMe(user.id);
    setUser(refreshed);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchUser,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
