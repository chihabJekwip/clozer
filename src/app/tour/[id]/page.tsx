'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Client, Tour, Visit, AbsentStrategy } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TourProgress from '@/components/tour/TourProgress';
import VisitList from '@/components/tour/VisitList';
import AbsentModal from '@/components/tour/AbsentModal';
import ReportModal from '@/components/tour/ReportModal';
import TourNotesPanel from '@/components/tour/TourNotesPanel';
import TourEndConfirmation from '@/components/tour/TourEndConfirmation';
import TourModeLayout from '@/components/tour/TourModeLayout';
import QuoteForm from '@/components/quote/QuoteForm';
import {
  getClients,
  getTour,
  getVisitsByTour,
  updateTour,
  updateVisit,
  updateVisitsOrder,
  addQuote,
  getSettings,
  addVisitReport,
  getCurrentUser,
} from '@/lib/storage';
import { getFullRoute, getDistanceMatrix } from '@/lib/routing';
import { optimizeTour } from '@/lib/optimization';
import { formatDistance, formatDuration } from '@/lib/utils';
import {
  ArrowLeft,
  Map as MapIcon,
  List,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  FileText,
  Home,
  StickyNote,
  CheckSquare,
  Maximize2,
} from 'lucide-react';

// Import dynamique de la carte pour éviter les erreurs SSR
const TourMap = dynamic(() => import('@/components/map/TourMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

type ViewMode = 'map' | 'list' | 'split';

export default function TourPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;

  const [tour, setTour] = useState<Tour | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentVisitIndex, setCurrentVisitIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentVisit, setAbsentVisit] = useState<Visit | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteClient, setQuoteClient] = useState<Client | null>(null);
  const [estimatedEndTime, setEstimatedEndTime] = useState<Date | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportVisit, setReportVisit] = useState<Visit | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [isTourMode, setIsTourMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-enable Tour Mode on mobile when tour is in progress
  useEffect(() => {
    if (isMobile && tour?.status === 'in_progress') {
      setIsTourMode(true);
    }
  }, [isMobile, tour?.status]);

  // Charger les données
  useEffect(() => {
    const loadData = () => {
      const tourData = getTour(tourId);
      if (!tourData) {
        router.push('/');
        return;
      }

      setTour(tourData);
      setVisits(getVisitsByTour(tourId));
      setClients(getClients());
    };

    loadData();
  }, [tourId, router]);

  // Trouver l'index de la première visite non terminée
  useEffect(() => {
    const pendingIndex = visits.findIndex(
      v => v.status === 'pending' || v.status === 'in_progress'
    );
    if (pendingIndex !== -1) {
      setCurrentVisitIndex(pendingIndex);
    }
  }, [visits]);

  // Calculer l'heure de fin estimée
  useEffect(() => {
    if (!tour || visits.length === 0) return;

    const settings = getSettings();
    const [endHour, endMinute] = settings.workEndTime.split(':').map(Number);
    const workEndTime = new Date();
    workEndTime.setHours(endHour, endMinute, 0, 0);

    const remainingVisits = visits.slice(currentVisitIndex);
    const totalRemainingSeconds = remainingVisits.reduce(
      (sum, v) => sum + (v.durationFromPrevious || 0) + v.estimatedDuration * 60,
      0
    );

    const estimated = new Date(Date.now() + totalRemainingSeconds * 1000);
    setEstimatedEndTime(estimated);
  }, [tour, visits, currentVisitIndex]);

  // Optimiser la tournée
  const handleOptimize = async () => {
    if (!tour || clients.length === 0) return;

    setIsOptimizing(true);

    try {
      // Filtrer les clients de la tournée avec coordonnées
      const tourClients = visits
        .map(v => clients.find(c => c.id === v.clientId))
        .filter((c): c is Client => !!c && !!c.latitude && !!c.longitude);

      if (tourClients.length === 0) {
        setIsOptimizing(false);
        return;
      }

      // Créer les points pour l'optimisation
      const points = tourClients.map(c => ({
        lat: c.latitude!,
        lng: c.longitude!,
      }));

      // Ajouter le point de départ
      const allPoints = [
        { lat: tour.startPoint.lat, lng: tour.startPoint.lng },
        ...points,
      ];

      // Obtenir la matrice des distances
      const matrix = await getDistanceMatrix(allPoints);

      // Optimiser avec ou sans matrice
      const result = optimizeTour(
        tour.startPoint,
        points,
        matrix?.distances
      );

      // Réorganiser les visites selon l'ordre optimal
      const optimizedVisitIds = result.orderedIndices.map(i => {
        const client = tourClients[i];
        const visit = visits.find(v => v.clientId === client.id);
        return visit?.id;
      }).filter((id): id is string => !!id);

      updateVisitsOrder(tourId, optimizedVisitIds);

      // Calculer l'itinéraire complet
      const orderedPoints = [
        tour.startPoint,
        ...result.orderedIndices.map(i => ({
          lat: tourClients[i].latitude!,
          lng: tourClients[i].longitude!,
        })),
        tour.startPoint, // Retour au bureau
      ];

      const routeResult = await getFullRoute(orderedPoints);

      if (routeResult) {
        setRouteGeometry(routeResult.fullGeometry);

        // Mettre à jour les distances et durées des visites
        const updatedVisits = getVisitsByTour(tourId);
        routeResult.segments.forEach((segment, i) => {
          if (i < updatedVisits.length) {
            updateVisit(updatedVisits[i].id, {
              distanceFromPrevious: segment.distance,
              durationFromPrevious: segment.duration,
            });
          }
        });

        // Mettre à jour le tour avec les totaux
        updateTour(tourId, {
          totalDistance: routeResult.totalDistance,
          totalDuration: routeResult.totalDuration,
          status: 'in_progress',
        });
      }

      // Recharger les données
      setTour(getTour(tourId) || null);
      setVisits(getVisitsByTour(tourId));
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Ré-optimiser à partir de la position actuelle du commercial
  const handleOptimizeFromCurrentLocation = async () => {
    if (!tour || clients.length === 0) return;

    setIsOptimizing(true);

    try {
      // Obtenir la position GPS actuelle
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Géolocalisation non supportée'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Filtrer uniquement les visites pending (pas encore faites)
      const pendingVisits = visits.filter(v => v.status === 'pending');
      
      if (pendingVisits.length === 0) {
        alert('Toutes les visites ont été effectuées !');
        setIsOptimizing(false);
        return;
      }

      // Récupérer les clients correspondants
      const pendingClients = pendingVisits
        .map(v => clients.find(c => c.id === v.clientId))
        .filter((c): c is Client => !!c && !!c.latitude && !!c.longitude);

      if (pendingClients.length === 0) {
        setIsOptimizing(false);
        return;
      }

      // Créer les points pour l'optimisation
      const points = pendingClients.map(c => ({
        lat: c.latitude!,
        lng: c.longitude!,
      }));

      // Utiliser la position actuelle comme point de départ
      const allPoints = [currentLocation, ...points];

      // Obtenir la matrice des distances
      const matrix = await getDistanceMatrix(allPoints);

      // Optimiser avec la position actuelle comme départ
      const result = optimizeTour(currentLocation, points, matrix?.distances);

      // Réorganiser les visites pending selon l'ordre optimal
      const optimizedPendingVisitIds = result.orderedIndices.map(i => {
        const client = pendingClients[i];
        const visit = pendingVisits.find(v => v.clientId === client.id);
        return visit?.id;
      }).filter((id): id is string => !!id);

      // Garder les visites déjà complétées en premier, puis ajouter les pending optimisées
      const completedVisitIds = visits
        .filter(v => v.status !== 'pending')
        .map(v => v.id);
      
      const newOrder = [...completedVisitIds, ...optimizedPendingVisitIds];
      updateVisitsOrder(tourId, newOrder);

      // Calculer le nouvel itinéraire
      const orderedPoints = [
        currentLocation,
        ...result.orderedIndices.map(i => ({
          lat: pendingClients[i].latitude!,
          lng: pendingClients[i].longitude!,
        })),
        tour.startPoint, // Retour au bureau
      ];

      const routeResult = await getFullRoute(orderedPoints);

      if (routeResult) {
        setRouteGeometry(routeResult.fullGeometry);

        // Mettre à jour les distances pour les visites pending
        const updatedVisits = getVisitsByTour(tourId);
        const updatedPendingVisits = updatedVisits.filter(v => v.status === 'pending');
        
        routeResult.segments.forEach((segment, i) => {
          if (i < updatedPendingVisits.length) {
            updateVisit(updatedPendingVisits[i].id, {
              distanceFromPrevious: segment.distance,
              durationFromPrevious: segment.duration,
            });
          }
        });

        // Mettre à jour le tour avec les nouveaux totaux
        updateTour(tourId, {
          totalDistance: routeResult.totalDistance,
          totalDuration: routeResult.totalDuration,
        });
      }

      // Recharger les données
      setTour(getTour(tourId) || null);
      setVisits(getVisitsByTour(tourId));
      
      alert('✓ Itinéraire ré-optimisé depuis votre position actuelle !');
    } catch (error: any) {
      console.error('Erreur lors de la ré-optimisation:', error);
      if (error.code === 1) {
        alert('Erreur : Accès à la géolocalisation refusé. Veuillez autoriser l\'accès.');
      } else if (error.code === 2) {
        alert('Erreur : Position indisponible. Vérifiez votre GPS.');
      } else if (error.code === 3) {
        alert('Erreur : Délai dépassé pour obtenir la position.');
      } else {
        alert('Erreur lors de la ré-optimisation : ' + error.message);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  // Ouvrir le modal de rapport avant de terminer la visite
  const handleMarkCompleted = (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      setReportVisit(visit);
      setShowReportModal(true);
    }
  };

  // Sauvegarder le rapport et terminer la visite
  const handleSaveReportAndComplete = (reportContent: string) => {
    if (!reportVisit) return;

    const currentUser = getCurrentUser();
    const client = clients.find(c => c.id === reportVisit.clientId);

    // Sauvegarder le rapport
    addVisitReport({
      visitId: reportVisit.id,
      clientId: reportVisit.clientId,
      content: reportContent,
      createdBy: currentUser?.id || null,
    });

    // Marquer la visite comme terminée
    updateVisit(reportVisit.id, {
      status: 'completed',
      visitedAt: new Date().toISOString(),
    });

    const updatedVisits = getVisitsByTour(tourId);
    setVisits(updatedVisits);

    // Passer à la visite suivante
    const nextPendingIndex = updatedVisits.findIndex(
      v => v.status === 'pending' || v.status === 'in_progress'
    );
    if (nextPendingIndex !== -1) {
      setCurrentVisitIndex(nextPendingIndex);
    }

    // Vérifier si toutes les visites sont terminées
    const allCompleted = updatedVisits.every(
      v => v.status === 'completed' || v.status === 'postponed'
    );
    if (allCompleted) {
      updateTour(tourId, { status: 'completed' });
      setTour(getTour(tourId) || null);
    }

    // Fermer le modal
    setShowReportModal(false);
    setReportVisit(null);
  };

  // Gérer l'absence d'un client
  const handleMarkAbsent = (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      setAbsentVisit(visit);
      setShowAbsentModal(true);
    }
  };

  // Confirmer la stratégie pour client absent
  const handleAbsentStrategy = (strategy: AbsentStrategy, notes?: string) => {
    if (!absentVisit) return;

    if (strategy === 'another_day') {
      // Reporter à un autre jour
      updateVisit(absentVisit.id, {
        status: 'postponed',
        notes: notes || null,
        absentStrategy: strategy,
      });
    } else {
      // Marquer comme absent mais à revisiter
      updateVisit(absentVisit.id, {
        status: 'skipped',
        notes: notes || null,
        absentStrategy: strategy,
      });

      // TODO: Réorganiser les visites selon la stratégie
      // Pour 'after_next': déplacer cette visite juste après la prochaine
      // Pour 'on_return': déplacer cette visite à la fin
    }

    setVisits(getVisitsByTour(tourId));
    setAbsentVisit(null);
    setShowAbsentModal(false);
  };

  // Ouvrir la navigation GPS - avec choix de l'app sur mobile
  const handleNavigate = (client: Client) => {
    if (!client.latitude || !client.longitude) return;

    const label = encodeURIComponent(
      `${client.nom} - ${client.adresse}, ${client.codePostal} ${client.ville}`
    );
    const lat = client.latitude;
    const lng = client.longitude;

    // Détecte le type d'appareil
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isIOS) {
      // Sur iOS, ouvre Apple Maps (qui propose ensuite d'autres apps)
      // maps:// ouvre Apple Maps avec option de choisir une autre app
      window.location.href = `maps://maps.apple.com/?daddr=${lat},${lng}&q=${label}`;
    } else if (isAndroid) {
      // Sur Android, utilise geo: qui ouvre le sélecteur d'apps
      window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    } else {
      // Sur desktop, ouvre Google Maps dans un nouvel onglet
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  // Ouvrir le formulaire de devis
  const handleOpenQuote = (client: Client) => {
    setQuoteClient(client);
    setShowQuoteForm(true);
  };

  // Sauvegarder un devis
  const handleSaveQuote = (quoteData: Parameters<typeof addQuote>[0]) => {
    addQuote(quoteData);
    setShowQuoteForm(false);
    setQuoteClient(null);
  };

  // Demander confirmation pour terminer la tournée
  const handleRequestEndTour = () => {
    setShowEndConfirmation(true);
  };

  // Confirmer la fin de la tournée
  const handleConfirmEndTour = () => {
    updateTour(tourId, { status: 'completed' });
    setTour(getTour(tourId) || null);
    // Rediriger vers la page de rapport
    router.push(`/tour/${tourId}/report`);
  };

  if (!tour) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentVisit = visits[currentVisitIndex];
  const currentClient = currentVisit
    ? clients.find(c => c.id === currentVisit.clientId)
    : null;

  const completedCount = visits.filter(v => v.status === 'completed').length;

  // Affichage du formulaire de devis
  if (showQuoteForm && quoteClient) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQuoteForm(false)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold">Nouveau devis</h1>
              <p className="text-sm text-muted-foreground">
                {quoteClient.nom} {quoteClient.prenom}
              </p>
            </div>
          </div>
        </header>
        <div className="p-4">
          <QuoteForm
            client={quoteClient}
            visitId={currentVisit?.id}
            onSave={handleSaveQuote}
            onCancel={() => setShowQuoteForm(false)}
          />
        </div>
      </div>
    );
  }

  // Mode Tournée - Interface focus mobile
  if (isMobile && isTourMode && tour.status !== 'completed') {
    return (
      <>
        <TourModeLayout
          tour={tour}
          visits={visits}
          clients={clients}
          currentVisitIndex={currentVisitIndex}
          routeGeometry={routeGeometry}
          onNavigate={handleNavigate}
          onMarkCompleted={handleMarkCompleted}
          onMarkAbsent={handleMarkAbsent}
          onOpenNotes={() => setShowNotesPanel(true)}
          onExitTourMode={() => setIsTourMode(false)}
          onEndTour={handleRequestEndTour}
          onOptimize={handleOptimize}
          onOptimizeFromCurrentLocation={handleOptimizeFromCurrentLocation}
          onSelectVisit={setCurrentVisitIndex}
          isOptimizing={isOptimizing}
          completedCount={completedCount}
          totalCount={visits.length}
          mapComponent={
            <TourMap
              clients={clients}
              visits={visits}
              currentVisitIndex={currentVisitIndex}
              routeGeometry={routeGeometry}
              startPoint={tour.startPoint}
              onClientClick={(client) => {
                const visitIndex = visits.findIndex(v => v.clientId === client.id);
                if (visitIndex !== -1) {
                  setCurrentVisitIndex(visitIndex);
                }
              }}
            />
          }
        />
        
        {/* Modals overlay Tour Mode */}
        {absentVisit && (
          <AbsentModal
            open={showAbsentModal}
            onClose={() => {
              setShowAbsentModal(false);
              setAbsentVisit(null);
            }}
            client={clients.find(c => c.id === absentVisit.clientId)!}
            onSelectStrategy={handleAbsentStrategy}
            estimatedExtraTime={{
              afterNext: 8,
              onReturn: 15,
            }}
          />
        )}
        
        {reportVisit && (
          <ReportModal
            open={showReportModal}
            onClose={() => {
              setShowReportModal(false);
              setReportVisit(null);
            }}
            client={clients.find(c => c.id === reportVisit.clientId)!}
            visitId={reportVisit.id}
            onSaveReport={handleSaveReportAndComplete}
          />
        )}
        
        <TourNotesPanel
          open={showNotesPanel}
          onClose={() => setShowNotesPanel(false)}
          tourId={tourId}
          tourName={tour.name}
        />
        
        <TourEndConfirmation
          open={showEndConfirmation}
          onClose={() => setShowEndConfirmation(false)}
          onConfirm={handleConfirmEndTour}
          tourName={tour.name}
          stats={{
            completed: completedCount,
            total: visits.length,
            absent: visits.filter(v => v.status === 'absent').length,
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b p-3 lg:p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm lg:text-lg">{tour.name}</h1>
              <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                <Badge
                  variant={
                    tour.status === 'in_progress' ? 'default' :
                    tour.status === 'completed' ? 'success' : 'secondary'
                  }
                  className="text-xs"
                >
                  {tour.status === 'planning' && 'Planifié'}
                  {tour.status === 'in_progress' && 'En cours'}
                  {tour.status === 'completed' && 'Terminé'}
                  {tour.status === 'paused' && 'En pause'}
                </Badge>
                {tour.totalDistance && (
                  <span>{formatDistance(tour.totalDistance)}</span>
                )}
                {tour.totalDuration && (
                  <span className="hidden lg:inline">• {formatDuration(tour.totalDuration)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions header */}
          <div className="flex items-center gap-2">
            {/* Bouton Mode Tournée - Mobile only */}
            {isMobile && tour.status !== 'completed' && (
              <Button
                size="sm"
                className="lg:hidden bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsTourMode(true)}
              >
                <Maximize2 className="w-4 h-4 mr-1" />
                Mode Focus
              </Button>
            )}
            
            {currentClient && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenQuote(currentClient)}
                className="hidden sm:flex"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden lg:inline">Créer devis</span>
              </Button>
            )}
            <Button
              variant={isOptimizing ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="hidden lg:flex"
            >
              {isOptimizing ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Optimiser</span>
                </>
              )}
            </Button>
            {currentClient && currentClient.latitude && currentClient.longitude && (
              <Button
                size="sm"
                onClick={() => handleNavigate(currentClient)}
                className="hidden lg:flex"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigation
              </Button>
            )}
            {tour.status === 'in_progress' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestEndTour}
                className="text-orange-600 border-orange-300 hover:bg-orange-50 hidden lg:flex"
              >
                <CheckSquare className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Terminer</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-7xl mx-auto w-full">
        <TourProgress
          visits={visits}
          currentIndex={currentVisitIndex}
          totalDistance={tour.totalDistance}
          totalDuration={tour.totalDuration}
          estimatedEndTime={estimatedEndTime}
        />
      </div>

      {/* Toggle vue - Mobile uniquement - Design amélioré */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0 lg:hidden">
        <div className="flex rounded-xl bg-gray-100 p-1 shadow-inner">
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'map' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="w-4 h-4" />
            Carte
          </button>
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'split' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setViewMode('split')}
          >
            Mixte
          </button>
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
            Liste
          </button>
        </div>
      </div>

      {/* Contenu principal - Layout responsive */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Carte - Desktop: toujours visible à gauche, Mobile: selon viewMode */}
        <div
          className={`
            ${viewMode === 'list' ? 'hidden' : ''}
            ${viewMode === 'split' ? 'h-[40vh]' : 'flex-1'}
            lg:flex lg:w-2/3 lg:h-auto
            flex-shrink-0
          `}
        >
          <TourMap
            clients={clients}
            visits={visits}
            currentVisitIndex={currentVisitIndex}
            routeGeometry={routeGeometry}
            startPoint={tour.startPoint}
            onClientClick={(client) => {
              const visitIndex = visits.findIndex(v => v.clientId === client.id);
              if (visitIndex !== -1) {
                setCurrentVisitIndex(visitIndex);
              }
            }}
          />
        </div>

        {/* Liste des visites - Desktop: toujours visible à droite, Mobile: selon viewMode */}
        <div 
          className={`
            ${viewMode === 'map' ? 'hidden' : ''}
            flex-1 overflow-y-auto bg-gray-50
            lg:flex lg:flex-col lg:w-1/3 lg:border-l
          `}
        >
          <VisitList
            visits={visits}
            clients={clients}
            currentIndex={currentVisitIndex}
            onMarkCompleted={handleMarkCompleted}
            onMarkAbsent={handleMarkAbsent}
            onNavigate={handleNavigate}
            onSelectVisit={setCurrentVisitIndex}
          />
        </div>
      </div>

      {/* Boutons flottants - Mobile */}
      <div className="fixed bottom-20 right-4 z-20 flex flex-col gap-3 lg:hidden">
        {/* Bouton Notes - Style visible */}
        <button
          className="rounded-full shadow-xl h-16 w-16 bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 flex items-center justify-center active:scale-95 transition-transform"
          onClick={() => setShowNotesPanel(true)}
        >
          <StickyNote className="w-8 h-8 text-white" strokeWidth={2.5} />
        </button>
        
        {/* Bouton Navigation - Style visible */}
        {currentClient && currentClient.latitude && currentClient.longitude && viewMode !== 'list' && (
          <button
            className="rounded-full shadow-xl h-16 w-16 bg-green-600 hover:bg-green-700 border-2 border-green-400 flex items-center justify-center active:scale-95 transition-transform"
            onClick={() => handleNavigate(currentClient)}
          >
            <Navigation className="w-8 h-8 text-white" strokeWidth={2.5} />
          </button>
        )}
      </div>
      
      {/* Bouton Notes - Desktop */}
      <div className="hidden lg:flex fixed bottom-4 left-4 z-10">
        <Button
          className="shadow-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setShowNotesPanel(true)}
        >
          <StickyNote className="w-5 h-5" />
          Notes de tournée
        </Button>
      </div>

      {/* Modal client absent */}
      {absentVisit && (
        <AbsentModal
          open={showAbsentModal}
          onClose={() => {
            setShowAbsentModal(false);
            setAbsentVisit(null);
          }}
          client={clients.find(c => c.id === absentVisit.clientId)!}
          onSelectStrategy={handleAbsentStrategy}
          estimatedExtraTime={{
            afterNext: 8,
            onReturn: 15,
          }}
        />
      )}

      {/* Modal rapport de visite */}
      {reportVisit && (
        <ReportModal
          open={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportVisit(null);
          }}
          client={clients.find(c => c.id === reportVisit.clientId)!}
          visitId={reportVisit.id}
          onSaveReport={handleSaveReportAndComplete}
        />
      )}

      {/* Panel de notes de tournée */}
      <TourNotesPanel
        open={showNotesPanel}
        onClose={() => setShowNotesPanel(false)}
        tourId={tourId}
        tourName={tour.name}
      />

      {/* Modal de confirmation fin de tournée */}
      <TourEndConfirmation
        open={showEndConfirmation}
        onClose={() => setShowEndConfirmation(false)}
        tourName={tour.name}
        onConfirm={handleConfirmEndTour}
        stats={{
          completed: visits.filter(v => v.status === 'completed').length,
          total: visits.length,
          absent: visits.filter(v => v.status === 'absent' || v.status === 'skipped').length,
        }}
      />
    </div>
  );
}
