'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Tour, AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, StatCard, ListItemCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, SearchInput } from '@/components/ui/input';
import { Badge, StatusBadge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import SmartSuggestions from '@/components/tour/SmartSuggestions';
import StartPointSelector from '@/components/tour/StartPointSelector';
import { TourSuggestion } from '@/lib/smart-planner';
import {
  getClients,
  getTours,
  getVisitsByTour,
  createTour,
  importClients,
  updateClient,
  getSettings,
  clearAllData,
  getClientsByUser,
  getToursByUser,
} from '@/lib/storage';
import { parseExcelFile, readExcelFile } from '@/lib/excel-import';
import { geocodeAddressSmart, GeocodingStats } from '@/lib/geocoding';
import {
  Upload,
  MapPin,
  Users,
  Route,
  Play,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Database,
  Trash2,
  Shield,
  UserPlus,
  LogOut,
  BarChart3,
  Navigation,
  User,
  ClipboardList,
  ChevronRight,
  Target,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser } from '@/contexts/UserContext';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { ThemeToggle } from '@/contexts/ThemeContext';

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

function HomeContent() {
  const router = useRouter();
  const { currentUser, isAdmin, logout } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showNewTourDialog, setShowNewTourDialog] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [newTourName, setNewTourName] = useState('');
  const [newTourDate, setNewTourDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [showStartPointSelector, setShowStartPointSelector] = useState(false);
  const [customStartPoint, setCustomStartPoint] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<TourSuggestion | null>(null);

  // Charger les données
  useEffect(() => {
    const loadData = () => {
      const allClientsData = getClients();
      setAllClients(allClientsData);
      
      if (isAdmin) {
        setClients(allClientsData);
        setTours(getTours());
      } else if (currentUser) {
        setClients(getClientsByUser(currentUser.id));
        setTours(getToursByUser(currentUser.id));
      }
      
      setSettings(getSettings());
      setIsLoading(false);
    };
    loadData();
  }, [isAdmin, currentUser]);

  // Gérer l'import Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportErrors([]);

    try {
      const buffer = await readExcelFile(file);
      const { clients: parsedClients, errors } = parseExcelFile(buffer);

      if (errors.length > 0) {
        setImportErrors(errors);
      }

      if (parsedClients.length > 0) {
        const imported = importClients(parsedClients);
        setClients(imported);
        setShowImportDialog(false);
      }
    } catch (error) {
      setImportErrors([`Erreur: ${error}`]);
    } finally {
      setIsImporting(false);
    }
  };

  // Géocoder les clients
  const geocodeClients = async () => {
    const clientsToGeocode = allClients.filter(c => !c.latitude || !c.longitude);
    if (clientsToGeocode.length === 0) return;

    setIsGeocoding(true);
    setGeocodingProgress({ current: 0, total: clientsToGeocode.length });

    const stats: GeocodingStats = {
      total: clientsToGeocode.length,
      success: 0,
      failed: 0,
      exactMatch: 0,
      fallbackMatch: 0,
      failedAddresses: []
    };

    for (let i = 0; i < clientsToGeocode.length; i++) {
      const client = clientsToGeocode[i];
      
      const smartResult = await geocodeAddressSmart(
        client.adresse, 
        client.codePostal, 
        client.ville
      );
      
      if (smartResult.result) {
        updateClient(client.id, {
          latitude: smartResult.result.lat,
          longitude: smartResult.result.lng,
        });
        stats.success++;
        
        if (smartResult.isFallback) {
          stats.fallbackMatch++;
        } else {
          stats.exactMatch++;
        }
      } else {
        stats.failed++;
        stats.failedAddresses.push({
          nom: client.nom,
          ville: client.ville,
          adresse: client.adresse
        });
      }

      setGeocodingProgress({ current: i + 1, total: clientsToGeocode.length });
    }

    // Recharger les clients
    const allClientsData = getClients();
    setAllClients(allClientsData);
    if (isAdmin) {
      setClients(allClientsData);
    } else if (currentUser) {
      setClients(getClientsByUser(currentUser.id));
    }
    setIsGeocoding(false);

    // Afficher un rapport
    let message = `Géocodage terminé !\n\n📍 ${stats.exactMatch} exactes | ${stats.fallbackMatch} approximatives | ${stats.failed} échecs`;
    if (stats.failed > 0) {
      message += `\n\n${stats.failedAddresses.slice(0, 3).map(c => `• ${c.nom}`).join('\n')}`;
    }
    alert(message);
  };

  // Créer une tournée
  const handleRequestCreateTour = () => {
    if (!newTourName.trim() || selectedClients.size === 0) return;
    setPendingSuggestion(null);
    setShowStartPointSelector(true);
  };

  const handleCreateTour = (startPoint?: { lat: number; lng: number; address: string }) => {
    if (!newTourName.trim() || selectedClients.size === 0) return;

    const tour = createTour(
      newTourName,
      newTourDate,
      Array.from(selectedClients),
      startPoint || customStartPoint || undefined
    );

    if (isAdmin) {
      setTours(getTours());
    } else if (currentUser) {
      setTours(getToursByUser(currentUser.id));
    }
    
    setShowNewTourDialog(false);
    setNewTourName('');
    setSelectedClients(new Set());
    setCustomStartPoint(null);
    
    router.push(`/tour/${tour.id}`);
  };

  const toggleClientSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  const selectAllGeocodedClients = () => {
    const geocoded = clients.filter(c => c.latitude && c.longitude);
    setSelectedClients(new Set(geocoded.map(c => c.id)));
  };

  const handleRequestCreateFromSuggestion = (suggestion: TourSuggestion) => {
    setPendingSuggestion(suggestion);
    setShowStartPointSelector(true);
  };

  const handleCreateFromSuggestion = (startPoint?: { lat: number; lng: number; address: string }) => {
    if (!pendingSuggestion) return;
    
    const clientIds = pendingSuggestion.clients.map(c => c.id);
    const tour = createTour(
      pendingSuggestion.name,
      pendingSuggestion.date,
      clientIds,
      startPoint || undefined
    );
    
    if (isAdmin) {
      setTours(getTours());
    } else if (currentUser) {
      setTours(getToursByUser(currentUser.id));
    }
    
    setRefreshKey(prev => prev + 1);
    setPendingSuggestion(null);
    
    router.push(`/tour/${tour.id}`);
  };

  const handleStartPointSelected = (startPoint: { lat: number; lng: number; address: string }) => {
    setCustomStartPoint(startPoint);
    setShowStartPointSelector(false);
    
    if (pendingSuggestion) {
      handleCreateFromSuggestion(startPoint);
    } else {
      handleCreateTour(startPoint);
    }
  };

  const handleClearDatabase = async () => {
    const confirmed = window.confirm(
      `⚠️ ATTENTION !\n\nSupprimer toutes les données ?\n• ${allClients.length} clients\n• ${tours.length} tournées\n• Toutes les visites et notes\n\nCette action est IRRÉVERSIBLE.`
    );
    
    if (confirmed) {
      await clearAllData();
      setClients([]);
      setAllClients([]);
      setTours([]);
      setRefreshKey(prev => prev + 1);
      alert('✅ Base de données vidée (clients, tournées, visites, notes).');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Stats
  const geocodedCount = clients.filter(c => c.latitude && c.longitude).length;
  const allGeocodedCount = allClients.filter(c => c.latitude && c.longitude).length;
  const activeTours = tours.filter(t => t.status === 'in_progress' || t.status === 'planning');
  const hasActiveTour = activeTours.some(t => t.status === 'in_progress');
  const activeTour = activeTours.find(t => t.status === 'in_progress');

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex-center animate-pulse">
            <Route className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-text w-32 mx-auto" />
            <div className="skeleton-text w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* ===== MOBILE HEADER ===== */}
      <header className="header-glass lg:hidden">
        <div className="container-app h-16 flex-between">
          {/* Logo & User */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex-center shadow-lg shadow-blue-500/20">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Clozer</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {isAdmin && <Shield className="w-3 h-3" />}
                {currentUser?.name || 'Utilisateur'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationsPanel />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="container-app py-6 space-y-6">
        
        {/* Active Tour Banner - Mobile Priority */}
        {activeTour && (
          <Link href={`/tour/${activeTour.id}`}>
            <Card variant="glass" className="overflow-hidden animate-fade-in-up">
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex-center flex-shrink-0">
                    <Play className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-blue-100 font-medium">Tournée en cours</p>
                    <h3 className="text-lg font-bold text-white truncate">{activeTour.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-blue-100">
                        {getVisitsByTour(activeTour.id).filter(v => v.status === 'completed').length} / {getVisitsByTour(activeTour.id).length} visites
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-white flex-center">
                      <ChevronRight className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Stats Grid - Horizontal Scroll on Mobile */}
        <div className="overflow-x-scroll-snap -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-max sm:min-w-0">
            <StatCard
              title="Clients"
              value={clients.length}
              subtitle={isAdmin ? "Total" : "Assignés"}
              icon={<Users className="w-5 h-5" />}
              variant="primary"
              className="w-40 sm:w-auto snap-start"
            />
            <StatCard
              title="Géolocalisés"
              value={geocodedCount}
              subtitle={`${Math.round((geocodedCount / Math.max(clients.length, 1)) * 100)}%`}
              icon={<MapPin className="w-5 h-5" />}
              variant="success"
              className="w-40 sm:w-auto snap-start"
            />
            <StatCard
              title="Tournées"
              value={tours.length}
              subtitle={`${activeTours.length} actives`}
              icon={<Route className="w-5 h-5" />}
              variant="info"
              className="w-40 sm:w-auto snap-start"
            />
            <StatCard
              title="Ce mois"
              value={tours.filter(t => {
                const tourDate = new Date(t.date);
                const now = new Date();
                return tourDate.getMonth() === now.getMonth() && tourDate.getFullYear() === now.getFullYear();
              }).length}
              subtitle="Tournées"
              icon={<Calendar className="w-5 h-5" />}
              variant="warning"
              className="w-40 sm:w-auto snap-start"
            />
          </div>
        </div>

        {/* Main Grid - 2 columns on desktop */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column - Actions */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                
                {/* Primary Action - New Tour */}
                <Button 
                  variant="gradient"
                  className="w-full h-12 justify-start"
                  onClick={() => setShowNewTourDialog(true)}
                  disabled={geocodedCount === 0}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Nouvelle tournée
                </Button>

                {/* Geocode if needed */}
                {allClients.length > allGeocodedCount && isAdmin && (
                  <Button
                    variant="subtle-warning"
                    className="w-full h-12 justify-start"
                    onClick={geocodeClients}
                    disabled={isGeocoding}
                  >
                    {isGeocoding ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                        {geocodingProgress.current}/{geocodingProgress.total}
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5 mr-3" />
                        Géolocaliser ({allClients.length - allGeocodedCount})
                      </>
                    )}
                  </Button>
                )}

                {/* Admin Actions */}
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full h-11 justify-start"
                      onClick={() => setShowImportDialog(true)}
                    >
                      <Upload className="w-4 h-4 mr-3" />
                      Importer clients
                    </Button>

                    <Link href="/admin/assignments" className="block">
                      <Button variant="outline" className="w-full h-11 justify-start">
                        <UserPlus className="w-4 h-4 mr-3" />
                        Assigner clients
                      </Button>
                    </Link>

                    <Link href="/admin/requests" className="block">
                      <Button variant="outline" className="w-full h-11 justify-start">
                        <ClipboardList className="w-4 h-4 mr-3" />
                        Demandes
                      </Button>
                    </Link>
                  </>
                )}

                {/* View Clients */}
                <Link href="/clients" className="block">
                  <Button variant="outline" className="w-full h-11 justify-start">
                    <Database className="w-4 h-4 mr-3" />
                    Voir les clients
                    {clients.length - geocodedCount > 0 && (
                      <Badge variant="warning" className="ml-auto">
                        {clients.length - geocodedCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Tours */}
            {tours.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex-between">
                    <CardTitle className="text-base">Tournées récentes</CardTitle>
                    <Link href="/tours">
                      <Badge variant="secondary" className="cursor-pointer">
                        Voir tout
                      </Badge>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tours.slice(0, 4).map(tour => {
                    const visits = getVisitsByTour(tour.id);
                    const completed = visits.filter(v => v.status === 'completed').length;
                    const progress = visits.length > 0 ? Math.round((completed / visits.length) * 100) : 0;
                    
                    return (
                      <Link key={tour.id} href={`/tour/${tour.id}`}>
                        <div className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                          <div className="flex-between mb-2">
                            <span className="font-medium text-sm truncate">{tour.name}</span>
                            <StatusBadge status={tour.status} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {completed}/{visits.length}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Danger Zone - Admin */}
            {isAdmin && allClients.length > 0 && (
              <Button
                variant="subtle-danger"
                className="w-full h-11 justify-start"
                onClick={handleClearDatabase}
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Vider la base de données
              </Button>
            )}
          </div>

          {/* Right Column - Smart Suggestions */}
          <div className="lg:col-span-2">
            {geocodedCount > 0 ? (
              <SmartSuggestions 
                key={refreshKey}
                onCreateTour={handleRequestCreateFromSuggestion}
                userId={isAdmin ? undefined : currentUser?.id}
                onRefresh={() => {
                  const allClientsData = getClients();
                  setAllClients(allClientsData);
                  if (isAdmin) {
                    setClients(allClientsData);
                    setTours(getTours());
                  } else if (currentUser) {
                    setClients(getClientsByUser(currentUser.id));
                    setTours(getToursByUser(currentUser.id));
                  }
                }}
              />
            ) : clients.length === 0 ? (
              <Card variant="outlined" className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="empty-state-icon mx-auto mb-4">
                    <FileSpreadsheet className="w-full h-full" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Bienvenue dans Clozer</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Importez votre fichier Excel de clients pour commencer à planifier vos tournées.
                  </p>
                  {isAdmin && (
                    <Button size="lg" onClick={() => setShowImportDialog(true)}>
                      <Upload className="w-5 h-5 mr-2" />
                      Importer des clients
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex-center">
                    <MapPin className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Géolocalisation requise</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {clients.length} clients importés. Géolocalisez les adresses pour activer les suggestions.
                  </p>
                  {isAdmin && (
                    <Button 
                      size="lg" 
                      variant="warning"
                      onClick={geocodeClients} 
                      disabled={isGeocoding}
                    >
                      {isGeocoding ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          {geocodingProgress.current}/{geocodingProgress.total}
                        </>
                      ) : (
                        <>
                          <MapPin className="w-5 h-5 mr-2" />
                          Géolocaliser
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* ===== DIALOGS ===== */}
      
      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importer des clients</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier Excel (.xlsx)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isImporting}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {isImporting ? (
                  <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground animate-spin mb-3" />
                ) : (
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                )}
                <p className="font-medium">{isImporting ? 'Import en cours...' : 'Cliquez pour sélectionner'}</p>
                <p className="text-sm text-muted-foreground mt-1">ou glissez-déposez</p>
              </label>
            </div>

            {importErrors.length > 0 && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
                <p className="font-medium mb-2">Erreurs :</p>
                <ul className="list-disc list-inside space-y-1">
                  {importErrors.slice(0, 3).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Colonnes : Civilité, Nom, Prénom, Domicile, Portable M., Portable Mme, Adresse, CP, Ville
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Tour Dialog */}
      <Dialog open={showNewTourDialog} onOpenChange={setShowNewTourDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle tournée</DialogTitle>
            <DialogDescription>
              Sélectionnez les clients à visiter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom de la tournée</label>
              <Input
                placeholder="Ex: Tournée Cognac"
                value={newTourName}
                onChange={(e) => setNewTourName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={newTourDate}
                onChange={(e) => setNewTourDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex-between">
                <label className="text-sm font-medium">
                  Clients ({selectedClients.size})
                </label>
                <Button variant="ghost" size="sm" onClick={selectAllGeocodedClients}>
                  Tout sélectionner
                </Button>
              </div>

              <div className="border rounded-xl max-h-60 overflow-y-auto divide-y">
                {clients.filter(c => c.latitude && c.longitude).map(client => (
                  <div
                    key={client.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      selectedClients.has(client.id) ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleClientSelection(client.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{client.nom} {client.prenom}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.ville}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNewTourDialog(false)} className="flex-1">
                Annuler
              </Button>
              <Button
                variant="gradient"
                onClick={handleRequestCreateTour}
                disabled={!newTourName.trim() || selectedClients.size === 0}
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Continuer ({selectedClients.size})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Point Selector */}
      {currentUser && (
        <StartPointSelector
          open={showStartPointSelector}
          onClose={() => {
            setShowStartPointSelector(false);
            setPendingSuggestion(null);
          }}
          userId={currentUser.id}
          onSelect={handleStartPointSelected}
        />
      )}
    </div>
  );
}
