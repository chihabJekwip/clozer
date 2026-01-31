'use client';

import { ReactNode, useEffect, useState } from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { initializeData } from '@/lib/storage';

export function Providers({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize data from Supabase on app start
    initializeData().then(() => {
      setIsInitialized(true);
    });
  }, []);

  // Show loading while initializing data
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
