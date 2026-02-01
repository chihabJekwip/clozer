'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tour } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
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
  ChevronRight,
  Users,
  Zap,
} from 'lucide-react';
import { getTours, getToursByUser, getVisitsByTour } from '@/lib/storage';
import { formatDistance, formatDuration, cn } from '@/lib/utils';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser } from '@/contexts/UserContext';

type FilterType = 'all' | 'active' | 'completed';

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
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (isAdmin) {
      setTours(getTours());
    } else if (currentUser) {
      setTours(getToursByUser(currentUser.id));
    }
  }, [isAdmin, currentUser]);

  const filteredTours = useMemo(() => {
    return tours.filter(tour => {
      if (filter === 'active') return tour.status === 'in_progress' || tour.status === 'planning';
      if (filter === 'completed') return tour.status === 'completed';
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tours, filter]);

  const stats = useMemo(() => ({
    total: tours.length,
    active: tours.filter(t => t.status === 'in_progress' || t.status === 'planning').length,
    completed: tours.filter(t => t.status === 'completed').length,
  }), [tours]);

  // Find active tour for quick access
  const activeTour = tours.find(t => t.status === 'in_progress');

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="header-glass">
        <div className="container-app h-16 flex-between">
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
              <p className="text-xs text-muted-foreground">
                {stats.total} tournée{stats.total > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link href="/">
            <Button size="sm" variant="gradient">
              <Plus className="w-4 h-4 mr-1" />
              Nouvelle
            </Button>
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-background border-b sticky top-16 z-30">
        <div className="container-app py-3">
          <div className="flex rounded-xl bg-muted p-1">
            {[
              { key: 'all' as FilterType, label: 'Toutes', count: stats.total },
              { key: 'active' as FilterType, label: 'Actives', count: stats.active },
              { key: 'completed' as FilterType, label: 'Terminées', count: stats.completed },
            ].map(tab => (
              <button
                key={tab.key}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                  filter === tab.key 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
                <span className={cn(
                  "ml-1.5 text-xs",
                  filter === tab.key ? "text-primary" : ""
                )}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access - Active Tour */}
      {activeTour && filter !== 'completed' && (
        <div className="container-app pt-4">
          <Link href={`/tour/${activeTour.id}`}>
            <Card variant="glass" className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-blue-100">Continuer</p>
                    <h3 className="font-bold text-white truncate">{activeTour.name}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white flex-center">
                    <Play className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Tours List */}
      <main className="container-app py-4">
        {filteredTours.length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-state-icon">
              <Route className="w-full h-full" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune tournée</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' 
                ? 'Créez votre première tournée'
                : filter === 'active' 
                  ? 'Aucune tournée en cours'
                  : 'Aucune tournée terminée'
              }
            </p>
            {filter === 'all' && (
              <Link href="/">
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une tournée
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filteredTours.map(tour => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Tour Card Component
function TourCard({ tour }: { tour: Tour }) {
  const visits = getVisitsByTour(tour.id);
  const completed = visits.filter(v => v.status === 'completed').length;
  const absent = visits.filter(v => v.status === 'absent').length;
  const progress = visits.length > 0 ? Math.round((completed / visits.length) * 100) : 0;
  
  const isActive = tour.status === 'in_progress';
  const isCompleted = tour.status === 'completed';

  return (
    <Link href={`/tour/${tour.id}`}>
      <Card variant="interactive">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex-center flex-shrink-0",
              isCompleted 
                ? "bg-gradient-to-br from-emerald-400 to-emerald-500" 
                : isActive
                  ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                  : "bg-muted"
            )}>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : isActive ? (
                <Play className="w-5 h-5 text-white" />
              ) : (
                <Route className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold truncate">{tour.name}</h3>
                <StatusBadge status={tour.status} />
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(tour.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {completed}/{visits.length} visites
                    {absent > 0 && <span className="text-amber-500">({absent} abs.)</span>}
                  </span>
                  <span className={cn(
                    "font-semibold",
                    isCompleted ? "text-emerald-600" : "text-primary"
                  )}>
                    {progress}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={cn(
                      "progress-fill",
                      isCompleted && "from-emerald-500 to-emerald-400"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              {(tour.totalDistance || tour.totalDuration) && (
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {tour.totalDistance && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {formatDistance(tour.totalDistance)}
                    </span>
                  )}
                  {tour.totalDuration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(tour.totalDuration)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
