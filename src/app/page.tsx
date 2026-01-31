'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Tour, AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser } from '@/contexts/UserContext';

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

  // Charger les données au démarrage selon le rôle
  useEffect(() => {
    const loadData = () => {
      const allClientsData = getClients();
      setAllClients(allClientsData);
      
      // Admin voit tout, commercial voit seulement ses clients assignés
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

  // Géocoder les clients sans coordonnées avec fallback intelligent (Admin only)
  const geocodeClients = async () => {
    // Admin géocode tous les clients, pas seulement les siens
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
      
      // Utiliser le géocodage intelligent avec fallback
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
          console.log(`[Fallback] ${client.nom}: utilisé "${smartResult.variantUsed}"`);
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

    // Afficher un rapport détaillé
    let message = `Géocodage terminé !\n\n`;
    message += `📍 Résultats:\n`;
    message += `   • ${stats.exactMatch} adresses exactes trouvées\n`;
    message += `   • ${stats.fallbackMatch} adresses approximatives (centre-ville)\n`;
    message += `   • ${stats.failed} adresses non trouvées\n\n`;
    
    if (stats.failed > 0) {
      message += `❌ Clients à corriger manuellement:\n`;
      stats.failedAddresses.slice(0, 5).forEach(c => {
        message += `   • ${c.nom} (${c.ville})\n`;
      });
      if (stats.failedAddresses.length > 5) {
        message += `   ... et ${stats.failedAddresses.length - 5} autres\n`;
      }
      message += `\n👉 Accédez à "Gérer les clients" pour corriger.`;
    }
    
    if (stats.fallbackMatch > 0) {
      message += `\n\n⚠️ Note: ${stats.fallbackMatch} clients ont été géolocalisés au centre de leur commune (adresse exacte non trouvée).`;
    }

    alert(message);
  };

  // Demander le point de départ avant de créer la tournée manuelle
  const handleRequestCreateTour = () => {
    if (!newTourName.trim() || selectedClients.size === 0) return;
    setPendingSuggestion(null); // Clear any pending suggestion
    setShowStartPointSelector(true);
  };

  // Créer une nouvelle tournée avec le point de départ sélectionné
  const handleCreateTour = (startPoint?: { lat: number; lng: number; address: string }) => {
    if (!newTourName.trim() || selectedClients.size === 0) return;

    const tour = createTour(
      newTourName,
      newTourDate,
      Array.from(selectedClients),
      startPoint || customStartPoint || undefined
    );

    setTours(getTours());
    setShowNewTourDialog(false);
    setNewTourName('');
    setSelectedClients(new Set());
    setCustomStartPoint(null);
    
    // Go to the tour
    router.push(`/tour/${tour.id}`);
  };

  // Toggle sélection client
  const toggleClientSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  // Sélectionner tous les clients avec coordonnées
  const selectAllGeocodedClients = () => {
    const geocoded = clients.filter(c => c.latitude && c.longitude);
    setSelectedClients(new Set(geocoded.map(c => c.id)));
  };

  // Demander le point de départ avant de créer la tournée depuis une suggestion
  const handleRequestCreateFromSuggestion = (suggestion: TourSuggestion) => {
    setPendingSuggestion(suggestion);
    setShowStartPointSelector(true);
  };

  // Créer une tournée depuis une suggestion intelligente avec le point de départ sélectionné
  const handleCreateFromSuggestion = (startPoint?: { lat: number; lng: number; address: string }) => {
    if (!pendingSuggestion) return;
    
    const clientIds = pendingSuggestion.clients.map(c => c.id);
    const tour = createTour(
      pendingSuggestion.name,
      pendingSuggestion.date,
      clientIds,
      startPoint || undefined
    );
    
    setTours(getTours());
    setRefreshKey(prev => prev + 1);
    setPendingSuggestion(null);
    
    // Rediriger vers la page de la tournée
    router.push(`/tour/${tour.id}`);
  };

  // Handler pour le sélecteur de point de départ
  const handleStartPointSelected = (startPoint: { lat: number; lng: number; address: string }) => {
    setCustomStartPoint(startPoint);
    setShowStartPointSelector(false);
    
    if (pendingSuggestion) {
      // Creating from suggestion
      handleCreateFromSuggestion(startPoint);
    } else {
      // Creating manually
      handleCreateTour(startPoint);
    }
  };

  // Vider la base de données (Admin only)
  const handleClearDatabase = () => {
    const confirmed = window.confirm(
      `⚠️ ATTENTION !\n\n` +
      `Vous êtes sur le point de supprimer toutes les données :\n` +
      `• ${allClients.length} clients\n` +
      `• ${tours.length} tournées\n\n` +
      `Cette action est IRRÉVERSIBLE.\n\n` +
      `Voulez-vous continuer ?`
    );
    
    if (confirmed) {
      clearAllData();
      setClients([]);
      setAllClients([]);
      setTours([]);
      setRefreshKey(prev => prev + 1);
      alert('✅ Base de données vidée avec succès.');
    }
  };

  // Stats
  const geocodedCount = clients.filter(c => c.latitude && c.longitude).length;
  const allGeocodedCount = allClients.filter(c => c.latitude && c.longitude).length;
  const activeTours = tours.filter(t => t.status === 'in_progress');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Clozer</h1>
            <p className="text-sm text-primary-foreground/80 flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Shield className="w-3 h-3" />
                  Admin
                </>
              ) : (
                <>
                  Commercial
                </>
              )}
              {currentUser && (
                <span className="ml-1">• {currentUser.name}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-sm text-primary-foreground/80">
              {clients.length} clients • {geocodedCount} géolocalisés
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={handleLogout}
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Layout responsive : 1 colonne mobile, 2 colonnes desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          
          {/* Colonne gauche : Actions et Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{clients.length}</div>
                      <div className="text-xs text-muted-foreground">Clients</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{geocodedCount}</div>
                      <div className="text-xs text-muted-foreground">Géolocalisés</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Actions Admin uniquement */}
                {isAdmin && (
                  <>
                    <Link href="/admin/dashboard" className="block">
                      <Button
                        className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <BarChart3 className="w-5 h-5" />
                        <span>Dashboard KPIs</span>
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => setShowImportDialog(true)}
                    >
                      <Upload className="w-5 h-5" />
                      <span>Importer des clients</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                      onClick={geocodeClients}
                      disabled={isGeocoding || geocodedCount === allClients.length || allClients.length === 0}
                    >
                      {isGeocoding ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Géocodage... {geocodingProgress.current}/{geocodingProgress.total}</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-5 h-5" />
                          <span>Géolocaliser les adresses</span>
                          {allClients.length > 0 && geocodedCount < allClients.length && (
                            <Badge variant="secondary" className="ml-auto">
                              {allClients.length - geocodedCount} restants
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>

                    <Link href="/admin/users" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-12"
                      >
                        <Users className="w-5 h-5" />
                        <span>Gérer les utilisateurs</span>
                      </Button>
                    </Link>

                    <Link href="/admin/assignments" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-12"
                      >
                        <UserPlus className="w-5 h-5" />
                        <span>Assigner les clients</span>
                      </Button>
                    </Link>

                    <Link href="/admin/requests" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-12"
                      >
                        <ClipboardList className="w-5 h-5" />
                        <span>Demandes de réactivation</span>
                      </Button>
                    </Link>
                  </>
                )}

                {/* Mon profil - pour tous les utilisateurs */}
                <Link href="/profile" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                  >
                    <User className="w-5 h-5" />
                    <span>Mon profil</span>
                  </Button>
                </Link>

                {/* Créer tournée - pour tous */}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => setShowNewTourDialog(true)}
                  disabled={geocodedCount === 0}
                >
                  <Plus className="w-5 h-5" />
                  <span>Créer tournée manuellement</span>
                </Button>

                {clients.length > 0 && (
                  <Link href="/clients" className="block">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                    >
                      <Database className="w-5 h-5" />
                      <span>Gérer les clients</span>
                      {clients.length - geocodedCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {clients.length - geocodedCount} à corriger
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )}

                {/* Vider BDD - Admin uniquement */}
                {isAdmin && allClients.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleClearDatabase}
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Vider la base de données</span>
                  </Button>
                )}

                {activeTours.length > 0 && (
                  <Link href={`/tour/${activeTours[0].id}`} className="block">
                    <Button className="w-full justify-start gap-3 h-12">
                      <Play className="w-5 h-5" />
                      <span>Continuer la tournée</span>
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Tournées existantes */}
            {tours.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Tournées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tours.slice(0, 5).map(tour => {
                    const visits = getVisitsByTour(tour.id);
                    const completed = visits.filter(v => v.status === 'completed').length;
                    
                    return (
                      <Link key={tour.id} href={`/tour/${tour.id}`}>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                          <div>
                            <div className="font-medium text-sm">{tour.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {completed}/{visits.length} visites
                            </div>
                          </div>
                          <Badge variant={tour.status === 'in_progress' ? 'default' : 'secondary'}>
                            {tour.status === 'planning' && 'Planifié'}
                            {tour.status === 'in_progress' && 'En cours'}
                            {tour.status === 'completed' && 'Terminé'}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Liste clients (desktop) */}
            {clients.length > 0 && (
              <Card className="hidden lg:block">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Clients</CardTitle>
                    <Link href="/clients">
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        {clients.length} - Voir tous
                      </Badge>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto space-y-1">
                  {clients.slice(0, 10).map(client => (
                    <Link key={client.id} href={`/clients/${client.id}`}>
                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted text-sm cursor-pointer">
                        <div className="truncate">
                          <span className="font-medium">{client.nom}</span>
                          <span className="text-muted-foreground ml-2">{client.ville}</span>
                        </div>
                        {client.latitude && client.longitude ? (
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                        )}
                      </div>
                    </Link>
                  ))}
                  {clients.length > 10 && (
                    <Link href="/clients">
                      <p className="text-sm text-center text-primary hover:underline pt-2">
                        Voir les {clients.length - 10} autres clients
                      </p>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne droite : Suggestions intelligentes (2/3 de l'écran sur desktop) */}
          <div className="lg:col-span-2 space-y-4">
            {/* SUGGESTIONS INTELLIGENTES */}
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
              /* Message si pas de clients */
              <Card className="border-dashed">
                <CardContent className="p-8 lg:p-12 text-center">
                  <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-xl mb-2">Bienvenue dans Clozer</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Commencez par importer votre fichier Excel de clients pour planifier vos tournées commerciales.
                  </p>
                  <Button size="lg" onClick={() => setShowImportDialog(true)}>
                    <Upload className="w-5 h-5 mr-2" />
                    Importer des clients
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Message géolocalisation nécessaire */
              <Card className="border-dashed border-orange-200 bg-orange-50/50">
                <CardContent className="p-8 lg:p-12 text-center">
                  <MapPin className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                  <h3 className="font-semibold text-xl mb-2">Géolocalisation requise</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {clients.length} clients importés. Géolocalisez les adresses pour activer les suggestions intelligentes de tournées.
                  </p>
                  <Button size="lg" onClick={geocodeClients} disabled={isGeocoding}>
                    {isGeocoding ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Géocodage en cours... {geocodingProgress.current}/{geocodingProgress.total}
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5 mr-2" />
                        Géolocaliser {clients.length} clients
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Section mobile uniquement : Liste clients */}
        <div className="lg:hidden mt-4">
          {clients.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Clients</CardTitle>
                  <Link href="/clients">
                    <Badge variant="secondary" className="cursor-pointer">
                      {clients.length} - Voir tous
                    </Badge>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {clients.slice(0, 5).map(client => (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer">
                      <div>
                        <div className="font-medium text-sm">
                          {client.civilite} {client.nom}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client.ville}
                        </div>
                      </div>
                      {client.latitude && client.longitude ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </Link>
                ))}
                {clients.length > 5 && (
                  <Link href="/clients">
                    <p className="text-sm text-center text-primary hover:underline pt-2">
                      Voir les {clients.length - 5} autres clients
                    </p>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Dialog Import */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des clients</DialogTitle>
            <DialogDescription>
              Sélectionnez votre fichier Excel (.xlsx) contenant la liste des clients
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isImporting}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-10 h-10 text-muted-foreground animate-spin mb-2" />
                    <span>Import en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="font-medium">Cliquez pour sélectionner</span>
                    <span className="text-sm text-muted-foreground">
                      ou glissez-déposez un fichier
                    </span>
                  </>
                )}
              </label>
            </div>

            {importErrors.length > 0 && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Erreurs d'import :</p>
                <ul className="list-disc list-inside space-y-1">
                  {importErrors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {importErrors.length > 5 && (
                    <li>+ {importErrors.length - 5} autres erreurs</li>
                  )}
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Colonnes attendues :</p>
              <p>Civilité, Nom, Prénom, Domicile, Portable M., Portable Mme, Adresse, CP, Ville</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouvelle Tournée */}
      <Dialog open={showNewTourDialog} onOpenChange={setShowNewTourDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle tournée</DialogTitle>
            <DialogDescription>
              Créez une tournée en sélectionnant les clients à visiter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom de la tournée</label>
              <Input
                placeholder="Ex: Tournée Cognac"
                value={newTourName}
                onChange={(e) => setNewTourName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={newTourDate}
                onChange={(e) => setNewTourDate(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Clients ({selectedClients.size} sélectionnés)
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllGeocodedClients}
                >
                  Tout sélectionner
                </Button>
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {clients.filter(c => c.latitude && c.longitude).map(client => (
                  <div
                    key={client.id}
                    className={`
                      flex items-center gap-3 p-3 border-b last:border-0 cursor-pointer
                      ${selectedClients.has(client.id) ? 'bg-primary/10' : 'hover:bg-muted'}
                    `}
                    onClick={() => toggleClientSelection(client.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {client.nom} {client.prenom}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {client.ville}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNewTourDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleRequestCreateTour}
                disabled={!newTourName.trim() || selectedClients.size === 0}
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Choisir le départ ({selectedClients.size})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Sélection point de départ */}
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
