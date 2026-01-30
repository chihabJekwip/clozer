// Algorithme d'optimisation de tournée (TSP - Travelling Salesman Problem)
// Utilise l'algorithme Nearest Neighbor + amélioration 2-opt

import { LatLng } from '@/types';

interface OptimizationResult {
  orderedIndices: number[]; // Indices des points dans l'ordre optimal
  totalDistance: number;
}

// Calcul de distance euclidienne (approximation rapide pour le tri initial)
function euclideanDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Rayon de la Terre en mètres
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

// Calcul de la distance totale d'une tournée
function calculateTourDistance(
  tour: number[],
  startPoint: LatLng,
  points: LatLng[],
  distanceMatrix?: number[][]
): number {
  let total = 0;
  
  // Distance du point de départ au premier point
  if (distanceMatrix) {
    total += distanceMatrix[0][tour[0] + 1]; // +1 car le point de départ est à l'index 0
  } else {
    total += euclideanDistance(startPoint, points[tour[0]]);
  }
  
  // Distances entre les points
  for (let i = 0; i < tour.length - 1; i++) {
    if (distanceMatrix) {
      total += distanceMatrix[tour[i] + 1][tour[i + 1] + 1];
    } else {
      total += euclideanDistance(points[tour[i]], points[tour[i + 1]]);
    }
  }
  
  // Distance du dernier point au point de départ (retour)
  if (distanceMatrix) {
    total += distanceMatrix[tour[tour.length - 1] + 1][0];
  } else {
    total += euclideanDistance(points[tour[tour.length - 1]], startPoint);
  }
  
  return total;
}

// Algorithme Nearest Neighbor (plus proche voisin)
function nearestNeighbor(
  startPoint: LatLng,
  points: LatLng[],
  distanceMatrix?: number[][]
): number[] {
  const n = points.length;
  const visited = new Set<number>();
  const tour: number[] = [];
  
  // Trouver le point le plus proche du départ
  let minDist = Infinity;
  let nearest = 0;
  
  for (let i = 0; i < n; i++) {
    const dist = distanceMatrix 
      ? distanceMatrix[0][i + 1]
      : euclideanDistance(startPoint, points[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  }
  
  tour.push(nearest);
  visited.add(nearest);
  
  // Construire le reste de la tournée
  while (tour.length < n) {
    const current = tour[tour.length - 1];
    minDist = Infinity;
    nearest = -1;
    
    for (let i = 0; i < n; i++) {
      if (!visited.has(i)) {
        const dist = distanceMatrix
          ? distanceMatrix[current + 1][i + 1]
          : euclideanDistance(points[current], points[i]);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
    }
    
    if (nearest !== -1) {
      tour.push(nearest);
      visited.add(nearest);
    }
  }
  
  return tour;
}

// Amélioration 2-opt
function twoOpt(
  tour: number[],
  startPoint: LatLng,
  points: LatLng[],
  distanceMatrix?: number[][]
): number[] {
  let improved = true;
  let bestTour = [...tour];
  let bestDistance = calculateTourDistance(bestTour, startPoint, points, distanceMatrix);
  
  while (improved) {
    improved = false;
    
    for (let i = 0; i < bestTour.length - 1; i++) {
      for (let j = i + 2; j < bestTour.length; j++) {
        // Créer une nouvelle tournée en inversant le segment entre i et j
        const newTour = [
          ...bestTour.slice(0, i + 1),
          ...bestTour.slice(i + 1, j + 1).reverse(),
          ...bestTour.slice(j + 1)
        ];
        
        const newDistance = calculateTourDistance(newTour, startPoint, points, distanceMatrix);
        
        if (newDistance < bestDistance) {
          bestTour = newTour;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }
  
  return bestTour;
}

// Fonction principale d'optimisation
export function optimizeTour(
  startPoint: LatLng,
  points: LatLng[],
  distanceMatrix?: number[][]
): OptimizationResult {
  if (points.length === 0) {
    return { orderedIndices: [], totalDistance: 0 };
  }
  
  if (points.length === 1) {
    const dist = distanceMatrix
      ? distanceMatrix[0][1] + distanceMatrix[1][0]
      : euclideanDistance(startPoint, points[0]) * 2;
    return { orderedIndices: [0], totalDistance: dist };
  }
  
  // Étape 1: Construire une solution initiale avec Nearest Neighbor
  let tour = nearestNeighbor(startPoint, points, distanceMatrix);
  
  // Étape 2: Améliorer avec 2-opt
  tour = twoOpt(tour, startPoint, points, distanceMatrix);
  
  // Calculer la distance totale finale
  const totalDistance = calculateTourDistance(tour, startPoint, points, distanceMatrix);
  
  return {
    orderedIndices: tour,
    totalDistance
  };
}

// Réoptimiser après un client absent
export function reoptimizeAfterAbsent(
  currentPosition: LatLng,
  remainingPoints: LatLng[],
  absentPoint: LatLng,
  strategy: 'after_next' | 'on_return',
  distanceMatrix?: number[][]
): {
  orderedIndices: number[];
  absentIndex: number; // Position où le client absent sera visité
} {
  if (strategy === 'after_next') {
    // Optimiser les points restants, puis insérer le client absent après le premier
    const optimized = optimizeTour(currentPosition, remainingPoints, distanceMatrix);
    
    // Insérer le client absent en position 1 (juste après le prochain)
    return {
      orderedIndices: optimized.orderedIndices,
      absentIndex: 1
    };
  } else {
    // Strategy 'on_return': mettre le client absent à la fin
    const optimized = optimizeTour(currentPosition, remainingPoints, distanceMatrix);
    
    return {
      orderedIndices: optimized.orderedIndices,
      absentIndex: optimized.orderedIndices.length // À la fin
    };
  }
}

// Calculer si on a le temps de visiter tous les clients restants
export function estimateCanComplete(
  remainingVisits: number,
  totalRemainingDuration: number, // en secondes (temps de trajet)
  averageVisitDuration: number, // en minutes
  workEndTime: Date,
  currentTime: Date = new Date()
): {
  canComplete: boolean;
  estimatedEndTime: Date;
  visitsThatFit: number;
} {
  const availableMinutes = (workEndTime.getTime() - currentTime.getTime()) / 60000;
  const totalTimeNeeded = (totalRemainingDuration / 60) + (remainingVisits * averageVisitDuration);
  
  const canComplete = totalTimeNeeded <= availableMinutes;
  const estimatedEndTime = new Date(currentTime.getTime() + totalTimeNeeded * 60000);
  
  // Calculer combien de visites peuvent tenir
  let visitsThatFit = 0;
  let timeUsed = 0;
  const avgTravelPerVisit = totalRemainingDuration / 60 / remainingVisits;
  
  while (visitsThatFit < remainingVisits && timeUsed + avgTravelPerVisit + averageVisitDuration <= availableMinutes) {
    timeUsed += avgTravelPerVisit + averageVisitDuration;
    visitsThatFit++;
  }
  
  return {
    canComplete,
    estimatedEndTime,
    visitsThatFit
  };
}
