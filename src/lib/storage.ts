// Stockage local des données avec localStorage et fichiers JSON
// Alternative simple à SQLite pour éviter les problèmes de compilation native

import { Client, Tour, Visit, Quote, AppSettings } from '@/types';
import { generateId } from './utils';
import { ANGOULEME_COORDINATES } from './geocoding';

const STORAGE_KEYS = {
  CLIENTS: 'clozer_clients',
  TOURS: 'clozer_tours',
  VISITS: 'clozer_visits',
  QUOTES: 'clozer_quotes',
  SETTINGS: 'clozer_settings',
};

// Utilitaires de stockage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erreur de sauvegarde:', error);
  }
}

// ==================== CLIENTS ====================

export function getClients(): Client[] {
  return getFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
}

export function saveClients(clients: Client[]): void {
  saveToStorage(STORAGE_KEYS.CLIENTS, clients);
}

export function getClient(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
  const newClient: Client = {
    ...client,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const clients = getClients();
  clients.push(newClient);
  saveClients(clients);
  return newClient;
}

export function updateClient(id: string, updates: Partial<Client>): Client | null {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  clients[index] = {
    ...clients[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveClients(clients);
  return clients[index];
}

export function deleteClient(id: string): boolean {
  const clients = getClients();
  const filtered = clients.filter(c => c.id !== id);
  if (filtered.length === clients.length) return false;
  saveClients(filtered);
  return true;
}

export function importClients(newClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[]): Client[] {
  const now = new Date().toISOString();
  const clientsWithIds: Client[] = newClients.map(c => ({
    ...c,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));
  
  // Remplacer tous les clients existants
  saveClients(clientsWithIds);
  return clientsWithIds;
}

// ==================== TOURS ====================

export function getTours(): Tour[] {
  return getFromStorage<Tour[]>(STORAGE_KEYS.TOURS, []);
}

export function saveTours(tours: Tour[]): void {
  saveToStorage(STORAGE_KEYS.TOURS, tours);
}

export function getTour(id: string): Tour | undefined {
  return getTours().find(t => t.id === id);
}

export function createTour(name: string, date: string, clientIds: string[]): Tour {
  const settings = getSettings();
  const newTour: Tour = {
    id: generateId(),
    name,
    date,
    startPoint: settings.startPoint,
    status: 'planning',
    totalDistance: null,
    totalDuration: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const tours = getTours();
  tours.push(newTour);
  saveTours(tours);
  
  // Créer les visites pour cette tournée
  const clients = getClients();
  clientIds.forEach((clientId, index) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      addVisit({
        tourId: newTour.id,
        clientId,
        order: index,
        status: 'pending',
        visitedAt: null,
        notes: null,
        absentStrategy: null,
        estimatedArrival: null,
        estimatedDuration: settings.defaultVisitDuration,
        distanceFromPrevious: null,
        durationFromPrevious: null,
      });
    }
  });
  
  return newTour;
}

export function updateTour(id: string, updates: Partial<Tour>): Tour | null {
  const tours = getTours();
  const index = tours.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  tours[index] = {
    ...tours[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveTours(tours);
  return tours[index];
}

export function deleteTour(id: string): boolean {
  const tours = getTours();
  const filtered = tours.filter(t => t.id !== id);
  if (filtered.length === tours.length) return false;
  saveTours(filtered);
  
  // Supprimer les visites associées
  const visits = getVisits();
  saveVisits(visits.filter(v => v.tourId !== id));
  
  return true;
}

// ==================== VISITS ====================

export function getVisits(): Visit[] {
  return getFromStorage<Visit[]>(STORAGE_KEYS.VISITS, []);
}

export function saveVisits(visits: Visit[]): void {
  saveToStorage(STORAGE_KEYS.VISITS, visits);
}

export function getVisitsByTour(tourId: string): Visit[] {
  return getVisits()
    .filter(v => v.tourId === tourId)
    .sort((a, b) => a.order - b.order);
}

export function getVisit(id: string): Visit | undefined {
  return getVisits().find(v => v.id === id);
}

export function addVisit(visit: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>): Visit {
  const newVisit: Visit = {
    ...visit,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const visits = getVisits();
  visits.push(newVisit);
  saveVisits(visits);
  return newVisit;
}

export function updateVisit(id: string, updates: Partial<Visit>): Visit | null {
  const visits = getVisits();
  const index = visits.findIndex(v => v.id === id);
  if (index === -1) return null;
  
  visits[index] = {
    ...visits[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveVisits(visits);
  return visits[index];
}

export function updateVisitsOrder(tourId: string, orderedVisitIds: string[]): void {
  const visits = getVisits();
  orderedVisitIds.forEach((visitId, index) => {
    const visitIndex = visits.findIndex(v => v.id === visitId);
    if (visitIndex !== -1) {
      visits[visitIndex].order = index;
      visits[visitIndex].updatedAt = new Date().toISOString();
    }
  });
  saveVisits(visits);
}

// ==================== QUOTES ====================

export function getQuotes(): Quote[] {
  return getFromStorage<Quote[]>(STORAGE_KEYS.QUOTES, []);
}

export function saveQuotes(quotes: Quote[]): void {
  saveToStorage(STORAGE_KEYS.QUOTES, quotes);
}

export function getQuote(id: string): Quote | undefined {
  return getQuotes().find(q => q.id === id);
}

export function getQuotesByClient(clientId: string): Quote[] {
  return getQuotes().filter(q => q.clientId === clientId);
}

export function addQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Quote {
  const newQuote: Quote = {
    ...quote,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const quotes = getQuotes();
  quotes.push(newQuote);
  saveQuotes(quotes);
  return newQuote;
}

export function updateQuote(id: string, updates: Partial<Quote>): Quote | null {
  const quotes = getQuotes();
  const index = quotes.findIndex(q => q.id === id);
  if (index === -1) return null;
  
  quotes[index] = {
    ...quotes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveQuotes(quotes);
  return quotes[index];
}

// ==================== SETTINGS ====================

const DEFAULT_SETTINGS: AppSettings = {
  startPoint: ANGOULEME_COORDINATES,
  workStartTime: '08:30',
  workEndTime: '18:00',
  lunchBreakStart: '12:00',
  lunchBreakEnd: '13:30',
  defaultVisitDuration: 30,
  companyName: 'Mon Entreprise',
  companyAddress: 'Angoulême, France',
  companyPhone: '',
  companySiret: '',
};

export function getSettings(): AppSettings {
  return getFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const settings = getSettings();
  const newSettings = { ...settings, ...updates };
  saveToStorage(STORAGE_KEYS.SETTINGS, newSettings);
  return newSettings;
}

// ==================== EXPORT / IMPORT DATA ====================

export function exportAllData(): string {
  const data = {
    clients: getClients(),
    tours: getTours(),
    visits: getVisits(),
    quotes: getQuotes(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.clients) saveClients(data.clients);
    if (data.tours) saveTours(data.tours);
    if (data.visits) saveVisits(data.visits);
    if (data.quotes) saveQuotes(data.quotes);
    if (data.settings) saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
    return true;
  } catch {
    return false;
  }
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  });
}
