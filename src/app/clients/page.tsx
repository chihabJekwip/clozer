'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { Badge, StatusBadge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getClients, updateClient, deleteClient, getClientsByUser } from '@/lib/storage';
import { geocodeAddress } from '@/lib/geocoding';
import { cleanAddress, formatPhone } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  AlertCircle,
  Trash2,
  Phone,
  User,
  Save,
  ChevronRight,
  UserX,
  Filter,
  X,
  Navigation,
  Edit3,
  MoreVertical,
} from 'lucide-react';
import { ClientStatusIcon, AvailabilityIcon } from '@/components/client/ClientStatusBadge';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'geocoded' | 'not_geocoded' | 'active' | 'inactive';

const filterConfig = {
  all: { label: 'Tous', icon: null, color: 'default' },
  active: { label: 'Actifs', icon: CheckCircle, color: 'success' },
  inactive: { label: 'Inactifs', icon: UserX, color: 'secondary' },
  geocoded: { label: 'GPS OK', icon: MapPin, color: 'info' },
  not_geocoded: { label: 'À géolocaliser', icon: AlertCircle, color: 'warning' },
};

export default function ClientsPage() {
  return (
    <AuthGuard>
      <ClientsContent />
    </AuthGuard>
  );
}

function ClientsContent() {
  const router = useRouter();
  const { currentUser, isAdmin } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load clients based on user role
  useEffect(() => {
    if (isAdmin) {
      setClients(getClients());
    } else if (currentUser) {
      setClients(getClientsByUser(currentUser.id));
    }
  }, [isAdmin, currentUser]);

  // Filtered and searched clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Apply filter
    switch (filter) {
      case 'geocoded':
        result = result.filter(c => c.latitude && c.longitude);
        break;
      case 'not_geocoded':
        result = result.filter(c => !c.latitude || !c.longitude);
        break;
      case 'active':
        result = result.filter(c => c.status === 'active');
        break;
      case 'inactive':
        result = result.filter(c => c.status === 'inactive');
        break;
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

    return result;
  }, [clients, filter, searchTerm]);

  // Stats
  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    geocoded: clients.filter(c => c.latitude && c.longitude).length,
    notGeocoded: clients.filter(c => !c.latitude || !c.longitude).length,
  }), [clients]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="header-glass">
        <div className="container-app">
          {/* Top row */}
          <div className="h-16 flex-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">Clients</h1>
                <p className="text-xs text-muted-foreground">
                  {filteredClients.length} sur {stats.total}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-5 h-5" />
                {filter !== 'all' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="pb-4">
            <SearchInput
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>

          {/* Filter pills */}
          {showFilters && (
            <div className="pb-4 overflow-x-scroll-snap -mx-4 px-4 animate-fade-in-down">
              <div className="flex gap-2 min-w-max">
                {(Object.keys(filterConfig) as FilterType[]).map((key) => {
                  const config = filterConfig[key];
                  const Icon = config.icon;
                  const count = key === 'all' ? stats.total :
                               key === 'active' ? stats.active :
                               key === 'inactive' ? stats.inactive :
                               key === 'geocoded' ? stats.geocoded : stats.notGeocoded;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                        "border-2 whitespace-nowrap",
                        filter === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {config.label}
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-xs",
                        filter === key ? "bg-primary text-primary-foreground" : "bg-background"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Client list */}
      <main className="container-app py-4">
        {filteredClients.length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-state-icon">
              <User className="w-full h-full" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun client trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Modifiez votre recherche' : 'Importez des clients pour commencer'}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Effacer la recherche
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Client Card Component
function ClientCard({ client }: { client: Client }) {
  const isInactive = client.status === 'inactive';
  const hasGPS = client.latitude && client.longitude;
  
  return (
    <Link href={`/clients/${client.id}`}>
      <Card 
        variant="interactive"
        className={cn(
          isInactive && "opacity-60"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex-center flex-shrink-0",
              isInactive 
                ? "bg-gray-100 dark:bg-gray-800" 
                : hasGPS 
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-500" 
                  : "bg-gradient-to-br from-amber-400 to-orange-500"
            )}>
              {isInactive ? (
                <UserX className="w-5 h-5 text-gray-400" />
              ) : hasGPS ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={cn(
                      "font-semibold truncate",
                      isInactive && "text-muted-foreground"
                    )}>
                      {client.civilite} {client.nom}
                    </h3>
                    <AvailabilityIcon profile={client.availabilityProfile} />
                  </div>
                  <p className="text-sm text-muted-foreground">{client.prenom}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
              </div>

              {/* Address */}
              <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">
                  {client.codePostal} {client.ville}
                </span>
              </div>

              {/* Phone & Status */}
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {(client.portableM || client.portableMme) && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {formatPhone(client.portableM || client.portableMme || '')}
                  </span>
                )}
                
                {isInactive && (
                  <Badge variant="inactive" size="sm">
                    Inactif
                  </Badge>
                )}
                
                {!hasGPS && !isInactive && (
                  <Badge variant="warning" size="sm">
                    GPS manquant
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
