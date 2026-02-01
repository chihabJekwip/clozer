'use client';

import { useState, ReactNode } from 'react';
import { Client, Tour, Visit } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Map as MapIcon,
  User,
  StickyNote,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Navigation,
  Check,
  UserX,
  Home,
  Clock,
  MapPin,
  RotateCcw,
  Flag,
  Zap,
  List,
} from 'lucide-react';
import { formatDistance, formatDuration, formatPhone, cn } from '@/lib/utils';

type TourModeTab = 'map' | 'client' | 'list' | 'actions';

interface TourModeLayoutProps {
  tour: Tour;
  visits: Visit[];
  clients: Client[];
  currentVisitIndex: number;
  routeGeometry: [number, number][];
  onNavigate: (client: Client) => void;
  onMarkCompleted: (visitId: string) => void;
  onMarkAbsent: (visitId: string) => void;
  onOpenNotes: () => void;
  onExitTourMode: () => void;
  onEndTour: () => void;
  onOptimize: () => void;
  onOptimizeFromCurrentLocation?: () => void; // Re-optimize from user's current GPS position
  onSelectVisit: (index: number) => void;
  mapComponent: ReactNode;
  isOptimizing: boolean;
  completedCount: number;
  totalCount: number;
}

export default function TourModeLayout({
  tour,
  visits,
  clients,
  currentVisitIndex,
  routeGeometry,
  onNavigate,
  onMarkCompleted,
  onMarkAbsent,
  onOpenNotes,
  onExitTourMode,
  onEndTour,
  onOptimize,
  onOptimizeFromCurrentLocation,
  onSelectVisit,
  mapComponent,
  isOptimizing,
  completedCount,
  totalCount,
}: TourModeLayoutProps) {
  const [activeTab, setActiveTab] = useState<TourModeTab>('map');
  
  const currentVisit = visits[currentVisitIndex];
  const currentClient = currentVisit 
    ? clients.find(c => c.id === currentVisit.clientId)
    : null;
  
  const pendingVisits = visits.filter(v => v.status === 'pending');
  const absentCount = visits.filter(v => v.status === 'absent').length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const goToPrevious = () => {
    if (currentVisitIndex > 0) {
      onSelectVisit(currentVisitIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentVisitIndex < visits.length - 1) {
      onSelectVisit(currentVisitIndex + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50 tour-mode-overlay">
      {/* ===== HEADER ===== */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/90 hover:text-white hover:bg-white/10 h-10 w-10"
              onClick={onExitTourMode}
            >
              <X className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-bold text-base truncate max-w-[180px]">{tour.name}</h1>
              <div className="flex items-center gap-3 text-sm text-blue-100">
                <span className="font-medium">{completedCount}/{totalCount}</span>
                <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs">{progress}%</span>
              </div>
            </div>
          </div>
          
          {tour.status === 'in_progress' && (
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 h-9"
              onClick={onEndTour}
            >
              <Flag className="w-4 h-4 mr-1.5" />
              Terminer
            </Button>
          )}
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-hidden bg-muted/30">
        
        {/* TAB: MAP */}
        {activeTab === 'map' && (
          <div className="h-full relative">
            {mapComponent}
            
            {/* Floating Re-optimize Button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="outline"
                size="lg"
                className={`bg-white/95 shadow-lg h-12 px-4 ${isOptimizing ? 'animate-pulse' : ''}`}
                onClick={onOptimizeFromCurrentLocation || onOptimize}
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <>
                    <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                    Optimisation...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Ré-optimiser
                  </>
                )}
              </Button>
            </div>
            
            {/* Current Client Overlay */}
            {currentClient && currentVisit?.status === 'pending' && (
              <div className="absolute bottom-4 left-4 right-4 animate-slide-in-up">
                <Card variant="glass" className="shadow-2xl">
                  <div className="p-4">
                    {/* Client Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex-center font-bold text-lg shadow-lg">
                        {currentVisitIndex + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">
                          {currentClient.civilite} {currentClient.nom}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {currentClient.ville}
                        </p>
                      </div>
                      {/* Quick call button */}
                      {(currentClient.portableM || currentClient.portableMme) && (
                        <a href={`tel:${currentClient.portableM || currentClient.portableMme}`}>
                          <Button variant="outline" size="icon" className="h-10 w-10">
                            <Phone className="w-5 h-5" />
                          </Button>
                        </a>
                      )}
                    </div>

                    {/* Distance info */}
                    {currentVisit.distanceFromPrevious && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {formatDistance(currentVisit.distanceFromPrevious)}
                        </span>
                        {currentVisit.durationFromPrevious && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatDuration(currentVisit.durationFromPrevious)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="gradient-success"
                        className="h-14 flex-col gap-1"
                        onClick={() => onMarkCompleted(currentVisit.id)}
                      >
                        <Check className="w-5 h-5" />
                        <span className="text-xs">Visité</span>
                      </Button>
                      <Button
                        variant="gradient-warning"
                        className="h-14 flex-col gap-1"
                        onClick={() => onMarkAbsent(currentVisit.id)}
                      >
                        <UserX className="w-5 h-5" />
                        <span className="text-xs">Absent</span>
                      </Button>
                      <Button
                        variant="gradient"
                        className="h-14 flex-col gap-1"
                        onClick={() => onNavigate(currentClient)}
                      >
                        <Navigation className="w-5 h-5" />
                        <span className="text-xs">Y aller</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* TAB: CLIENT DETAIL */}
        {activeTab === 'client' && (
          <div className="h-full overflow-y-auto scrollbar-thin">
            {currentClient ? (
              <div className="p-4 space-y-4 pb-8">
                {/* Navigation Header */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={currentVisitIndex === 0}
                    className="h-10"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Préc.
                  </Button>
                  <span className="text-sm font-medium px-3 py-1 bg-muted rounded-full">
                    {currentVisitIndex + 1} / {visits.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={currentVisitIndex === visits.length - 1}
                    className="h-10"
                  >
                    Suiv.
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Client Card */}
                <Card className="overflow-hidden">
                  {/* Status Banner */}
                  <div className={cn(
                    "px-4 py-3",
                    currentVisit?.status === 'completed' && "bg-emerald-500",
                    currentVisit?.status === 'absent' && "bg-amber-500",
                    currentVisit?.status === 'pending' && "bg-blue-500"
                  )}>
                    <div className="flex items-center justify-between text-white">
                      <span className="font-medium">
                        {currentVisit?.status === 'completed' ? '✓ Visite effectuée' :
                         currentVisit?.status === 'absent' ? '! Client absent' : 'À visiter'}
                      </span>
                      <Badge className="bg-white/20 text-white border-0">
                        #{currentVisitIndex + 1}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Name */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex-center shadow-lg">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {currentClient.civilite} {currentClient.nom}
                        </h2>
                        <p className="text-muted-foreground">{currentClient.prenom}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{currentClient.adresse}</p>
                          <p className="text-muted-foreground">
                            {currentClient.codePostal} {currentClient.ville}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Phone Numbers */}
                    {(currentClient.portableM || currentClient.portableMme || currentClient.telDomicile) && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Contacts</p>
                        <div className="grid gap-2">
                          {currentClient.portableM && (
                            <a href={`tel:${currentClient.portableM}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                              <Phone className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">M.</p>
                                <p className="font-medium">{formatPhone(currentClient.portableM)}</p>
                              </div>
                            </a>
                          )}
                          {currentClient.portableMme && (
                            <a href={`tel:${currentClient.portableMme}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                              <Phone className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Mme</p>
                                <p className="font-medium">{formatPhone(currentClient.portableMme)}</p>
                              </div>
                            </a>
                          )}
                          {currentClient.telDomicile && (
                            <a href={`tel:${currentClient.telDomicile}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                              <Phone className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Domicile</p>
                                <p className="font-medium">{formatPhone(currentClient.telDomicile)}</p>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Action Buttons */}
                {currentVisit?.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="xl"
                      variant="gradient-success"
                      className="h-16"
                      onClick={() => onMarkCompleted(currentVisit.id)}
                    >
                      <Check className="w-6 h-6 mr-2" />
                      Visité
                    </Button>
                    <Button
                      size="xl"
                      variant="gradient-warning"
                      className="h-16"
                      onClick={() => onMarkAbsent(currentVisit.id)}
                    >
                      <UserX className="w-6 h-6 mr-2" />
                      Absent
                    </Button>
                  </div>
                )}

                {/* Navigation Button */}
                {currentClient.latitude && currentClient.longitude && (
                  <Button
                    size="xl"
                    variant="outline"
                    className="w-full h-14"
                    onClick={() => onNavigate(currentClient)}
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Lancer la navigation
                  </Button>
                )}
              </div>
            ) : (
              <div className="h-full flex-center">
                <div className="text-center text-muted-foreground">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Aucun client sélectionné</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: LIST */}
        {activeTab === 'list' && (
          <div className="h-full overflow-y-auto scrollbar-thin p-4 pb-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Visités</p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{absentCount}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300">Absents</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-600 dark:text-gray-300">{pendingVisits.length}</p>
                <p className="text-[10px] text-gray-700 dark:text-gray-400">Restants</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{progress}%</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-300">Total</p>
              </div>
            </div>

            {/* Visits List */}
            <div className="space-y-2">
              {visits.map((visit, index) => {
                const client = clients.find(c => c.id === visit.clientId);
                if (!client) return null;
                
                const isCurrent = index === currentVisitIndex;
                
                return (
                  <button
                    key={visit.id}
                    className={cn(
                      "w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left",
                      visit.status === 'completed' && "bg-emerald-50 dark:bg-emerald-900/20",
                      visit.status === 'absent' && "bg-amber-50 dark:bg-amber-900/20",
                      visit.status === 'pending' && !isCurrent && "bg-muted/50",
                      isCurrent && "bg-primary/10 ring-2 ring-primary"
                    )}
                    onClick={() => onSelectVisit(index)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex-center text-sm font-bold flex-shrink-0",
                      visit.status === 'completed' && "bg-emerald-500 text-white",
                      visit.status === 'absent' && "bg-amber-500 text-white",
                      visit.status === 'pending' && "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                    )}>
                      {visit.status === 'completed' ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{client.nom}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.ville}</p>
                    </div>
                    <Badge 
                      variant={
                        visit.status === 'completed' ? 'success' :
                        visit.status === 'absent' ? 'warning' : 'secondary'
                      }
                      size="sm"
                    >
                      {visit.status === 'completed' ? 'OK' :
                       visit.status === 'absent' ? 'Abs.' : 'À faire'}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: ACTIONS */}
        {activeTab === 'actions' && (
          <div className="h-full overflow-y-auto scrollbar-thin p-4 pb-8 space-y-4">
            <h3 className="font-semibold text-lg">Actions</h3>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-14 text-base"
                onClick={onOptimize}
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <div className="w-5 h-5 mr-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-5 h-5 mr-3" />
                )}
                Ré-optimiser l'itinéraire
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-14 text-base"
                onClick={onOpenNotes}
              >
                <StickyNote className="w-5 h-5 mr-3" />
                Carnet de notes
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-14 text-base"
                onClick={onExitTourMode}
              >
                <Home className="w-5 h-5 mr-3" />
                Retour à l'accueil
              </Button>

              {tour.status === 'in_progress' && (
                <Button
                  variant="subtle-warning"
                  className="w-full justify-start h-14 text-base"
                  onClick={onEndTour}
                >
                  <Flag className="w-5 h-5 mr-3" />
                  Terminer la tournée
                </Button>
              )}
            </div>

            {/* Tour Info */}
            {tour.totalDistance && (
              <Card className="p-4 mt-6">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Informations</h4>
                <div className="grid grid-cols-2 gap-4">
                  {tour.totalDistance && (
                    <div>
                      <p className="text-2xl font-bold">{formatDistance(tour.totalDistance)}</p>
                      <p className="text-xs text-muted-foreground">Distance totale</p>
                    </div>
                  )}
                  {tour.totalDuration && (
                    <div>
                      <p className="text-2xl font-bold">{formatDuration(tour.totalDuration)}</p>
                      <p className="text-xs text-muted-foreground">Durée estimée</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* ===== BOTTOM NAVIGATION ===== */}
      <nav className="bg-background border-t safe-bottom">
        <div className="flex">
          {[
            { id: 'map' as TourModeTab, icon: MapIcon, label: 'Carte' },
            { id: 'client' as TourModeTab, icon: User, label: 'Client' },
            { id: 'list' as TourModeTab, icon: List, label: 'Liste' },
            { id: 'actions' as TourModeTab, icon: MoreHorizontal, label: 'Plus' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-3 transition-all",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                </div>
                <span className={cn(
                  "text-[10px] mt-0.5",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
