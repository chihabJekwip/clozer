'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Client, Visit, Quote, Tour } from '@/types';
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
import {
  getClient,
  getClients,
  updateClient,
  deleteClient,
  getVisits,
  getTours,
  getQuotesByClient,
} from '@/lib/storage';
import { geocodeAddressSmart } from '@/lib/geocoding';
import { formatPhone, formatDate, formatTime }from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw,
  Phone,
  User,
  Save,
  Calendar,
  Clock,
  FileText,
  Eye,
  Home,
  Navigation,
  History,
  Receipt,
  XCircle,
  CheckCircle2,
  CircleDashed,
} from 'lucide-react';
import Link from 'next/link';

interface ClientVisitHistory {
  visit: Visit;
  tour: Tour | undefined;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [visitHistory, setVisitHistory] = useState<ClientVisitHistory[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    civilite: '',
    nom: '',
    prenom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telDomicile: '',
    portableM: '',
    portableMme: '',
  });

  // Load client data
  useEffect(() => {
    const loadData = () => {
      const clientData = getClient(clientId);
      if (!clientData) {
        router.push('/clients');
        return;
      }

      setClient(clientData);

      // Initialize edit form
      setEditForm({
        civilite: clientData.civilite,
        nom: clientData.nom,
        prenom: clientData.prenom,
        adresse: clientData.adresse,
        codePostal: clientData.codePostal,
        ville: clientData.ville,
        telDomicile: clientData.telDomicile || '',
        portableM: clientData.portableM || '',
        portableMme: clientData.portableMme || '',
      });

      // Get visit history
      const allVisits = getVisits();
      const allTours = getTours();
      const clientVisits = allVisits
        .filter(v => v.clientId === clientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(visit => ({
          visit,
          tour: allTours.find(t => t.id === visit.tourId),
        }));
      setVisitHistory(clientVisits);

      // Get quotes
      const clientQuotes = getQuotesByClient(clientId);
      setQuotes(clientQuotes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));

      setIsLoading(false);
    };

    loadData();
  }, [clientId, router]);

  // Save client changes
  const handleSave = async () => {
    if (!client) return;

    const addressChanged = 
      client.adresse !== editForm.adresse ||
      client.codePostal !== editForm.codePostal ||
      client.ville !== editForm.ville;

    updateClient(client.id, {
      civilite: editForm.civilite,
      nom: editForm.nom,
      prenom: editForm.prenom,
      adresse: editForm.adresse,
      codePostal: editForm.codePostal,
      ville: editForm.ville,
      telDomicile: editForm.telDomicile || null,
      portableM: editForm.portableM || null,
      portableMme: editForm.portableMme || null,
      // Reset coordinates if address changed
      latitude: addressChanged ? null : client.latitude,
      longitude: addressChanged ? null : client.longitude,
    });

    setClient(getClient(clientId) || null);
    setIsEditing(false);
  };

  // Geocode client
  const handleGeocode = async () => {
    if (!client) return;
    
    setIsGeocoding(true);
    
    const result = await geocodeAddressSmart(
      client.adresse,
      client.codePostal,
      client.ville
    );
    
    if (result.result) {
      updateClient(client.id, {
        latitude: result.result.lat,
        longitude: result.result.lng,
      });
      setClient(getClient(clientId) || null);
      
      if (result.isFallback) {
        alert(`Adresse géolocalisée avec approximation (centre de ${client.ville}).`);
      }
    } else {
      alert(`Impossible de géolocaliser l'adresse.\nVérifiez et corrigez l'adresse.`);
    }
    
    setIsGeocoding(false);
  };

  // Delete client
  const handleDelete = () => {
    deleteClient(clientId);
    router.push('/clients');
  };

  // Navigate to client location
  const openNavigation = () => {
    if (!client) return;
    const address = `${client.adresse}, ${client.codePostal} ${client.ville}, France`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  // Get visit status badge
  const getVisitStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Terminée</Badge>;
      case 'absent':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />En cours</Badge>;
      default:
        return <Badge variant="secondary"><CircleDashed className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  // Get quote status badge
  const getQuoteStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500">Accepté</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusé</Badge>;
      case 'sent':
        return <Badge className="bg-blue-500">Envoyé</Badge>;
      default:
        return <Badge variant="secondary">Brouillon</Badge>;
    }
  };

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

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      {/* Header */}
      <header className="bg-white border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/clients')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-lg">
                    {client.civilite} {client.nom} {client.prenom}
                  </h1>
                  {client.latitude && client.longitude ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {client.ville}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Client Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{client.adresse}</p>
                <p className="text-muted-foreground">{client.codePostal} {client.ville}</p>
                {(!client.latitude || !client.longitude) && (
                  <p className="text-orange-600 text-sm mt-1">⚠️ Adresse non géolocalisée</p>
                )}
              </div>
              <div className="flex gap-2">
                {(!client.latitude || !client.longitude) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                  >
                    {isGeocoding ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-1" />
                        Géolocaliser
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openNavigation}
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Itinéraire
                  </Button>
                )}
              </div>
            </div>

            {/* Phone numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {client.telDomicile && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Domicile</p>
                    <a 
                      href={`tel:${client.telDomicile}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {formatPhone(client.telDomicile)}
                    </a>
                  </div>
                </div>
              )}
              {client.portableM && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Portable M.</p>
                    <a 
                      href={`tel:${client.portableM}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {formatPhone(client.portableM)}
                    </a>
                  </div>
                </div>
              )}
              {client.portableMme && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Portable Mme</p>
                    <a 
                      href={`tel:${client.portableMme}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {formatPhone(client.portableMme)}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* No phone numbers */}
            {!client.telDomicile && !client.portableM && !client.portableMme && (
              <p className="text-sm text-muted-foreground italic">
                Aucun numéro de téléphone enregistré
              </p>
            )}
          </CardContent>
        </Card>

        {/* Visit History Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                Historique des visites
              </CardTitle>
              <Badge variant="secondary">{visitHistory.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {visitHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune visite enregistrée</p>
                <p className="text-sm">Ce client n'a pas encore été visité</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitHistory.map(({ visit, tour }) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-bold">
                          {new Date(visit.createdAt).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {new Date(visit.createdAt).toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">
                          {tour?.name || 'Tournée supprimée'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {visit.visitedAt 
                            ? formatTime(visit.visitedAt)
                            : 'Non visité'
                          }
                          {visit.notes && (
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                              Note
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVisitStatusBadge(visit.status)}
                      {tour && (
                        <Link href={`/tour/${tour.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quotes Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Devis
              </CardTitle>
              <Badge variant="secondary">{quotes.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun devis</p>
                <p className="text-sm">Créez un devis lors d'une visite</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-bold">
                          {new Date(quote.createdAt).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {new Date(quote.createdAt).toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">
                          Devis #{quote.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {quote.items.length} article(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {quote.totalTTC.toFixed(2)} €
                        </p>
                        <p className="text-xs text-muted-foreground">TTC</p>
                      </div>
                      {getQuoteStatusBadge(quote.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {visitHistory.filter(v => v.visit.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Visites réussies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">
                  {visitHistory.filter(v => v.visit.status === 'absent').length}
                </div>
                <div className="text-xs text-muted-foreground">Absences</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {quotes.filter(q => q.status === 'accepted').length}
                </div>
                <div className="text-xs text-muted-foreground">Devis acceptés</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Corrigez les informations du client. L'adresse sera re-géolocalisée si modifiée.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Civilité</label>
                <Input
                  value={editForm.civilite}
                  onChange={(e) => setEditForm({ ...editForm, civilite: e.target.value })}
                  placeholder="M."
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Nom</label>
                <Input
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Prénom</label>
              <Input
                value={editForm.prenom}
                onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
              />
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Adresse (utilisée pour la géolocalisation)
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Adresse</label>
                  <Input
                    value={editForm.adresse}
                    onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                    placeholder="12 rue de la République"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Code postal</label>
                    <Input
                      value={editForm.codePostal}
                      onChange={(e) => setEditForm({ ...editForm, codePostal: e.target.value })}
                      placeholder="16000"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Ville</label>
                    <Input
                      value={editForm.ville}
                      onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                      placeholder="Angoulême"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Tél. domicile</label>
                <Input
                  value={editForm.telDomicile}
                  onChange={(e) => setEditForm({ ...editForm, telDomicile: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Portable M.</label>
                <Input
                  value={editForm.portableM}
                  onChange={(e) => setEditForm({ ...editForm, portableM: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Portable Mme</label>
                <Input
                  value={editForm.portableMme}
                  onChange={(e) => setEditForm({ ...editForm, portableMme: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le client "{client.nom}" sera définitivement supprimé, 
              ainsi que son historique de visites.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
