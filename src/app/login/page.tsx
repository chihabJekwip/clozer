'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { getUsers } from '@/lib/storage';
import { useUser } from '@/contexts/UserContext';
import { Shield, Briefcase, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    // Si déjà connecté, rediriger vers l'accueil
    if (currentUser) {
      router.push('/');
    }
    
    // Charger les utilisateurs
    setUsers(getUsers());
  }, [currentUser, router]);

  const handleLogin = () => {
    if (selectedUserId) {
      login(selectedUserId);
      router.push('/');
    }
  };

  const admins = users.filter(u => u.role === 'admin');
  const commerciaux = users.filter(u => u.role === 'commercial');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <CardTitle className="text-2xl">Bienvenue sur Clozer</CardTitle>
          <CardDescription>
            Sélectionnez votre profil pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Administrateurs */}
          {admins.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Administrateurs
              </h3>
              <div className="space-y-2">
                {admins.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedUserId === user.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Commerciaux */}
          {commerciaux.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Commerciaux
              </h3>
              <div className="space-y-2">
                {commerciaux.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedUserId === user.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {commerciaux.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              Aucun commercial enregistré. L'administrateur peut en créer.
            </p>
          )}

          <Button 
            className="w-full" 
            size="lg"
            disabled={!selectedUserId}
            onClick={handleLogin}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Se connecter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
