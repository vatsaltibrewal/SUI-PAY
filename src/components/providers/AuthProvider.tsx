'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// V0 User interface for frontend compatibility
interface User {
  username?: string;
  name?: string;
  bio?: string;
  profilePicture?: string;
  walletAddress?: string;
  isWalletConnected: boolean;
}

// Our backend Creator interface
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

// Combined context type that supports both V0 frontend and our backend
interface AppContextType {
  // V0 compatibility
  user: User;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
  
  // Our backend integration
  creator: Creator | null;
  token: string | null;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Legacy alias for backward compatibility
export const useAuth = useApp;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>({ isWalletConnected: false });
  const [isLoading, setIsLoading] = useState(true);

  // Convert Creator to User for V0 compatibility
  const creatorToUser = (creator: Creator | null): User => {
    if (!creator) return { isWalletConnected: false };
    
    return {
      username: creator.suiNameService || creator.username,
      name: creator.displayName,
      bio: creator.bio,
      profilePicture: creator.avatar,
      walletAddress: creator.walletAddress,
      isWalletConnected: !!creator.walletAddress,
    };
  };

  // Convert User to Creator for backend compatibility
  const userToCreator = (user: User): Partial<Creator> => {
    return {
      username: user.username || '',
      displayName: user.name || '',
      bio: user.bio,
      avatar: user.profilePicture,
      walletAddress: user.walletAddress || '',
      suiNameService: user.username?.startsWith('@') ? user.username : undefined,
    };
  };

  useEffect(() => {
    // Check for saved authentication on mount
    const savedToken = localStorage.getItem('sui-pay-token');
    const savedCreator = localStorage.getItem('sui-pay-creator');
    const savedUser = localStorage.getItem('suipay-user'); // V0 compatibility

    if (savedToken && savedCreator) {
      try {
        const parsedCreator = JSON.parse(savedCreator);
        setToken(savedToken);
        setCreator(parsedCreator);
        setUser(creatorToUser(parsedCreator));
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('sui-pay-token');
        localStorage.removeItem('sui-pay-creator');
      }
    } else if (savedUser) {
      // V0 compatibility: load user data
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
      }
    }

    setIsLoading(false);
  }, []);

  // Sync user data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('suipay-user', JSON.stringify(user));
    }
  }, [user, isLoading]);

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
      
      // Update V0 user state
      setUser(creatorToUser(data.creator));

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
      
      // Update V0 user state
      setUser(creatorToUser(responseData.creator));

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
      setUser({ isWalletConnected: false });
      localStorage.removeItem('sui-pay-token');
      localStorage.removeItem('sui-pay-creator');
      localStorage.removeItem('suipay-user');
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
      
      // Update V0 user state
      setUser(creatorToUser(responseData.creator));

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // V0 compatibility methods
  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      const newUser = { ...prev, ...updates };
      
      // If user has been updated with new data, try to sync with backend
      if (updates.name || updates.bio || updates.profilePicture) {
        const creatorUpdates = userToCreator(newUser);
        if (creator) {
          updateProfile(creatorUpdates);
        }
      }
      
      return newUser;
    });
  };

  const value = {
    // V0 compatibility
    user,
    setUser,
    updateUser,
    isLoading,
    
    // Backend integration
    creator,
    token,
    loading: isLoading, // alias for V0 compatibility
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
