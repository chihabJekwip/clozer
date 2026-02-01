'use client';

import { ReactNode, useEffect, useState } from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { initializeData } from '@/lib/storage';
import { initializeV2Data } from '@/lib/storage-v2';

export function Providers({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize data from Supabase on app start
    Promise.all([
      initializeData(),
      initializeV2Data(),
    ]).then(() => {
      setIsInitialized(true);
    });
  }, []);

  // Show loading while initializing data
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </ThemeProvider>
  );
}
