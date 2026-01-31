'use client';

import { Client, Visit, VisitStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPhone, formatDistance, formatDuration } from '@/lib/utils';
import {
  Phone,
  MapPin,
  Navigation,
  Check,
  X,
  Clock,
  ChevronRight,
  User,
} from 'lucide-react';

interface VisitCardProps {
  visit: Visit;
  client: Client;
  index: number;
  isActive: boolean;
  onMarkCompleted: () => void;
  onMarkAbsent: () => void;
  onNavigate: () => void;
  onSelect: () => void;
}

const STATUS_CONFIG: Record<VisitStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'pending' | 'destructive' }> = {
  pending: { label: 'À visiter', variant: 'pending' },
  in_progress: { label: 'En cours', variant: 'info' },
  completed: { label: 'Terminé', variant: 'success' },
  absent: { label: 'Absent', variant: 'warning' },
  postponed: { label: 'Reporté', variant: 'pending' },
  skipped: { label: 'Passé', variant: 'warning' },
};

export default function VisitCard({
  visit,
  client,
  index,
  isActive,
  onMarkCompleted,
  onMarkAbsent,
  onNavigate,
  onSelect,
}: VisitCardProps) {
  const statusConfig = STATUS_CONFIG[visit.status];
  const mainPhone = client.portableM || client.portableMme || client.telDomicile;

  return (
    <Card
      className={`
        transition-all cursor-pointer
        ${isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}
        ${visit.status === 'completed' ? 'opacity-60' : ''}
      `}
      onClick={onSelect}
    >
      <CardContent className="p-3 md:p-4">
        {/* En-tête avec numéro et statut */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
              ${isActive ? 'bg-primary' : 'bg-gray-400'}
              ${visit.status === 'completed' ? 'bg-green-500' : ''}
              ${visit.status === 'absent' ? 'bg-orange-500' : ''}
            `}>
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {client.civilite} {client.nom}
              </h3>
              <p className="text-sm text-muted-foreground">{client.prenom}</p>
            </div>
          </div>
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Informations de distance/temps */}
        {(visit.distanceFromPrevious || visit.durationFromPrevious) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            {visit.distanceFromPrevious && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(visit.distanceFromPrevious)}
              </span>
            )}
            {visit.durationFromPrevious && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(visit.durationFromPrevious)}
              </span>
            )}
          </div>
        )}

        {/* Adresse */}
        <div className="flex items-start gap-2 text-sm mb-3">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-muted-foreground">
            {client.adresse}, {client.codePostal} {client.ville}
          </span>
        </div>

        {/* Actions - Affichées seulement pour la visite active */}
        {isActive && visit.status === 'pending' && (
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
            {/* Ligne de téléphone et navigation - Plus grands sur mobile */}
            <div className="flex gap-2">
              {mainPhone && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12 text-base"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${mainPhone}`;
                  }}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Appeler
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12 text-base border-green-500 text-green-600 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate();
                }}
              >
                <Navigation className="w-5 h-5 mr-2" />
                Itinéraire
              </Button>
            </div>

            {/* Boutons de statut - Plus grands et plus visibles */}
            <div className="flex gap-2">
              <Button
                variant="success"
                size="xl"
                className="flex-1 h-14"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkCompleted();
                }}
              >
                <Check className="w-6 h-6 mr-2" />
                Visite terminée
              </Button>
              <Button
                variant="warning"
                size="xl"
                className="flex-1 h-14"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAbsent();
                }}
              >
                <X className="w-6 h-6 mr-2" />
                Absent
              </Button>
            </div>
          </div>
        )}

        {/* Indicateur de sélection pour les visites non actives */}
        {!isActive && visit.status === 'pending' && (
          <div className="flex justify-end mt-2">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
