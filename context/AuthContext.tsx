import React, { createContext, useState, useEffect, useContext } from 'react';
import { setAuthToken, setLogoutCallback } from '../services/api';
import { clearStoredAuth, getStoredAuth, saveStoredAuth } from '../services/authStorage';

type AuthContextType = {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
    setLogoutCallback(logout);
  }, []);

  const loadAuthState = async () => {
    try {
      setLoading(true);
      const { token: storedToken, userData: storedUser } = await getStoredAuth();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setAuthToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading auth state', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, userData: any) => {
    try {
      await saveStoredAuth(newToken, userData);
      setToken(newToken);
      setAuthToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error saving auth state', error);
    }
  };

  const logout = async () => {
    try {
      await clearStoredAuth();
      setToken(null);
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth state', error);
    }
  };

  const updateUser = async (updatedUser: any) => {
    try {
      if (token) {
        await saveStoredAuth(token, updatedUser);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user state', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
