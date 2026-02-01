'use client';

import { useState, ReactNode } from 'react';
import { Client, Tour, Visit } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  FileText,
  Home,
  Clock,
  MapPin,
} from 'lucide-react';
import { formatDistance, formatDuration, formatPhone } from '@/lib/utils';

type TourModeTab = 'map' | 'client' | 'notes' | 'actions';

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
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Navigation entre clients
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
    <div className="fixed inset-0 bg-white flex flex-col z-50">
      {/* Header compact */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between safe-area-inset-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-500 h-8 w-8"
            onClick={onExitTourMode}
          >
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-sm truncate max-w-[150px]">{tour.name}</h1>
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <span>{completedCount}/{totalCount}</span>
              <div className="w-16 h-1.5 bg-blue-400 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {tour.status === 'in_progress' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-500 text-xs h-8"
              onClick={onEndTour}
            >
              Terminer
            </Button>
          )}
        </div>
      </header>

      {/* Contenu principal - dépend de l'onglet actif */}
      <main className="flex-1 overflow-hidden">
        {/* Onglet Carte */}
        {activeTab === 'map' && (
          <div className="h-full relative">
            {mapComponent}
            
            {/* Mini-carte du client actuel en overlay */}
            {currentClient && currentVisit?.status === 'pending' && (
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {currentVisitIndex + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {currentClient.civilite} {currentClient.nom}
                      </h3>
                      <p className="text-xs text-gray-500">{currentClient.ville}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 h-10 px-4"
                    onClick={() => onNavigate(currentClient)}
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Y aller
                  </Button>
                </div>
                
                {currentVisit.distanceFromPrevious && (
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {formatDistance(currentVisit.distanceFromPrevious)}
                    </span>
                    {currentVisit.durationFromPrevious && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(currentVisit.durationFromPrevious)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Onglet Client */}
        {activeTab === 'client' && (
          <div className="h-full overflow-y-auto">
            {currentClient ? (
              <div className="p-4 space-y-4">
                {/* Navigation entre clients */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={currentVisitIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Préc.
                  </Button>
                  <span className="text-sm text-gray-500">
                    Client {currentVisitIndex + 1} / {visits.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={currentVisitIndex === visits.length - 1}
                  >
                    Suiv.
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Fiche client */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant={currentVisit?.status === 'completed' ? 'success' : 
                                      currentVisit?.status === 'absent' ? 'warning' : 'default'}>
                        {currentVisit?.status === 'completed' ? 'Visité' :
                         currentVisit?.status === 'absent' ? 'Absent' : 'À visiter'}
                      </Badge>
                      <h2 className="text-xl font-bold mt-2">
                        {currentClient.civilite} {currentClient.nom}
                      </h2>
                      <p className="text-gray-600">{currentClient.prenom}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Adresse</p>
                    <p className="text-gray-600">{currentClient.adresse}</p>
                    <p className="text-gray-600">
                      {currentClient.codePostal} {currentClient.ville}
                    </p>
                  </div>

                  {/* Téléphones */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Contacts</p>
                    {currentClient.portableM && (
                      <a 
                        href={`tel:${currentClient.portableM}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="w-4 h-4" />
                        M. : {formatPhone(currentClient.portableM)}
                      </a>
                    )}
                    {currentClient.portableMme && (
                      <a 
                        href={`tel:${currentClient.portableMme}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="w-4 h-4" />
                        Mme : {formatPhone(currentClient.portableMme)}
                      </a>
                    )}
                    {currentClient.telDomicile && (
                      <a 
                        href={`tel:${currentClient.telDomicile}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="w-4 h-4" />
                        Dom. : {formatPhone(currentClient.telDomicile)}
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions rapides */}
                {currentVisit?.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      className="h-14 bg-green-600 hover:bg-green-700"
                      onClick={() => onMarkCompleted(currentVisit.id)}
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Visité
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-14 border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={() => onMarkAbsent(currentVisit.id)}
                    >
                      <UserX className="w-5 h-5 mr-2" />
                      Absent
                    </Button>
                  </div>
                )}

                {/* Bouton navigation */}
                {currentClient.latitude && currentClient.longitude && (
                  <Button
                    size="lg"
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
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun client sélectionné</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Onglet Notes */}
        {activeTab === 'notes' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="text-center py-8">
              <StickyNote className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-semibold mb-2">Notes de tournée</h3>
              <p className="text-sm text-gray-500 mb-4">
                Enregistrez vos observations et points importants
              </p>
              <Button onClick={onOpenNotes}>
                <StickyNote className="w-4 h-4 mr-2" />
                Ouvrir le carnet
              </Button>
            </div>

            {/* Liste des visites avec statuts */}
            <div className="mt-6 space-y-2">
              <h4 className="font-medium text-sm text-gray-700 mb-3">Résumé des visites</h4>
              {visits.map((visit, index) => {
                const client = clients.find(c => c.id === visit.clientId);
                if (!client) return null;
                
                return (
                  <div 
                    key={visit.id}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      visit.status === 'completed' ? 'bg-green-50' :
                      visit.status === 'absent' ? 'bg-orange-50' :
                      index === currentVisitIndex ? 'bg-blue-50 ring-2 ring-blue-200' :
                      'bg-gray-50'
                    }`}
                    onClick={() => onSelectVisit(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        visit.status === 'completed' ? 'bg-green-500 text-white' :
                        visit.status === 'absent' ? 'bg-orange-500 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.nom}</p>
                        <p className="text-xs text-gray-500">{client.ville}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        visit.status === 'completed' ? 'success' :
                        visit.status === 'absent' ? 'warning' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {visit.status === 'completed' ? 'OK' :
                       visit.status === 'absent' ? 'Absent' : 'En attente'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Onglet Actions */}
        {activeTab === 'actions' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <h3 className="font-semibold">Actions rapides</h3>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-14"
                onClick={onOptimize}
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600 mr-3" />
                ) : (
                  <MapPin className="w-5 h-5 mr-3" />
                )}
                Ré-optimiser l'itinéraire
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-14"
                onClick={onOpenNotes}
              >
                <StickyNote className="w-5 h-5 mr-3" />
                Carnet de notes
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-14"
                onClick={onExitTourMode}
              >
                <Home className="w-5 h-5 mr-3" />
                Retour à l'accueil (sans terminer)
              </Button>

              {tour.status === 'in_progress' && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={onEndTour}
                >
                  <Check className="w-5 h-5 mr-3" />
                  Terminer la tournée
                </Button>
              )}
            </div>

            {/* Statistiques */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm text-gray-700 mb-3">Statistiques</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-xs text-green-700">Visités</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {visits.filter(v => v.status === 'absent').length}
                  </p>
                  <p className="text-xs text-orange-700">Absents</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-600">{pendingVisits.length}</p>
                  <p className="text-xs text-gray-700">Restants</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{progress}%</p>
                  <p className="text-xs text-blue-700">Progression</p>
                </div>
              </div>
              
              {tour.totalDistance && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Distance totale : {formatDistance(tour.totalDistance)}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Navigation bottom - Tabs */}
      <nav className="bg-white border-t flex safe-area-inset-bottom">
        {[
          { id: 'map' as TourModeTab, icon: MapIcon, label: 'Carte' },
          { id: 'client' as TourModeTab, icon: User, label: 'Client' },
          { id: 'notes' as TourModeTab, icon: StickyNote, label: 'Notes' },
          { id: 'actions' as TourModeTab, icon: MoreHorizontal, label: 'Plus' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
