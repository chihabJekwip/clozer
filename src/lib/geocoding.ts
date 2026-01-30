// Service de géocodage utilisant Nominatim (OpenStreetMap) - GRATUIT

import { GeocodingResult } from '@/types';
import { generateAddressVariants } from './utils';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Délai entre les requêtes pour respecter les limites de Nominatim (1 req/sec)
const RATE_LIMIT_MS = 1100;

let lastRequestTime = 0;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

// Géocodage simple d'une adresse
async function geocodeSingleAddress(address: string): Promise<GeocodingResult | null> {
  await waitForRateLimit();
  
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'fr',
      addressdetails: '1'
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'Clozer-TourApp/1.0 (contact@example.com)'
      }
    });

    if (!response.ok) {
      console.error('Erreur géocodage:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      confidence: parseFloat(result.importance || 0.5)
    };
  } catch (error) {
    console.error('Erreur lors du géocodage:', error);
    return null;
  }
}

// Géocodage simple (ancienne interface)
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  return geocodeSingleAddress(address);
}

// Résultat de géocodage avec informations supplémentaires
export interface SmartGeocodingResult {
  result: GeocodingResult | null;
  variantUsed: string | null;
  variantIndex: number;
  totalVariants: number;
  isFallback: boolean;  // true si on a utilisé une variante de fallback (pas l'adresse exacte)
}

// Géocodage intelligent avec plusieurs tentatives
export async function geocodeAddressSmart(
  adresse: string, 
  codePostal: string, 
  ville: string,
  onProgress?: (message: string) => void
): Promise<SmartGeocodingResult> {
  const variants = generateAddressVariants(adresse, codePostal, ville);
  
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    onProgress?.(`Tentative ${i + 1}/${variants.length}: ${variant.substring(0, 50)}...`);
    
    const result = await geocodeSingleAddress(variant);
    
    if (result) {
      return {
        result,
        variantUsed: variant,
        variantIndex: i,
        totalVariants: variants.length,
        isFallback: i > 0  // La première variante est l'adresse nettoyée complète
      };
    }
  }
  
  return {
    result: null,
    variantUsed: null,
    variantIndex: -1,
    totalVariants: variants.length,
    isFallback: false
  };
}

// Géocoder plusieurs adresses avec gestion du rate limiting
export async function geocodeAddresses(
  addresses: { id: string; address: string }[]
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();
  
  for (const { id, address } of addresses) {
    const result = await geocodeAddress(address);
    results.set(id, result);
  }
  
  return results;
}

// Statistiques de géocodage
export interface GeocodingStats {
  total: number;
  success: number;
  failed: number;
  exactMatch: number;    // Trouvé avec l'adresse exacte
  fallbackMatch: number; // Trouvé avec un fallback (code postal/ville)
  failedAddresses: { nom: string; ville: string; adresse: string }[];
}

// Point de départ par défaut : Angoulême
export const ANGOULEME_COORDINATES = {
  lat: 45.6486,
  lng: 0.1556,
  address: 'Angoulême, Charente, France'
};
