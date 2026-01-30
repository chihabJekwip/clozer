// Service de calcul d'itinéraire utilisant OSRM (OpenStreetMap) - GRATUIT

import { LatLng, RouteSegment } from '@/types';

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

interface OSRMResponse {
  code: string;
  routes: {
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
    legs: {
      distance: number;
      duration: number;
    }[];
  }[];
}

// Calculer l'itinéraire entre deux points
export async function getRoute(from: LatLng, to: LatLng): Promise<RouteSegment | null> {
  try {
    const url = `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Erreur OSRM:', response.status);
      return null;
    }

    const data: OSRMResponse = await response.json();
    
    if (data.code !== 'Ok' || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    return {
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    };
  } catch (error) {
    console.error('Erreur lors du calcul d\'itinéraire:', error);
    return null;
  }
}

// Calculer l'itinéraire pour plusieurs points (tournée complète)
export async function getFullRoute(points: LatLng[]): Promise<{
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
  fullGeometry: [number, number][];
} | null> {
  if (points.length < 2) return null;

  try {
    // Construire la chaîne de coordonnées pour OSRM
    const coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_URL}/${coordsString}?overview=full&geometries=geojson&steps=false`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Erreur OSRM:', response.status);
      return null;
    }

    const data: OSRMResponse = await response.json();
    
    if (data.code !== 'Ok' || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const segments: RouteSegment[] = [];

    // Créer les segments individuels
    for (let i = 0; i < points.length - 1; i++) {
      segments.push({
        fromLat: points[i].lat,
        fromLng: points[i].lng,
        toLat: points[i + 1].lat,
        toLng: points[i + 1].lng,
        distance: route.legs[i]?.distance || 0,
        duration: route.legs[i]?.duration || 0,
        geometry: [] // Les géométries individuelles nécessiteraient des appels séparés
      });
    }

    return {
      totalDistance: route.distance,
      totalDuration: route.duration,
      segments,
      fullGeometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    };
  } catch (error) {
    console.error('Erreur lors du calcul de l\'itinéraire complet:', error);
    return null;
  }
}

// Calculer la matrice des distances entre tous les points
export async function getDistanceMatrix(points: LatLng[]): Promise<{
  distances: number[][];
  durations: number[][];
} | null> {
  if (points.length < 2) return null;

  try {
    const coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/table/v1/driving/${coordsString}?annotations=distance,duration`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Erreur OSRM table:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.code !== 'Ok') {
      return null;
    }

    return {
      distances: data.distances,
      durations: data.durations
    };
  } catch (error) {
    console.error('Erreur lors du calcul de la matrice:', error);
    return null;
  }
}
