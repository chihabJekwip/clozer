// Stockage local des données avec localStorage et fichiers JSON
// Alternative simple à SQLite pour éviter les problèmes de compilation native

import { Client, Tour, Visit, Quote, AppSettings, User, VisitReport } from '@/types';
import { generateId } from './utils';
import { ANGOULEME_COORDINATES } from './geocoding';

const STORAGE_KEYS = {
  CLIENTS: 'clozer_clients',
  TOURS: 'clozer_tours',
  VISITS: 'clozer_visits',
  QUOTES: 'clozer_quotes',
  SETTINGS: 'clozer_settings',
  USERS: 'clozer_users',
  CURRENT_USER: 'clozer_current_user',
  VISIT_REPORTS: 'clozer_visit_reports',
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
  const currentUser = getCurrentUser();
  const newTour: Tour = {
    id: generateId(),
    name,
    date,
    startPoint: settings.startPoint,
    status: 'planning',
    totalDistance: null,
    totalDuration: null,
    userId: currentUser?.id || null,
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

export function getToursByUser(userId: string): Tour[] {
  return getTours().filter(t => t.userId === userId);
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
  currentUserId: null,
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

// ==================== USERS ====================

// Utilisateur admin par défaut
const DEFAULT_ADMIN: User = {
  id: 'admin-default',
  name: 'Administrateur',
  email: 'admin@clozer.fr',
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function getUsers(): User[] {
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
  // S'assurer qu'il y a toujours au moins l'admin par défaut
  if (users.length === 0 || !users.some(u => u.role === 'admin')) {
    const usersWithAdmin = [DEFAULT_ADMIN, ...users.filter(u => u.id !== DEFAULT_ADMIN.id)];
    saveUsers(usersWithAdmin);
    return usersWithAdmin;
  }
  return users;
}

export function saveUsers(users: User[]): void {
  saveToStorage(STORAGE_KEYS.USERS, users);
}

export function getUser(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function addUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const users = getUsers();
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveUsers(users);
  return users[index];
}

export function deleteUser(id: string): boolean {
  // Ne pas permettre la suppression de l'admin par défaut
  if (id === 'admin-default') return false;
  
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  
  // Désassigner tous les clients de cet utilisateur
  const clients = getClients();
  const updatedClients = clients.map(c => 
    c.assignedTo === id ? { ...c, assignedTo: null, updatedAt: new Date().toISOString() } : c
  );
  saveClients(updatedClients);
  
  return true;
}

export function getCommerciaux(): User[] {
  return getUsers().filter(u => u.role === 'commercial');
}

// ==================== CURRENT USER ====================

export function getCurrentUser(): User | null {
  const userId = getFromStorage<string | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!userId) return null;
  return getUser(userId) || null;
}

export function setCurrentUser(userId: string | null): void {
  saveToStorage(STORAGE_KEYS.CURRENT_USER, userId);
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

// ==================== CLIENTS PAR COMMERCIAL ====================

export function getClientsByUser(userId: string): Client[] {
  return getClients().filter(c => c.assignedTo === userId);
}

export function getUnassignedClients(): Client[] {
  return getClients().filter(c => !c.assignedTo);
}

export function assignClientToUser(clientId: string, userId: string | null): Client | null {
  return updateClient(clientId, { assignedTo: userId });
}

export function assignClientsToUser(clientIds: string[], userId: string | null): void {
  const clients = getClients();
  const now = new Date().toISOString();
  const updatedClients = clients.map(c => 
    clientIds.includes(c.id) ? { ...c, assignedTo: userId, updatedAt: now } : c
  );
  saveClients(updatedClients);
}

// ==================== VISIT REPORTS ====================

export function getVisitReports(): VisitReport[] {
  return getFromStorage<VisitReport[]>(STORAGE_KEYS.VISIT_REPORTS, []);
}

export function saveVisitReports(reports: VisitReport[]): void {
  saveToStorage(STORAGE_KEYS.VISIT_REPORTS, reports);
}

export function getVisitReport(id: string): VisitReport | undefined {
  return getVisitReports().find(r => r.id === id);
}

export function getReportsByVisit(visitId: string): VisitReport[] {
  return getVisitReports()
    .filter(r => r.visitId === visitId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReportsByClient(clientId: string): VisitReport[] {
  return getVisitReports()
    .filter(r => r.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addVisitReport(report: Omit<VisitReport, 'id' | 'createdAt' | 'updatedAt'>): VisitReport {
  const newReport: VisitReport = {
    ...report,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const reports = getVisitReports();
  reports.push(newReport);
  saveVisitReports(reports);
  return newReport;
}

export function updateVisitReport(id: string, updates: Partial<VisitReport>): VisitReport | null {
  const reports = getVisitReports();
  const index = reports.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  reports[index] = {
    ...reports[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveVisitReports(reports);
  return reports[index];
}

export function deleteVisitReport(id: string): boolean {
  const reports = getVisitReports();
  const filtered = reports.filter(r => r.id !== id);
  if (filtered.length === reports.length) return false;
  saveVisitReports(filtered);
  return true;
}

// ==================== EXPORT / IMPORT DATA ====================

export function exportAllData(): string {
  const data = {
    clients: getClients(),
    tours: getTours(),
    visits: getVisits(),
    quotes: getQuotes(),
    users: getUsers(),
    settings: getSettings(),
    visitReports: getVisitReports(),
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
    if (data.users) saveUsers(data.users);
    if (data.settings) saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
    if (data.visitReports) saveVisitReports(data.visitReports);
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
