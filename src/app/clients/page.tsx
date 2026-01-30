'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types';
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
import { getClients, updateClient, deleteClient } from '@/lib/storage';
import { geocodeAddress } from '@/lib/geocoding';
import { cleanAddress, formatPhone } from '@/lib/utils';
import {
  ArrowLeft,
  Search,
  MapPin,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw,
  Phone,
  User,
  Filter,
  X,
  Save,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

type FilterType = 'all' | 'geocoded' | 'not_geocoded';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  // Load clients
  useEffect(() => {
    setClients(getClients());
  }, []);

  // Filter and search clients
  useEffect(() => {
    let result = [...clients];

    // Apply filter
    if (filter === 'geocoded') {
      result = result.filter(c => c.latitude && c.longitude);
    } else if (filter === 'not_geocoded') {
      result = result.filter(c => !c.latitude || !c.longitude);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.nom.toLowerCase().includes(term) ||
        c.prenom.toLowerCase().includes(term) ||
        c.ville.toLowerCase().includes(term) ||
        c.adresse.toLowerCase().includes(term) ||
        c.codePostal.includes(term)
      );
    }

    setFilteredClients(result);
  }, [clients, filter, searchTerm]);

  // Open edit dialog
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      civilite: client.civilite,
      nom: client.nom,
      prenom: client.prenom,
      adresse: client.adresse,
      codePostal: client.codePostal,
      ville: client.ville,
      telDomicile: client.telDomicile || '',
      portableM: client.portableM || '',
      portableMme: client.portableMme || '',
    });
  };

  // Save client changes
  const handleSave = async () => {
    if (!editingClient) return;

    // Update client data
    const updated = updateClient(editingClient.id, {
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
      latitude: editingClient.adresse !== editForm.adresse ||
                editingClient.codePostal !== editForm.codePostal ||
                editingClient.ville !== editForm.ville
        ? null : editingClient.latitude,
      longitude: editingClient.adresse !== editForm.adresse ||
                 editingClient.codePostal !== editForm.codePostal ||
                 editingClient.ville !== editForm.ville
        ? null : editingClient.longitude,
    });

    setClients(getClients());
    setEditingClient(null);
  };

  // Geocode a single client
  const handleGeocode = async (client: Client) => {
    setIsGeocoding(true);
    
    const address = cleanAddress(client.adresse, client.codePostal, client.ville);
    const result = await geocodeAddress(address);
    
    if (result) {
      updateClient(client.id, {
        latitude: result.lat,
        longitude: result.lng,
      });
      setClients(getClients());
    } else {
      alert(`Impossible de géolocaliser l'adresse:\n${address}\n\nVérifiez et corrigez l'adresse.`);
    }
    
    setIsGeocoding(false);
  };

  // Delete client
  const handleDelete = (clientId: string) => {
    deleteClient(clientId);
    setClients(getClients());
    setShowDeleteConfirm(null);
  };

  // Stats
  const geocodedCount = clients.filter(c => c.latitude && c.longitude).length;
  const notGeocodedCount = clients.length - geocodedCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">Base de données clients</h1>
                <p className="text-sm text-muted-foreground">
                  {clients.length} clients • {geocodedCount} géolocalisés • {notGeocodedCount} à corriger
                </p>
              </div>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, ville, adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tous ({clients.length})
              </Button>
              <Button
                variant={filter === 'geocoded' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('geocoded')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                OK ({geocodedCount})
              </Button>
              <Button
                variant={filter === 'not_geocoded' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setFilter('not_geocoded')}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                À corriger ({notGeocodedCount})
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Client list */}
      <main className="max-w-7xl mx-auto p-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucun client trouvé</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Modifiez votre recherche' : 'Importez des clients pour commencer'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <Card 
                key={client.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${!client.latitude || !client.longitude ? 'border-orange-300 bg-orange-50/50' : ''}`}
              >
                <Link href={`/clients/${client.id}`}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {client.civilite} {client.nom}
                          </h3>
                          {client.latitude && client.longitude ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{client.prenom}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Address */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p>{client.adresse}</p>
                          <p className="font-medium">{client.codePostal} {client.ville}</p>
                        </div>
                      </div>

                      {/* Phone */}
                      {(client.portableM || client.portableMme || client.telDomicile) && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {formatPhone(client.portableM || client.portableMme || client.telDomicile)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status for non-geocoded */}
                    {(!client.latitude || !client.longitude) && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Adresse à vérifier
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-lg">
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
                onClick={() => setEditingClient(null)}
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
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le client sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
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
