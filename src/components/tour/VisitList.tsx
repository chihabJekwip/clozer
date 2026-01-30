'use client';

import { Client, Visit } from '@/types';
import VisitCard from './VisitCard';

interface VisitListProps {
  visits: Visit[];
  clients: Client[];
  currentIndex: number;
  onMarkCompleted: (visitId: string) => void;
  onMarkAbsent: (visitId: string) => void;
  onNavigate: (client: Client) => void;
  onSelectVisit: (index: number) => void;
}

export default function VisitList({
  visits,
  clients,
  currentIndex,
  onMarkCompleted,
  onMarkAbsent,
  onNavigate,
  onSelectVisit,
}: VisitListProps) {
  // Créer un mapping clientId -> Client
  const clientMap = new Map<string, Client>();
  clients.forEach(c => clientMap.set(c.id, c));

  // Séparer les visites en catégories pour un meilleur affichage
  const activeVisit = visits[currentIndex];
  const upcomingVisits = visits.slice(currentIndex + 1).filter(v => v.status === 'pending');
  const completedVisits = visits.filter(v => v.status === 'completed');
  const absentVisits = visits.filter(v => v.status === 'absent' || v.status === 'skipped');

  return (
    <div className="space-y-4 p-4">
      {/* Visite en cours */}
      {activeVisit && clientMap.get(activeVisit.clientId) && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Prochaine visite
          </h3>
          <VisitCard
            visit={activeVisit}
            client={clientMap.get(activeVisit.clientId)!}
            index={currentIndex}
            isActive={true}
            onMarkCompleted={() => onMarkCompleted(activeVisit.id)}
            onMarkAbsent={() => onMarkAbsent(activeVisit.id)}
            onNavigate={() => {
              const client = clientMap.get(activeVisit.clientId);
              if (client) onNavigate(client);
            }}
            onSelect={() => onSelectVisit(currentIndex)}
          />
        </div>
      )}

      {/* Visites à venir */}
      {upcomingVisits.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Visites suivantes ({upcomingVisits.length})
          </h3>
          <div className="space-y-2">
            {upcomingVisits.map((visit) => {
              const client = clientMap.get(visit.clientId);
              const globalIndex = visits.findIndex(v => v.id === visit.id);
              
              if (!client) return null;
              
              return (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  client={client}
                  index={globalIndex}
                  isActive={false}
                  onMarkCompleted={() => onMarkCompleted(visit.id)}
                  onMarkAbsent={() => onMarkAbsent(visit.id)}
                  onNavigate={() => onNavigate(client)}
                  onSelect={() => onSelectVisit(globalIndex)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Clients absents à revisiter */}
      {absentVisits.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-orange-600 mb-2 uppercase tracking-wide">
            À revisiter ({absentVisits.length})
          </h3>
          <div className="space-y-2">
            {absentVisits.map((visit) => {
              const client = clientMap.get(visit.clientId);
              const globalIndex = visits.findIndex(v => v.id === visit.id);
              
              if (!client) return null;
              
              return (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  client={client}
                  index={globalIndex}
                  isActive={false}
                  onMarkCompleted={() => onMarkCompleted(visit.id)}
                  onMarkAbsent={() => {}}
                  onNavigate={() => onNavigate(client)}
                  onSelect={() => onSelectVisit(globalIndex)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Visites terminées */}
      {completedVisits.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-green-600 mb-2 uppercase tracking-wide">
            Terminées ({completedVisits.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completedVisits.slice(0, 3).map((visit) => {
              const client = clientMap.get(visit.clientId);
              const globalIndex = visits.findIndex(v => v.id === visit.id);
              
              if (!client) return null;
              
              return (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  client={client}
                  index={globalIndex}
                  isActive={false}
                  onMarkCompleted={() => {}}
                  onMarkAbsent={() => {}}
                  onNavigate={() => onNavigate(client)}
                  onSelect={() => {}}
                />
              );
            })}
            {completedVisits.length > 3 && (
              <p className="text-sm text-center text-muted-foreground py-2">
                + {completedVisits.length - 3} autres visites terminées
              </p>
            )}
          </div>
        </div>
      )}

      {/* Message si aucune visite */}
      {visits.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucune visite prévue</p>
          <p className="text-sm mt-1">Créez une tournée pour commencer</p>
        </div>
      )}
    </div>
  );
}
