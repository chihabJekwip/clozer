'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getCurrentUser, setCurrentUser as setStoredUser, getUsers } from '@/lib/storage';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  login: (userId: string) => void;
  logout: () => void;
  refreshUsers: () => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger l'utilisateur actuel et la liste des utilisateurs au démarrage
    const user = getCurrentUser();
    const allUsers = getUsers();
    setCurrentUser(user);
    setUsers(allUsers);
    setIsLoading(false);
  }, []);

  const login = (userId: string) => {
    setStoredUser(userId);
    const user = getUsers().find(u => u.id === userId) || null;
    setCurrentUser(user);
  };

  const logout = () => {
    setStoredUser(null);
    setCurrentUser(null);
  };

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <UserContext.Provider value={{
      currentUser,
      users,
      isLoading,
      login,
      logout,
      refreshUsers,
      isAdmin,
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
      login: () => {},
      logout: () => {},
      refreshUsers: () => {},
      isAdmin: false,
    };
  }
  return context;
}
