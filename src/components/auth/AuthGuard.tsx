'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoading, isAdmin } = useUser();

  useEffect(() => {
    if (!isLoading) {
      // Si pas connecté et pas sur la page de login, rediriger vers login
      if (!currentUser && pathname !== '/login') {
        router.push('/login');
      }
      
      // Si connecté et sur la page de login, rediriger vers l'accueil
      if (currentUser && pathname === '/login') {
        router.push('/');
      }
      
      // Si la page nécessite admin et l'utilisateur n'est pas admin
      if (requireAdmin && currentUser && !isAdmin) {
        router.push('/');
      }
    }
  }, [currentUser, isLoading, pathname, router, requireAdmin, isAdmin]);

  // Pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Si pas connecté et pas sur la page de login
  if (!currentUser && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Si la page nécessite admin et l'utilisateur n'est pas admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Accès non autorisé</p>
      </div>
    );
  }

  return <>{children}</>;
}
