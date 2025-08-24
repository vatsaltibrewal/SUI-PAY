'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Creator {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  walletAddress: string;
  suiNameService?: string;
  isVerified: boolean;
  twitterHandle?: string;
  websiteUrl?: string;
  minDonationAmount: number;
  customMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  creator: Creator | null;
  token: string | null;
  loading: boolean;
  login: (email: string, walletAddress?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Creator>) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  username: string;
  displayName: string;
  walletAddress: string;
  suiNameService?: string;
  bio?: string;
  avatar?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved authentication on mount
    const savedToken = localStorage.getItem('sui-pay-token');
    const savedCreator = localStorage.getItem('sui-pay-creator');

    if (savedToken && savedCreator) {
      try {
        setToken(savedToken);
        setCreator(JSON.parse(savedCreator));
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('sui-pay-token');
        localStorage.removeItem('sui-pay-creator');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, walletAddress?: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, walletAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      setCreator(data.creator);

      // Save to localStorage
      localStorage.setItem('sui-pay-token', data.token);
      localStorage.setItem('sui-pay-creator', JSON.stringify(data.creator));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return { success: false, error: responseData.error || 'Registration failed' };
      }

      setToken(responseData.token);
      setCreator(responseData.creator);

      // Save to localStorage
      localStorage.setItem('sui-pay-token', responseData.token);
      localStorage.setItem('sui-pay-creator', JSON.stringify(responseData.creator));

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setCreator(null);
      localStorage.removeItem('sui-pay-token');
      localStorage.removeItem('sui-pay-creator');
    }
  };

  const updateProfile = async (data: Partial<Creator>) => {
    try {
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('/api/creator/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return { success: false, error: responseData.error || 'Update failed' };
      }

      setCreator(responseData.creator);
      localStorage.setItem('sui-pay-creator', JSON.stringify(responseData.creator));

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const value = {
    creator,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
