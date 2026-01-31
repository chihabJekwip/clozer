// Système intelligent de planification de tournées
// Analyse automatiquement les clients et propose des tournées optimisées

import { Client, Tour, Visit, AppSettings, LatLng } from '@/types';
import { getClients, getVisits, getTours, getSettings, getClientsByUser } from './storage';
import { optimizeTour } from './optimization';

export interface TourSuggestion {
  id: string;
  name: string;
  date: string;
  clients: Client[];
  estimatedDistance: number; // en km
  estimatedDuration: number; // en minutes (trajet + visites)
  estimatedVisits: number;
  zone: string; // Zone géographique principale
  priority: 'high' | 'medium' | 'low';
  reason: string; // Explication de la suggestion
}

export interface DailyPlan {
  date: string;
  suggestions: TourSuggestion[];
  totalClientsToVisit: number;
  clientsPerZone: Map<string, number>;
  recommendation: string;
}

// Coordonnées d'Angoulême (point de départ)
const ANGOULEME: LatLng = { lat: 45.6486, lng: 0.1556 };

// Calculer la distance euclidienne entre deux points (approximation rapide)
function haversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Rayon de la Terre en km
  const lat1 = p1.lat * Math.PI / 180;
  const lat2 = p2.lat * Math.PI / 180;
  const deltaLat = (p2.lat - p1.lat) * Math.PI / 180;
  const deltaLng = (p2.lng - p1.lng) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Identifier la zone géographique d'un client basée sur le code postal
function getZone(codePostal: string): string {
  const prefix = codePostal.substring(0, 2);
  const zones: Record<string, string> = {
    '16': 'Charente',
    '17': 'Charente-Maritime',
    '86': 'Vienne',
    '24': 'Dordogne',
    '87': 'Haute-Vienne',
    '79': 'Deux-Sèvres',
  };
  return zones[prefix] || `Zone ${prefix}`;
}

// Sous-zone plus précise basée sur les 3 premiers chiffres
function getSubZone(codePostal: string, ville: string): string {
  const prefix3 = codePostal.substring(0, 3);
  
  // Zones connues autour d'Angoulême
  const subZones: Record<string, string> = {
    '160': 'Angoulême Centre',
    '161': 'Nord Angoulême',
    '162': 'Est Angoulême (Cognac)',
    '163': 'Sud Angoulême',
    '164': 'Ouest Angoulême',
    '165': 'Confolentais',
    '166': 'Ruffécois',
    '167': 'Rouillac',
    '168': 'Soyaux/La Couronne',
    '171': 'Charente-Maritime Nord',
    '172': 'Charente-Maritime Centre',
  };
  
  return subZones[prefix3] || ville;
}

// Obtenir tous les clients qui n'ont pas encore été visités (jamais en tournée "completed")
export function getUnvisitedClients(userId?: string): Client[] {
  // Si userId est fourni, filtrer par utilisateur assigné
  const allClients = userId ? getClientsByUser(userId) : getClients();
  const allVisits = getVisits();
  
  // Trouver les IDs des clients qui ont été visités (status = completed)
  const visitedClientIds = new Set<string>();
  
  allVisits.forEach(visit => {
    if (visit.status === 'completed') {
      visitedClientIds.add(visit.clientId);
    }
  });
  
  // Retourner les clients non visités avec coordonnées GPS (pour les tournées)
  return allClients.filter(client => 
    !visitedClientIds.has(client.id) && 
    client.latitude !== null && 
    client.longitude !== null
  );
}

// Obtenir le nombre réel de clients visités (avec visite completed)
export function getVisitedClientIds(): Set<string> {
  const allVisits = getVisits();
  const visitedClientIds = new Set<string>();
  
  allVisits.forEach(visit => {
    if (visit.status === 'completed') {
      visitedClientIds.add(visit.clientId);
    }
  });
  
  return visitedClientIds;
}

// Regrouper les clients par zone géographique
export function clusterClientsByZone(clients: Client[]): Map<string, Client[]> {
  const clusters = new Map<string, Client[]>();
  
  clients.forEach(client => {
    const zone = getSubZone(client.codePostal, client.ville);
    if (!clusters.has(zone)) {
      clusters.set(zone, []);
    }
    clusters.get(zone)!.push(client);
  });
  
  return clusters;
}

// Calculer la distance totale estimée pour un groupe de clients
function estimateTourDistance(clients: Client[], startPoint: LatLng = ANGOULEME): number {
  if (clients.length === 0) return 0;
  
  let totalDistance = 0;
  let currentPoint = startPoint;
  
  // Trier par proximité (nearest neighbor simple)
  const remaining = [...clients];
  const ordered: Client[] = [];
  
  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const client = remaining[i];
      if (client.latitude && client.longitude) {
        const dist = haversineDistance(currentPoint, { lat: client.latitude, lng: client.longitude });
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
    }
    
    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    totalDistance += nearestDist;
    
    if (nearest.latitude && nearest.longitude) {
      currentPoint = { lat: nearest.latitude, lng: nearest.longitude };
    }
  }
  
  // Ajouter le retour au point de départ
  totalDistance += haversineDistance(currentPoint, startPoint);
  
  return totalDistance;
}

// Estimer la durée totale (trajet + temps chez les clients)
function estimateTourDuration(
  distanceKm: number, 
  numClients: number, 
  avgVisitMinutes: number = 30
): number {
  // Vitesse moyenne estimée : 50 km/h en zone mixte
  const travelMinutes = (distanceKm / 50) * 60;
  const visitMinutes = numClients * avgVisitMinutes;
  return Math.round(travelMinutes + visitMinutes);
}

// Déterminer combien de clients peuvent être visités en une journée
function getMaxClientsPerDay(settings: AppSettings): number {
  const [startH, startM] = settings.workStartTime.split(':').map(Number);
  const [endH, endM] = settings.workEndTime.split(':').map(Number);
  
  let availableMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  
  // Soustraire la pause déjeuner si configurée
  if (settings.lunchBreakStart && settings.lunchBreakEnd) {
    const [lunchStartH, lunchStartM] = settings.lunchBreakStart.split(':').map(Number);
    const [lunchEndH, lunchEndM] = settings.lunchBreakEnd.split(':').map(Number);
    availableMinutes -= ((lunchEndH * 60 + lunchEndM) - (lunchStartH * 60 + lunchStartM));
  }
  
  // Temps moyen par visite (30 min) + temps de trajet moyen (15 min)
  const avgTimePerClient = settings.defaultVisitDuration + 15;
  
  return Math.floor(availableMinutes / avgTimePerClient);
}

// Générer une suggestion de tournée pour un groupe de clients
function createTourSuggestion(
  clients: Client[],
  zone: string,
  date: string,
  priority: 'high' | 'medium' | 'low',
  reason: string
): TourSuggestion {
  const distance = estimateTourDistance(clients);
  const duration = estimateTourDuration(distance, clients.length);
  
  return {
    id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `Tournée ${zone}`,
    date,
    clients,
    estimatedDistance: Math.round(distance * 10) / 10,
    estimatedDuration: duration,
    estimatedVisits: clients.length,
    zone,
    priority,
    reason,
  };
}

// FONCTION PRINCIPALE : Générer le plan intelligent pour aujourd'hui et les prochains jours
export function generateSmartPlan(userId?: string): DailyPlan {
  const settings = getSettings();
  const unvisitedClients = getUnvisitedClients(userId);
  const today = new Date().toISOString().split('T')[0];
  
  if (unvisitedClients.length === 0) {
    return {
      date: today,
      suggestions: [],
      totalClientsToVisit: 0,
      clientsPerZone: new Map(),
      recommendation: "Tous les clients ont été visités ! Importez de nouveaux clients pour continuer.",
    };
  }
  
  // Regrouper par zone
  const clientsByZone = clusterClientsByZone(unvisitedClients);
  const maxClientsPerDay = getMaxClientsPerDay(settings);
  
  const suggestions: TourSuggestion[] = [];
  
  // Trier les zones par nombre de clients (prioriser les zones denses)
  const sortedZones = Array.from(clientsByZone.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  // Stratégie 1 : Tournée par zone (la plus dense d'abord)
  sortedZones.forEach(([zone, zoneClients], index) => {
    if (zoneClients.length === 0) return;
    
    // Limiter au nombre max de clients par jour
    const clientsForTour = zoneClients.slice(0, Math.min(zoneClients.length, maxClientsPerDay));
    
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let reason = '';
    
    if (index === 0) {
      priority = 'high';
      reason = `Zone la plus dense avec ${zoneClients.length} clients. Optimise les déplacements.`;
    } else if (zoneClients.length >= 5) {
      priority = 'medium';
      reason = `${zoneClients.length} clients dans cette zone. Bon potentiel de prospection.`;
    } else {
      priority = 'low';
      reason = `${zoneClients.length} clients isolés. À combiner avec une autre zone proche.`;
    }
    
    suggestions.push(createTourSuggestion(
      clientsForTour,
      zone,
      today,
      priority,
      reason
    ));
  });
  
  // Stratégie 2 : Tournée optimisée mixte (clients les plus proches peu importe la zone)
  const nearestClients = [...unvisitedClients]
    .filter(c => c.latitude && c.longitude)
    .map(client => ({
      client,
      distance: haversineDistance(ANGOULEME, { lat: client.latitude!, lng: client.longitude! })
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxClientsPerDay)
    .map(item => item.client);
  
  if (nearestClients.length > 0) {
    const avgDistance = nearestClients.reduce((sum, c) => 
      sum + haversineDistance(ANGOULEME, { lat: c.latitude!, lng: c.longitude! }), 0
    ) / nearestClients.length;
    
    suggestions.unshift(createTourSuggestion(
      nearestClients,
      'Proximité Angoulême',
      today,
      'high',
      `${nearestClients.length} clients les plus proches du bureau (rayon ~${Math.round(avgDistance)} km). Tournée la plus rapide.`
    ));
  }
  
  // Générer la recommandation principale
  let recommendation = '';
  const totalClients = unvisitedClients.length;
  const daysNeeded = Math.ceil(totalClients / maxClientsPerDay);
  
  if (totalClients <= maxClientsPerDay) {
    recommendation = `Vous avez ${totalClients} clients à visiter. Une seule journée suffit ! Lancez la tournée "Proximité Angoulême" pour optimiser votre temps.`;
  } else {
    recommendation = `${totalClients} clients à visiter répartis sur ${clientsByZone.size} zones. ` +
      `Estimation : ${daysNeeded} jours de tournée (${maxClientsPerDay} clients/jour max). ` +
      `Commencez par la tournée "Proximité Angoulême" ou choisissez une zone spécifique.`;
  }
  
  return {
    date: today,
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
    totalClientsToVisit: totalClients,
    clientsPerZone: new Map(sortedZones.map(([zone, clients]) => [zone, clients.length])),
    recommendation,
  };
}

// Créer automatiquement une tournée à partir d'une suggestion
export function createTourFromSuggestion(suggestion: TourSuggestion): {
  tourId: string;
  clientIds: string[];
} {
  return {
    tourId: suggestion.id,
    clientIds: suggestion.clients.map(c => c.id),
  };
}

// Analyser l'historique et donner des insights
export function getInsights(userId?: string): {
  totalClients: number;
  visitedClients: number;
  pendingClients: number;
  notGeocodedClients: number;
  completionRate: number;
  mostVisitedZone: string | null;
  suggestedNextAction: string;
} {
  const allClients = userId ? getClientsByUser(userId) : getClients();
  const visitedClientIds = getVisitedClientIds();
  
  // Compter les vrais visités (clients avec une visite completed)
  const visited = allClients.filter(c => visitedClientIds.has(c.id)).length;
  
  // Clients non géolocalisés
  const notGeocoded = allClients.filter(c => !c.latitude || !c.longitude).length;
  
  // Clients à visiter (non visités et géolocalisés)
  const pendingClients = allClients.filter(c => 
    !visitedClientIds.has(c.id) && c.latitude && c.longitude
  ).length;
  
  const completionRate = allClients.length > 0 
    ? Math.round((visited / allClients.length) * 100) 
    : 0;
  
  const visitedByZone = new Map<string, number>();
  allClients.forEach(client => {
    if (visitedClientIds.has(client.id)) {
      const zone = getSubZone(client.codePostal, client.ville);
      visitedByZone.set(zone, (visitedByZone.get(zone) || 0) + 1);
    }
  });
  
  let mostVisitedZone: string | null = null;
  let maxVisits = 0;
  visitedByZone.forEach((count, zone) => {
    if (count > maxVisits) {
      maxVisits = count;
      mostVisitedZone = zone;
    }
  });
  
  // Suggestion d'action
  let suggestedNextAction = '';
  if (allClients.length === 0) {
    suggestedNextAction = "Importez votre fichier Excel de clients pour commencer.";
  } else if (notGeocoded > 0) {
    suggestedNextAction = `${notGeocoded} clients sans géolocalisation. Corrigez leurs adresses ou lancez le géocodage.`;
  } else if (pendingClients === 0 && visited > 0) {
    suggestedNextAction = "Félicitations ! Tous les clients ont été visités. Importez de nouveaux clients.";
  } else if (completionRate < 25) {
    suggestedNextAction = `${pendingClients} clients à visiter. Lancez une tournée optimisée pour démarrer !`;
  } else if (completionRate < 75) {
    suggestedNextAction = `Bon progrès ! Encore ${pendingClients} clients. Continuez avec les zones restantes.`;
  } else {
    suggestedNextAction = `Presque fini ! Plus que ${pendingClients} clients à visiter.`;
  }
  
  return {
    totalClients: allClients.length,
    visitedClients: visited,
    pendingClients,
    notGeocodedClients: notGeocoded,
    completionRate,
    mostVisitedZone,
    suggestedNextAction,
  };
}
