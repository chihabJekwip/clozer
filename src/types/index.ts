// Types pour l'application Clozer - Gestion de tournées commerciales

// Types d'utilisateurs et rôles
export type UserRole = 'admin' | 'commercial';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  telDomicile: string | null;
  portableM: string | null;
  portableMme: string | null;
  adresse: string;
  codePostal: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  assignedTo: string | null; // ID du commercial assigné
  createdAt: string;
  updatedAt: string;
}

export interface Tour {
  id: string;
  name: string;
  date: string;
  startPoint: {
    lat: number;
    lng: number;
    address: string;
  };
  status: TourStatus;
  totalDistance: number | null; // en mètres
  totalDuration: number | null; // en secondes
  userId: string | null; // ID du commercial propriétaire
  createdAt: string;
  updatedAt: string;
}

export type TourStatus = 'planning' | 'in_progress' | 'completed' | 'paused';

export interface Visit {
  id: string;
  tourId: string;
  clientId: string;
  order: number;
  status: VisitStatus;
  visitedAt: string | null;
  notes: string | null;
  absentStrategy: AbsentStrategy | null;
  estimatedArrival: string | null;
  estimatedDuration: number; // en minutes (temps chez le client)
  distanceFromPrevious: number | null; // en mètres
  durationFromPrevious: number | null; // en secondes
  createdAt: string;
  updatedAt: string;
  // Relation
  client?: Client;
}

export type VisitStatus = 
  | 'pending'      // À visiter
  | 'in_progress'  // En cours de visite
  | 'completed'    // Visite terminée
  | 'absent'       // Client absent
  | 'postponed'    // Reporté à une autre date
  | 'skipped';     // Sauté temporairement (pour revenir plus tard)

export type AbsentStrategy = 
  | 'after_next'   // Revenir juste après le prochain client
  | 'on_return'    // Revenir sur le chemin du retour
  | 'another_day'; // Reporter à un autre jour

export interface Quote {
  id: string;
  visitId: string | null;
  clientId: string;
  date: string;
  status: QuoteStatus;
  // Informations client
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  // Détails du devis
  items: QuoteItem[];
  notes: string | null;
  totalHT: number;
  tva: number;
  totalTTC: number;
  // Métadonnées
  createdAt: string;
  updatedAt: string;
  signatureData: string | null; // Base64 de la signature
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Settings de l'application
export interface AppSettings {
  startPoint: {
    lat: number;
    lng: number;
    address: string;
  };
  workStartTime: string; // "08:30"
  workEndTime: string;   // "18:00"
  lunchBreakStart: string | null; // "12:00"
  lunchBreakEnd: string | null;   // "13:30"
  defaultVisitDuration: number; // minutes
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companySiret: string;
  currentUserId: string | null; // ID de l'utilisateur connecté
}

// Pour le calcul d'itinéraire
export interface RouteSegment {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  distance: number; // mètres
  duration: number; // secondes
  geometry: [number, number][]; // polyline coordinates
}

export interface OptimizedRoute {
  visits: Visit[];
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
}

// Coordonnées GPS
export interface LatLng {
  lat: number;
  lng: number;
  address?: string;
}

// Résultat de géocodage
export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  confidence: number;
}

// Rapport de visite (dictée vocale ou texte)
export interface VisitReport {
  id: string;
  visitId: string;
  clientId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null; // ID du commercial
}
