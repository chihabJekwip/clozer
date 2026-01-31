'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tour } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Route, 
  MapPin, 
  Clock, 
  Calendar,
  Play,
  CheckCircle,
  PauseCircle,
  Plus,
} from 'lucide-react';
import { getTours, getToursByUser, getVisitsByTour } from '@/lib/storage';
import { formatDistance, formatDuration } from '@/lib/utils';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser } from '@/contexts/UserContext';

export default function ToursPage() {
  return (
    <AuthGuard>
      <ToursContent />
    </AuthGuard>
  );
}

function ToursContent() {
  const router = useRouter();
  const { currentUser, isAdmin } = useUser();
  const [tours, setTours] = useState<Tour[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (isAdmin) {
      setTours(getTours());
    } else if (currentUser) {
      setTours(getToursByUser(currentUser.id));
    }
  }, [isAdmin, currentUser]);

  const filteredTours = tours.filter(tour => {
    if (filter === 'active') return tour.status === 'in_progress' || tour.status === 'planning';
    if (filter === 'completed') return tour.status === 'completed';
    return true;
  });

  const activeTours = tours.filter(t => t.status === 'in_progress' || t.status === 'planning');
  const completedTours = tours.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Tournées</h1>
              <p className="text-sm text-muted-foreground">
                {tours.length} tournée{tours.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link href="/">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nouvelle
            </Button>
          </Link>
        </div>
      </header>

      {/* Filtres */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-white shadow text-gray-900' 
                  : 'text-gray-600'
              }`}
              onClick={() => setFilter('all')}
            >
              Toutes ({tours.length})
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                filter === 'active' 
                  ? 'bg-white shadow text-gray-900' 
                  : 'text-gray-600'
              }`}
              onClick={() => setFilter('active')}
            >
              Actives ({activeTours.length})
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                filter === 'completed' 
                  ? 'bg-white shadow text-gray-900' 
                  : 'text-gray-600'
              }`}
              onClick={() => setFilter('completed')}
            >
              Terminées ({completedTours.length})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des tournées */}
      <main className="p-4 max-w-2xl mx-auto space-y-3">
        {filteredTours.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Route className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">Aucune tournée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Créez votre première tournée depuis la page d\'accueil'
                  : filter === 'active' 
                    ? 'Aucune tournée en cours'
                    : 'Aucune tournée terminée'
                }
              </p>
              {filter === 'all' && (
                <Link href="/">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une tournée
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTours.map(tour => {
            const visits = getVisitsByTour(tour.id);
            const completed = visits.filter(v => v.status === 'completed').length;
            const progress = visits.length > 0 ? Math.round((completed / visits.length) * 100) : 0;

            return (
              <Link key={tour.id} href={`/tour/${tour.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{tour.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(tour.date).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          tour.status === 'in_progress' ? 'default' :
                          tour.status === 'completed' ? 'success' : 'secondary'
                        }
                        className="shrink-0"
                      >
                        {tour.status === 'in_progress' && (
                          <Play className="w-3 h-3 mr-1" />
                        )}
                        {tour.status === 'completed' && (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {tour.status === 'paused' && (
                          <PauseCircle className="w-3 h-3 mr-1" />
                        )}
                        {tour.status === 'planning' && 'Planifié'}
                        {tour.status === 'in_progress' && 'En cours'}
                        {tour.status === 'completed' && 'Terminé'}
                        {tour.status === 'paused' && 'En pause'}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {completed}/{visits.length} visites
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            tour.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {tour.totalDistance && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {formatDistance(tour.totalDistance)}
                        </span>
                      )}
                      {tour.totalDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(tour.totalDuration)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </main>
    </div>
  );
}
