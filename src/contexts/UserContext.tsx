'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types';
import { getUser, getUsers, getUsersAsync, setAuthenticatedUserId } from '@/lib/storage';
import { signIn as supabaseSignIn, signOut as supabaseSignOut, onAuthStateChange, getSession } from '@/lib/supabase';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUsers: () => void;
  isAdmin: boolean;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load user profile from clozer_users based on Supabase auth user id
  const loadUserProfile = useCallback(async (authUserId: string) => {
    // Set the authenticated user ID in storage for sync
    setAuthenticatedUserId(authUserId);
    
    // First try to get from cache
    let userProfile = getUser(authUserId);
    
    // If not in cache, fetch all users to refresh cache
    if (!userProfile) {
      const allUsers = await getUsersAsync();
      setUsers(allUsers);
      userProfile = allUsers.find(u => u.id === authUserId);
    }
    
    if (userProfile) {
      setCurrentUser(userProfile);
    } else {
      console.error('User profile not found for auth user:', authUserId);
      // User exists in auth but not in clozer_users - this shouldn't happen
      // but handle gracefully
      setCurrentUser(null);
      setAuthenticatedUserId(null);
    }
  }, []);

  // Initialize: check for existing session and subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Load users first
        const allUsers = await getUsersAsync();
        if (mounted) {
          setUsers(allUsers);
        }

        // Check for existing session
        const { user: authUser } = await getSession();
        
        if (mounted) {
          if (authUser) {
            await loadUserProfile(authUser.id);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAuthenticatedUserId(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Optionally refresh user profile on token refresh
        await loadUserProfile(session.user.id);
      }
    });

    initialize();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadUserProfile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await supabaseSignIn(email, password);

      if (!result.success) {
        setAuthError(result.error || 'Échec de la connexion');
        setIsAuthenticating(false);
        return false;
      }

      // User profile will be loaded by the onAuthStateChange listener
      setIsAuthenticating(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Une erreur est survenue lors de la connexion');
      setIsAuthenticating(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabaseSignOut();
      setCurrentUser(null);
      setAuthenticatedUserId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUsers = useCallback(async () => {
    const allUsers = await getUsersAsync();
    setUsers(allUsers);
  }, []);

  const clearError = () => {
    setAuthError(null);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <UserContext.Provider value={{
      currentUser,
      users,
      isLoading,
      isAuthenticating,
      authError,
      login,
      logout,
      refreshUsers,
      isAdmin,
      clearError,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    // Return default values when context is not available (e.g., during SSR)
    return {
      currentUser: null,
      users: [],
      isLoading: true,
      isAuthenticating: false,
      authError: null,
      login: async () => false,
      logout: async () => {},
      refreshUsers: () => {},
      isAdmin: false,
      clearError: () => {},
    };
  }
  return context;
}
