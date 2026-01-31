'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Client, User } from '@/types';
import { 
  getClients, 
  getCommerciaux, 
  assignClientsToUser, 
  getUnassignedClients,
  getUser
} from '@/lib/storage';
import { useUser } from '@/contexts/UserContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  ArrowLeft, 
  Search,
  UserPlus,
  Users,
  MapPin,
  Check
} from 'lucide-react';

export default function AdminAssignmentsPage() {
  return (
    <AuthGuard requireAdmin>
      <AssignmentsContent />
    </AuthGuard>
  );
}

function AssignmentsContent() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [commerciaux, setCommerciaux] = useState<User[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [selectedCommercial, setSelectedCommercial] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClients(getClients());
    setCommerciaux(getCommerciaux());
  };

  const filteredClients = clients.filter(client => {
    // Filtre par assignation
    if (filter === 'unassigned' && client.assignedTo) return false;
    if (filter === 'assigned' && !client.assignedTo) return false;

    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        client.nom.toLowerCase().includes(searchLower) ||
        client.prenom.toLowerCase().includes(searchLower) ||
        client.ville.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    }
  };

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleAssign = () => {
    if (selectedClients.size === 0) return;
    
    const userId = selectedCommercial === 'unassign' ? null : selectedCommercial;
    assignClientsToUser(Array.from(selectedClients), userId);
    loadData();
    setSelectedClients(new Set());
    setSelectedCommercial('');
  };

  const getCommercialName = (userId: string | null) => {
    if (!userId) return 'Non assigné';
    const user = getUser(userId);
    return user?.name || 'Inconnu';
  };

  const unassignedCount = clients.filter(c => !c.assignedTo).length;
  const assignedCount = clients.filter(c => c.assignedTo).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Assignation des Clients</h1>
            <p className="text-sm text-gray-500">
              {unassignedCount} non assignés • {assignedCount} assignés
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Barre d'actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou ville..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre */}
              <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unassigned' | 'assigned')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({clients.length})</SelectItem>
                  <SelectItem value="unassigned">Non assignés ({unassignedCount})</SelectItem>
                  <SelectItem value="assigned">Assignés ({assignedCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions d'assignation */}
        {selectedClients.size > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{selectedClients.size} client(s) sélectionné(s)</span>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <Select value={selectedCommercial} onValueChange={setSelectedCommercial}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Assigner à..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassign">
                        <span className="text-gray-500">Désassigner</span>
                      </SelectItem>
                      {commerciaux.map(commercial => (
                        <SelectItem key={commercial.id} value={commercial.id}>
                          {commercial.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAssign}
                    disabled={!selectedCommercial}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assigner
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message si pas de commerciaux */}
        {commerciaux.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium">Aucun commercial enregistré</p>
                <p className="text-sm text-gray-600">
                  Créez d'abord des commerciaux pour pouvoir leur assigner des clients.
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push('/admin/users')}>
                Gérer les utilisateurs
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Liste des clients */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Clients ({filteredClients.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedClients.size === filteredClients.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun client trouvé</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedClients.has(client.id)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectClient(client.id)}
                  >
                    <Checkbox
                      checked={selectedClients.has(client.id)}
                      onCheckedChange={() => handleSelectClient(client.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {client.civilite} {client.nom} {client.prenom}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {client.ville}
                      </div>
                    </div>
                    <div className={`text-sm px-2 py-1 rounded ${
                      client.assignedTo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {getCommercialName(client.assignedTo)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
