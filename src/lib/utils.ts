import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formater un numéro de téléphone français
export function formatPhone(phone: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}

// Formater une distance en km
export function formatDistance(meters: number | null): string {
  if (meters === null) return '-';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Formater une durée en heures/minutes
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes} min`;
}

// Générer un UUID simple
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Formater une date
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Formater une heure
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Calculer l'heure d'arrivée estimée
export function calculateETA(startTime: Date, durationSeconds: number): Date {
  return new Date(startTime.getTime() + durationSeconds * 1000);
}

// Nettoyer une chaîne pour l'adresse
export function cleanAddress(adresse: string, codePostal: string, ville: string): string {
  return `${adresse}, ${codePostal} ${ville}, France`.replace(/\s+/g, ' ').trim();
}

// Nettoyer l'adresse en supprimant les éléments problématiques
export function sanitizeAddress(adresse: string): string {
  let cleaned = adresse;
  
  // Supprimer les mentions "chez X"
  cleaned = cleaned.replace(/\bchez\s+\w+/gi, '');
  
  // Supprimer les mentions entre parenthèses
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  
  // Supprimer les lieux-dits communs au début s'il y a une rue après
  const lieuDitPattern = /^(le\s+|la\s+|les\s+|l')?[\w\s]+\s+(\d+\s+(rue|route|impasse|chemin|avenue|place|allée|boulevard))/i;
  const match = cleaned.match(lieuDitPattern);
  if (match) {
    cleaned = match[2];
  }
  
  // Nettoyer les espaces multiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Extraire le numéro de rue
export function extractStreetNumber(adresse: string): { number: string | null; street: string } {
  const match = adresse.match(/^(\d+[\s,]*(?:bis|ter)?)\s*(.+)/i);
  if (match) {
    return { number: match[1].trim(), street: match[2].trim() };
  }
  return { number: null, street: adresse };
}

// Générer des variantes d'adresses pour le géocodage
export function generateAddressVariants(adresse: string, codePostal: string, ville: string): string[] {
  const variants: string[] = [];
  const sanitized = sanitizeAddress(adresse);
  const { number, street } = extractStreetNumber(sanitized);
  
  // Variante 1: Adresse complète nettoyée
  if (sanitized) {
    variants.push(`${sanitized}, ${codePostal} ${ville}, France`);
  }
  
  // Variante 2: Adresse originale si différente
  if (adresse !== sanitized && adresse.trim()) {
    variants.push(`${adresse}, ${codePostal} ${ville}, France`);
  }
  
  // Variante 3: Sans le numéro de rue
  if (number && street) {
    variants.push(`${street}, ${codePostal} ${ville}, France`);
  }
  
  // Variante 4: Juste code postal + ville (fallback)
  variants.push(`${codePostal} ${ville}, France`);
  
  // Variante 5: Juste la ville (dernier recours)
  variants.push(`${ville}, Charente, France`);
  
  // Supprimer les doublons
  return Array.from(new Set(variants.map(v => v.replace(/\s+/g, ' ').trim())));
}
