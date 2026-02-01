// Stockage des données avec Supabase
// Synchronisation entre tous les appareils

import { 
  Client, 
  Tour, 
  Visit, 
  Quote, 
  AppSettings, 
  User, 
  VisitReport,
  TourNote,
  UserAddress,
  ReactivationRequest,
  UserSupervisor,
  ClientStatus,
  AvailabilityProfile,
  ReactivationRequestStatus
} from '@/types';
import { supabase } from './supabase';
import { generateId } from './utils';
import { ANGOULEME_COORDINATES } from './geocoding';

// ==================== HELPER FUNCTIONS ====================

function toDbClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): any {
  return {
    civilite: client.civilite,
    nom: client.nom,
    prenom: client.prenom,
    tel_domicile: client.telDomicile,
    portable_m: client.portableM,
    portable_mme: client.portableMme,
    email: client.email,
    adresse: client.adresse,
    code_postal: client.codePostal,
    ville: client.ville,
    latitude: client.latitude,
    longitude: client.longitude,
    assigned_to: client.assignedTo,
    // V2 Status fields
    status: client.status || 'active',
    availability_profile: client.availabilityProfile,
    deactivation_reason: client.deactivationReason,
    deactivated_at: client.deactivatedAt,
    deactivated_by: client.deactivatedBy,
    // V2 Extended info
    birthday: client.birthday,
    company_name: client.companyName,
    job_title: client.jobTitle,
    interests: client.interests || [],
    preferred_contact_method: client.preferredContactMethod,
    best_contact_time: client.bestContactTime,
    // V2 Analytics fields
    last_visited_at: client.lastVisitedAt,
    visit_count: client.visitCount || 0,
    total_revenue: client.totalRevenue || 0,
    priority_score: client.priorityScore || 50,
  };
}

function fromDbClient(db: any): Client {
  return {
    id: db.id,
    civilite: db.civilite || '',
    nom: db.nom,
    prenom: db.prenom || '',
    telDomicile: db.tel_domicile,
    portableM: db.portable_m,
    portableMme: db.portable_mme,
    email: db.email || null,
    adresse: db.adresse,
    codePostal: db.code_postal,
    ville: db.ville,
    latitude: db.latitude,
    longitude: db.longitude,
    assignedTo: db.assigned_to,
    // V2 Status fields
    status: db.status || 'active',
    availabilityProfile: db.availability_profile || null,
    deactivationReason: db.deactivation_reason || null,
    deactivatedAt: db.deactivated_at || null,
    deactivatedBy: db.deactivated_by || null,
    // V2 Extended info
    birthday: db.birthday || null,
    companyName: db.company_name || null,
    jobTitle: db.job_title || null,
    interests: db.interests || [],
    preferredContactMethod: db.preferred_contact_method || null,
    bestContactTime: db.best_contact_time || null,
    // V2 Analytics fields
    lastVisitedAt: db.last_visited_at || null,
    visitCount: db.visit_count || 0,
    totalRevenue: db.total_revenue || 0,
    priorityScore: db.priority_score || 50,
    // Timestamps
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbUser(db: any): User {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    role: db.role,
    phone: db.phone || null,
    avatarUrl: db.avatar_url || null,
    notificationPreferences: db.notification_preferences || { email: true, push: true, sms: false },
    theme: db.theme || 'system',
    language: db.language || 'fr',
    lastActiveAt: db.last_active_at || null,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbTour(db: any): Tour {
  return {
    id: db.id,
    name: db.name,
    date: db.date,
    startPoint: {
      lat: db.start_lat,
      lng: db.start_lng,
      address: db.start_address,
    },
    status: db.status,
    totalDistance: db.total_distance,
    totalDuration: db.total_duration,
    userId: db.user_id,
    // V2 fields
    startAddressId: db.start_address_id || null,
    finalReport: db.final_report || null,
    reportValidatedAt: db.report_validated_at || null,
    reportSentAt: db.report_sent_at || null,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbVisit(db: any): Visit {
  return {
    id: db.id,
    tourId: db.tour_id,
    clientId: db.client_id,
    order: db.order_index,
    status: db.status,
    visitedAt: db.visited_at,
    notes: db.notes,
    absentStrategy: db.absent_strategy,
    estimatedArrival: db.estimated_arrival,
    estimatedDuration: db.estimated_duration,
    distanceFromPrevious: db.distance_from_previous,
    durationFromPrevious: db.duration_from_previous,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbQuote(db: any): Quote {
  return {
    id: db.id,
    visitId: db.visit_id,
    clientId: db.client_id,
    date: db.date,
    status: db.status,
    clientName: db.client_name,
    clientAddress: db.client_address,
    clientPhone: db.client_phone,
    items: db.items || [],
    notes: db.notes,
    totalHT: db.total_ht,
    tva: db.tva,
    totalTTC: db.total_ttc,
    signatureData: db.signature_data,
    // V2 fields
    validUntil: db.valid_until || null,
    reminderSentAt: db.reminder_sent_at || null,
    rejectionReason: db.rejection_reason || null,
    followUpDate: db.follow_up_date || null,
    createdBy: db.created_by || null,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbVisitReport(db: any): VisitReport {
  return {
    id: db.id,
    visitId: db.visit_id,
    clientId: db.client_id,
    content: db.content,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbSettings(db: any): AppSettings {
  return {
    startPoint: {
      lat: db.start_lat,
      lng: db.start_lng,
      address: db.start_address,
    },
    workStartTime: db.work_start_time,
    workEndTime: db.work_end_time,
    lunchBreakStart: db.lunch_break_start,
    lunchBreakEnd: db.lunch_break_end,
    defaultVisitDuration: db.default_visit_duration,
    companyName: db.company_name,
    companyAddress: db.company_address,
    companyPhone: db.company_phone,
    companySiret: db.company_siret,
    currentUserId: null,
    // V2 fields
    workingProfileHour: db.working_profile_hour || '17:30',
    headquarters: {
      address: db.headquarters_address || '22 avenue de la République',
      city: db.headquarters_city || 'Le Gond-Pontouvre',
      postalCode: db.headquarters_postal_code || '16160',
      lat: db.headquarters_lat || null,
      lng: db.headquarters_lng || null,
    },
    confirmationWords: db.confirmation_words || ['TERMINER', 'VALIDER', 'CONFIRMER', 'ORANGE', 'ACCORD'],
  };
}

// ==================== NEW HELPER FUNCTIONS FOR V2 ====================

function fromDbTourNote(db: any): TourNote {
  return {
    id: db.id,
    tourId: db.tour_id,
    content: db.content,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbUserAddress(db: any): UserAddress {
  return {
    id: db.id,
    userId: db.user_id,
    name: db.name,
    address: db.address,
    city: db.city,
    postalCode: db.postal_code,
    latitude: db.latitude,
    longitude: db.longitude,
    isDefault: db.is_default || false,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbReactivationRequest(db: any): ReactivationRequest {
  return {
    id: db.id,
    clientId: db.client_id,
    requestedBy: db.requested_by,
    reason: db.reason,
    status: db.status,
    reviewedBy: db.reviewed_by,
    reviewComment: db.review_comment,
    createdAt: db.created_at,
    reviewedAt: db.reviewed_at,
  };
}

function fromDbUserSupervisor(db: any): UserSupervisor {
  return {
    id: db.id,
    userId: db.user_id,
    supervisorId: db.supervisor_id,
    createdAt: db.created_at,
  };
}

// ==================== CURRENT USER ====================
// Note: Authentication is now handled by Supabase Auth via UserContext
// These functions are kept for backward compatibility but session is managed by Supabase

// Variable to store current user ID (set by UserContext after Supabase Auth)
let currentAuthUserId: string | null = null;

/**
 * Set the current authenticated user ID
 * Called by UserContext after Supabase Auth login
 */
export function setAuthenticatedUserId(userId: string | null): void {
  currentAuthUserId = userId;
}

/**
 * Get the current authenticated user ID
 */
export function getAuthenticatedUserId(): string | null {
  return currentAuthUserId;
}

// ==================== CLIENTS ====================

export async function getClientsAsync(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clozer_clients')
    .select('*')
    .order('nom');
  
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  
  return (data || []).map(fromDbClient);
}

// Synchronous version using cached data
let clientsCache: Client[] = [];
let clientsCacheLoaded = false;

export function getClients(): Client[] {
  if (!clientsCacheLoaded) {
    // Trigger async load
    getClientsAsync().then(clients => {
      clientsCache = clients;
      clientsCacheLoaded = true;
    });
  }
  return clientsCache;
}

export async function refreshClients(): Promise<Client[]> {
  clientsCache = await getClientsAsync();
  clientsCacheLoaded = true;
  return clientsCache;
}

export function getClient(id: string): Client | undefined {
  return clientsCache.find(c => c.id === id);
}

export async function getClientAsync(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clozer_clients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  return fromDbClient(data);
}

export async function addClientAsync(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clozer_clients')
    .insert(toDbClient(client))
    .select()
    .single();
  
  if (error) {
    console.error('Error adding client:', error);
    return null;
  }
  
  const newClient = fromDbClient(data);
  clientsCache.push(newClient);
  return newClient;
}

export function addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
  const tempClient: Client = {
    ...client,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Add to cache immediately
  clientsCache.push(tempClient);
  
  // Sync to Supabase in background
  addClientAsync(client).then(newClient => {
    if (newClient) {
      const index = clientsCache.findIndex(c => c.id === tempClient.id);
      if (index !== -1) {
        clientsCache[index] = newClient;
      }
    }
  });
  
  return tempClient;
}

export async function updateClientAsync(id: string, updates: Partial<Client>): Promise<Client | null> {
  const dbUpdates: any = {};
  if (updates.civilite !== undefined) dbUpdates.civilite = updates.civilite;
  if (updates.nom !== undefined) dbUpdates.nom = updates.nom;
  if (updates.prenom !== undefined) dbUpdates.prenom = updates.prenom;
  if (updates.telDomicile !== undefined) dbUpdates.tel_domicile = updates.telDomicile;
  if (updates.portableM !== undefined) dbUpdates.portable_m = updates.portableM;
  if (updates.portableMme !== undefined) dbUpdates.portable_mme = updates.portableMme;
  if (updates.adresse !== undefined) dbUpdates.adresse = updates.adresse;
  if (updates.codePostal !== undefined) dbUpdates.code_postal = updates.codePostal;
  if (updates.ville !== undefined) dbUpdates.ville = updates.ville;
  if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
  // V2 fields
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.availabilityProfile !== undefined) dbUpdates.availability_profile = updates.availabilityProfile;
  if (updates.deactivationReason !== undefined) dbUpdates.deactivation_reason = updates.deactivationReason;
  if (updates.deactivatedAt !== undefined) dbUpdates.deactivated_at = updates.deactivatedAt;
  if (updates.deactivatedBy !== undefined) dbUpdates.deactivated_by = updates.deactivatedBy;
  
  const { data, error } = await supabase
    .from('clozer_clients')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating client:', error);
    return null;
  }
  
  const updatedClient = fromDbClient(data);
  const index = clientsCache.findIndex(c => c.id === id);
  if (index !== -1) {
    clientsCache[index] = updatedClient;
  }
  
  return updatedClient;
}

export function updateClient(id: string, updates: Partial<Client>): Client | null {
  const index = clientsCache.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  // Update cache immediately
  clientsCache[index] = {
    ...clientsCache[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  // Sync to Supabase in background
  updateClientAsync(id, updates);
  
  return clientsCache[index];
}

export async function deleteClientAsync(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('clozer_clients')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting client:', error);
    return false;
  }
  
  clientsCache = clientsCache.filter(c => c.id !== id);
  return true;
}

export function deleteClient(id: string): boolean {
  clientsCache = clientsCache.filter(c => c.id !== id);
  deleteClientAsync(id);
  return true;
}

export async function importClientsAsync(newClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Client[]> {
  // Delete all existing clients first
  await supabase.from('clozer_clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Insert new clients
  const dbClients = newClients.map(toDbClient);
  const { data, error } = await supabase
    .from('clozer_clients')
    .insert(dbClients)
    .select();
  
  if (error) {
    console.error('Error importing clients:', error);
    return [];
  }
  
  clientsCache = (data || []).map(fromDbClient);
  return clientsCache;
}

export function importClients(newClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[]): Client[] {
  // Create temp clients with IDs
  const tempClients: Client[] = newClients.map(c => ({
    ...c,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  clientsCache = tempClients;
  
  // Sync to Supabase in background
  importClientsAsync(newClients).then(imported => {
    if (imported.length > 0) {
      clientsCache = imported;
    }
  });
  
  return tempClients;
}

export function saveClients(clients: Client[]): void {
  clientsCache = clients;
  // Sync would need batch update - for now, use import
}

// ==================== TOURS ====================

let toursCache: Tour[] = [];
let toursCacheLoaded = false;

export async function getToursAsync(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('clozer_tours')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching tours:', error);
    return [];
  }
  
  return (data || []).map(fromDbTour);
}

export function getTours(): Tour[] {
  if (!toursCacheLoaded) {
    getToursAsync().then(tours => {
      toursCache = tours;
      toursCacheLoaded = true;
    });
  }
  return toursCache;
}

export async function refreshTours(): Promise<Tour[]> {
  toursCache = await getToursAsync();
  toursCacheLoaded = true;
  return toursCache;
}

export function saveTours(tours: Tour[]): void {
  toursCache = tours;
}

export function getTour(id: string): Tour | undefined {
  return toursCache.find(t => t.id === id);
}

export async function createTourAsync(
  name: string, 
  date: string, 
  clientIds: string[],
  userId?: string | null
): Promise<Tour | null> {
  const settings = getSettings();
  const effectiveUserId = userId ?? currentAuthUserId;
  
  const { data: tourData, error: tourError } = await supabase
    .from('clozer_tours')
    .insert({
      name,
      date,
      start_lat: settings.startPoint.lat,
      start_lng: settings.startPoint.lng,
      start_address: settings.startPoint.address,
      status: 'planning',
      user_id: effectiveUserId || null,
    })
    .select()
    .single();
  
  if (tourError) {
    console.error('Error creating tour:', tourError);
    return null;
  }
  
  const newTour = fromDbTour(tourData);
  toursCache.push(newTour);
  
  // Create visits for this tour
  const visitsToInsert = clientIds.map((clientId, index) => ({
    tour_id: newTour.id,
    client_id: clientId,
    order_index: index,
    status: 'pending',
    estimated_duration: settings.defaultVisitDuration,
  }));
  
  const { data: visitsData, error: visitsError } = await supabase
    .from('clozer_visits')
    .insert(visitsToInsert)
    .select();
  
  if (visitsError) {
    console.error('Error creating visits:', visitsError);
  } else if (visitsData) {
    visitsCache.push(...visitsData.map(fromDbVisit));
  }
  
  return newTour;
}

export function createTour(
  name: string, 
  date: string, 
  clientIds: string[],
  customStartPoint?: { lat: number; lng: number; address: string },
  userId?: string | null
): Tour {
  const settings = getSettings();
  const effectiveUserId = userId ?? currentAuthUserId;
  const tourId = generateId();
  const now = new Date().toISOString();
  
  // Use custom start point if provided, otherwise use settings default (headquarters or startPoint)
  const startPoint = customStartPoint || 
    (settings.headquarters?.lat && settings.headquarters?.lng
      ? { 
          lat: settings.headquarters.lat, 
          lng: settings.headquarters.lng, 
          address: `${settings.headquarters.address}, ${settings.headquarters.postalCode} ${settings.headquarters.city}` 
        }
      : settings.startPoint);
  
  const tempTour: Tour = {
    id: tourId,
    name,
    date,
    startPoint,
    status: 'planning',
    totalDistance: null,
    totalDuration: null,
    userId: effectiveUserId || null,
    // V2 fields
    startAddressId: null,
    finalReport: null,
    reportValidatedAt: null,
    reportSentAt: null,
    createdAt: now,
    updatedAt: now,
  };
  
  toursCache.push(tempTour);
  
  // Create visits with matching IDs
  const visitIds: string[] = [];
  clientIds.forEach((clientId, index) => {
    const visitId = generateId();
    visitIds.push(visitId);
    
    const tempVisit: Visit = {
      id: visitId,
      tourId: tourId,
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
      createdAt: now,
      updatedAt: now,
    };
    visitsCache.push(tempVisit);
  });
  
  // Sync to Supabase in background with SAME IDs
  supabase.from('clozer_tours').insert({
    id: tourId,
    name,
    date,
    start_lat: startPoint.lat,
    start_lng: startPoint.lng,
    start_address: startPoint.address,
    status: 'planning',
    user_id: effectiveUserId || null,
    created_at: now,
    updated_at: now,
  }).then(({ error: tourError }) => {
    if (tourError) {
      console.error('Error creating tour:', tourError);
      return;
    }
    
    // Insert visits with matching IDs
    const visitsToInsert = clientIds.map((clientId, index) => ({
      id: visitIds[index],
      tour_id: tourId,
      client_id: clientId,
      order_index: index,
      status: 'pending',
      estimated_duration: settings.defaultVisitDuration,
      created_at: now,
      updated_at: now,
    }));
    
    supabase.from('clozer_visits').insert(visitsToInsert).then(({ error: visitsError }) => {
      if (visitsError) console.error('Error creating visits:', visitsError);
    });
  });
  
  return tempTour;
}

export async function updateTourAsync(id: string, updates: Partial<Tour>): Promise<Tour | null> {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.totalDistance !== undefined) dbUpdates.total_distance = updates.totalDistance;
  if (updates.totalDuration !== undefined) dbUpdates.total_duration = updates.totalDuration;
  if (updates.startPoint) {
    dbUpdates.start_lat = updates.startPoint.lat;
    dbUpdates.start_lng = updates.startPoint.lng;
    dbUpdates.start_address = updates.startPoint.address;
  }
  // V2 fields
  if (updates.startAddressId !== undefined) dbUpdates.start_address_id = updates.startAddressId;
  if (updates.finalReport !== undefined) dbUpdates.final_report = updates.finalReport;
  if (updates.reportValidatedAt !== undefined) dbUpdates.report_validated_at = updates.reportValidatedAt;
  if (updates.reportSentAt !== undefined) dbUpdates.report_sent_at = updates.reportSentAt;
  
  const { data, error } = await supabase
    .from('clozer_tours')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating tour:', error);
    return null;
  }
  
  const updatedTour = fromDbTour(data);
  const index = toursCache.findIndex(t => t.id === id);
  if (index !== -1) {
    toursCache[index] = updatedTour;
  }
  
  return updatedTour;
}

export function updateTour(id: string, updates: Partial<Tour>): Tour | null {
  const index = toursCache.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  toursCache[index] = {
    ...toursCache[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  updateTourAsync(id, updates);
  
  return toursCache[index];
}

export async function deleteTourAsync(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('clozer_tours')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting tour:', error);
    return false;
  }
  
  toursCache = toursCache.filter(t => t.id !== id);
  visitsCache = visitsCache.filter(v => v.tourId !== id);
  return true;
}

export function deleteTour(id: string): boolean {
  toursCache = toursCache.filter(t => t.id !== id);
  visitsCache = visitsCache.filter(v => v.tourId !== id);
  deleteTourAsync(id);
  return true;
}

export function getToursByUser(userId: string): Tour[] {
  return toursCache.filter(t => t.userId === userId);
}

// ==================== VISITS ====================

let visitsCache: Visit[] = [];
let visitsCacheLoaded = false;

export async function getVisitsAsync(): Promise<Visit[]> {
  const { data, error } = await supabase
    .from('clozer_visits')
    .select('*')
    .order('order_index');
  
  if (error) {
    console.error('Error fetching visits:', error);
    return [];
  }
  
  return (data || []).map(fromDbVisit);
}

export function getVisits(): Visit[] {
  if (!visitsCacheLoaded) {
    getVisitsAsync().then(visits => {
      visitsCache = visits;
      visitsCacheLoaded = true;
    });
  }
  return visitsCache;
}

export async function refreshVisits(): Promise<Visit[]> {
  visitsCache = await getVisitsAsync();
  visitsCacheLoaded = true;
  return visitsCache;
}

export function saveVisits(visits: Visit[]): void {
  visitsCache = visits;
}

export function getVisitsByTour(tourId: string): Visit[] {
  return visitsCache
    .filter(v => v.tourId === tourId)
    .sort((a, b) => a.order - b.order);
}

export function getVisit(id: string): Visit | undefined {
  return visitsCache.find(v => v.id === id);
}

export function addVisit(visit: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>): Visit {
  const newId = generateId();
  const now = new Date().toISOString();
  
  const tempVisit: Visit = {
    ...visit,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  
  visitsCache.push(tempVisit);
  
  // Sync to Supabase in background - include ID!
  supabase.from('clozer_visits').insert({
    id: newId,
    tour_id: visit.tourId,
    client_id: visit.clientId,
    order_index: visit.order,
    status: visit.status,
    visited_at: visit.visitedAt,
    notes: visit.notes,
    absent_strategy: visit.absentStrategy,
    estimated_arrival: visit.estimatedArrival,
    estimated_duration: visit.estimatedDuration,
    distance_from_previous: visit.distanceFromPrevious,
    duration_from_previous: visit.durationFromPrevious,
    created_at: now,
    updated_at: now,
  }).then(({ error }) => {
    if (error) console.error('Error adding visit:', error);
  });
  
  return tempVisit;
}

export async function updateVisitAsync(id: string, updates: Partial<Visit>): Promise<Visit | null> {
  const dbUpdates: any = {};
  if (updates.order !== undefined) dbUpdates.order_index = updates.order;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.visitedAt !== undefined) dbUpdates.visited_at = updates.visitedAt;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.absentStrategy !== undefined) dbUpdates.absent_strategy = updates.absentStrategy;
  if (updates.estimatedArrival !== undefined) dbUpdates.estimated_arrival = updates.estimatedArrival;
  if (updates.estimatedDuration !== undefined) dbUpdates.estimated_duration = updates.estimatedDuration;
  if (updates.distanceFromPrevious !== undefined) dbUpdates.distance_from_previous = updates.distanceFromPrevious;
  if (updates.durationFromPrevious !== undefined) dbUpdates.duration_from_previous = updates.durationFromPrevious;
  
  const { data, error } = await supabase
    .from('clozer_visits')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating visit:', error);
    return null;
  }
  
  const updatedVisit = fromDbVisit(data);
  const index = visitsCache.findIndex(v => v.id === id);
  if (index !== -1) {
    visitsCache[index] = updatedVisit;
  }
  
  return updatedVisit;
}

export function updateVisit(id: string, updates: Partial<Visit>): Visit | null {
  const index = visitsCache.findIndex(v => v.id === id);
  if (index === -1) return null;
  
  visitsCache[index] = {
    ...visitsCache[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  updateVisitAsync(id, updates);
  
  return visitsCache[index];
}

export function updateVisitsOrder(tourId: string, orderedVisitIds: string[]): void {
  orderedVisitIds.forEach((visitId, index) => {
    const visitIndex = visitsCache.findIndex(v => v.id === visitId);
    if (visitIndex !== -1) {
      visitsCache[visitIndex].order = index;
      visitsCache[visitIndex].updatedAt = new Date().toISOString();
      
      // Sync to Supabase
      supabase.from('clozer_visits').update({ order_index: index }).eq('id', visitId);
    }
  });
}

// ==================== QUOTES ====================

let quotesCache: Quote[] = [];
let quotesCacheLoaded = false;

export async function getQuotesAsync(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('clozer_quotes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
  
  return (data || []).map(fromDbQuote);
}

export function getQuotes(): Quote[] {
  if (!quotesCacheLoaded) {
    getQuotesAsync().then(quotes => {
      quotesCache = quotes;
      quotesCacheLoaded = true;
    });
  }
  return quotesCache;
}

export function saveQuotes(quotes: Quote[]): void {
  quotesCache = quotes;
}

export function getQuote(id: string): Quote | undefined {
  return quotesCache.find(q => q.id === id);
}

export function getQuotesByClient(clientId: string): Quote[] {
  return quotesCache.filter(q => q.clientId === clientId);
}

export function addQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Quote {
  const newId = generateId();
  const now = new Date().toISOString();
  
  const tempQuote: Quote = {
    ...quote,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  
  quotesCache.push(tempQuote);
  
  // Sync to Supabase in background - include ID!
  supabase.from('clozer_quotes').insert({
    id: newId,
    visit_id: quote.visitId,
    client_id: quote.clientId,
    date: quote.date,
    status: quote.status,
    client_name: quote.clientName,
    client_address: quote.clientAddress,
    client_phone: quote.clientPhone,
    items: quote.items,
    notes: quote.notes,
    total_ht: quote.totalHT,
    tva: quote.tva,
    total_ttc: quote.totalTTC,
    signature_data: quote.signatureData,
    created_at: now,
    updated_at: now,
  }).then(({ error }) => {
    if (error) console.error('Error adding quote:', error);
  });
  
  return tempQuote;
}

export function updateQuote(id: string, updates: Partial<Quote>): Quote | null {
  const index = quotesCache.findIndex(q => q.id === id);
  if (index === -1) return null;
  
  quotesCache[index] = {
    ...quotesCache[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  // Sync to Supabase in background
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.items !== undefined) dbUpdates.items = updates.items;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.totalHT !== undefined) dbUpdates.total_ht = updates.totalHT;
  if (updates.tva !== undefined) dbUpdates.tva = updates.tva;
  if (updates.totalTTC !== undefined) dbUpdates.total_ttc = updates.totalTTC;
  if (updates.signatureData !== undefined) dbUpdates.signature_data = updates.signatureData;
  
  supabase.from('clozer_quotes').update(dbUpdates).eq('id', id);
  
  return quotesCache[index];
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
  // V2 fields
  workingProfileHour: '17:30',
  headquarters: {
    address: '22 avenue de la République',
    city: 'Le Gond-Pontouvre',
    postalCode: '16160',
    lat: 45.6685,
    lng: 0.1512,
  },
  confirmationWords: ['TERMINER', 'VALIDER', 'CONFIRMER', 'ORANGE', 'ACCORD', 'CLOTURER', 'FINI'],
};

let settingsCache: AppSettings = DEFAULT_SETTINGS;
let settingsCacheLoaded = false;

export async function getSettingsAsync(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('clozer_settings')
    .select('*')
    .limit(1)
    .single();
  
  if (error || !data) {
    return DEFAULT_SETTINGS;
  }
  
  return fromDbSettings(data);
}

export function getSettings(): AppSettings {
  if (!settingsCacheLoaded) {
    getSettingsAsync().then(settings => {
      settingsCache = settings;
      settingsCacheLoaded = true;
    });
  }
  return settingsCache;
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  settingsCache = { ...settingsCache, ...updates };
  
  // Sync to Supabase in background
  const dbUpdates: any = {};
  if (updates.startPoint) {
    dbUpdates.start_lat = updates.startPoint.lat;
    dbUpdates.start_lng = updates.startPoint.lng;
    dbUpdates.start_address = updates.startPoint.address;
  }
  if (updates.workStartTime !== undefined) dbUpdates.work_start_time = updates.workStartTime;
  if (updates.workEndTime !== undefined) dbUpdates.work_end_time = updates.workEndTime;
  if (updates.lunchBreakStart !== undefined) dbUpdates.lunch_break_start = updates.lunchBreakStart;
  if (updates.lunchBreakEnd !== undefined) dbUpdates.lunch_break_end = updates.lunchBreakEnd;
  if (updates.defaultVisitDuration !== undefined) dbUpdates.default_visit_duration = updates.defaultVisitDuration;
  if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
  if (updates.companyAddress !== undefined) dbUpdates.company_address = updates.companyAddress;
  if (updates.companyPhone !== undefined) dbUpdates.company_phone = updates.companyPhone;
  if (updates.companySiret !== undefined) dbUpdates.company_siret = updates.companySiret;
  // V2 fields
  if (updates.workingProfileHour !== undefined) dbUpdates.working_profile_hour = updates.workingProfileHour;
  if (updates.headquarters) {
    dbUpdates.headquarters_address = updates.headquarters.address;
    dbUpdates.headquarters_city = updates.headquarters.city;
    dbUpdates.headquarters_postal_code = updates.headquarters.postalCode;
    dbUpdates.headquarters_lat = updates.headquarters.lat;
    dbUpdates.headquarters_lng = updates.headquarters.lng;
  }
  if (updates.confirmationWords !== undefined) dbUpdates.confirmation_words = updates.confirmationWords;
  
  supabase.from('clozer_settings').update(dbUpdates).eq('id', '00000000-0000-0000-0000-000000000001');
  
  return settingsCache;
}

// ==================== USERS ====================

let usersCache: User[] = [];
let usersCacheLoaded = false;

const DEFAULT_ADMIN: User = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Administrateur',
  email: 'admin@clozer.fr',
  role: 'admin',
  phone: null,
  avatarUrl: null,
  notificationPreferences: { email: true, push: true, sms: false },
  theme: 'system',
  language: 'fr',
  lastActiveAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getUsersAsync(): Promise<User[]> {
  const { data, error } = await supabase
    .from('clozer_users')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching users:', error);
    return [DEFAULT_ADMIN];
  }
  
  return (data || []).map(fromDbUser);
}

export function getUsers(): User[] {
  if (!usersCacheLoaded) {
    getUsersAsync().then(users => {
      usersCache = users.length > 0 ? users : [DEFAULT_ADMIN];
      usersCacheLoaded = true;
    });
    return [DEFAULT_ADMIN];
  }
  return usersCache.length > 0 ? usersCache : [DEFAULT_ADMIN];
}

export function saveUsers(users: User[]): void {
  usersCache = users;
}

export function getUser(id: string): User | undefined {
  return usersCache.find(u => u.id === id);
}

export function addUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
  const newId = generateId();
  const now = new Date().toISOString();
  
  const tempUser: User = {
    ...user,
    id: newId,
    phone: user.phone || null,
    avatarUrl: user.avatarUrl || null,
    notificationPreferences: user.notificationPreferences || { email: true, push: true, sms: false },
    theme: user.theme || 'system',
    language: user.language || 'fr',
    lastActiveAt: null,
    createdAt: now,
    updatedAt: now,
  };
  
  usersCache.push(tempUser);
  
  // Sync to Supabase in background - IMPORTANT: include the ID!
  supabase.from('clozer_users').insert({
    id: newId,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || null,
    avatar_url: user.avatarUrl || null,
    notification_preferences: user.notificationPreferences || { email: true, push: true, sms: false },
    theme: user.theme || 'system',
    language: user.language || 'fr',
    created_at: now,
    updated_at: now,
  }).then(({ error }) => {
    if (error) {
      console.error('Error adding user to Supabase:', error);
    }
  });
  
  return tempUser;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const index = usersCache.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  usersCache[index] = {
    ...usersCache[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  // Sync to Supabase in background
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  
  supabase.from('clozer_users').update(dbUpdates).eq('id', id);
  
  return usersCache[index];
}

export function deleteUser(id: string): boolean {
  if (id === '00000000-0000-0000-0000-000000000001') return false;
  
  usersCache = usersCache.filter(u => u.id !== id);
  
  // Update clients assigned to this user
  clientsCache = clientsCache.map(c => 
    c.assignedTo === id ? { ...c, assignedTo: null, updatedAt: new Date().toISOString() } : c
  );
  
  // Sync to Supabase in background
  supabase.from('clozer_users').delete().eq('id', id);
  supabase.from('clozer_clients').update({ assigned_to: null }).eq('assigned_to', id);
  
  return true;
}

export function getCommerciaux(): User[] {
  return usersCache.filter(u => u.role === 'commercial');
}

// ==================== CURRENT USER HELPERS ====================

/**
 * Get the current user from cache using the authenticated user ID
 * @deprecated Use UserContext.currentUser instead for React components
 */
export function getCurrentUser(): User | null {
  if (!currentAuthUserId) return null;
  return getUser(currentAuthUserId) || null;
}

/**
 * @deprecated Session is now managed by Supabase Auth via UserContext
 * Use setAuthenticatedUserId instead
 */
export function setCurrentUser(userId: string | null): void {
  setAuthenticatedUserId(userId);
}

/**
 * Check if the current authenticated user is an admin
 * @deprecated Use UserContext.isAdmin instead
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

// ==================== CLIENTS PAR COMMERCIAL ====================

export function getClientsByUser(userId: string): Client[] {
  return clientsCache.filter(c => c.assignedTo === userId);
}

export function getUnassignedClients(): Client[] {
  return clientsCache.filter(c => !c.assignedTo);
}

export function assignClientToUser(clientId: string, userId: string | null): Client | null {
  return updateClient(clientId, { assignedTo: userId });
}

export function assignClientsToUser(clientIds: string[], userId: string | null): void {
  clientIds.forEach(clientId => {
    updateClient(clientId, { assignedTo: userId });
  });
}

// ==================== VISIT REPORTS ====================

let reportsCache: VisitReport[] = [];
let reportsCacheLoaded = false;

export async function getVisitReportsAsync(): Promise<VisitReport[]> {
  const { data, error } = await supabase
    .from('clozer_visit_reports')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching visit reports:', error);
    return [];
  }
  
  return (data || []).map(fromDbVisitReport);
}

export function getVisitReports(): VisitReport[] {
  if (!reportsCacheLoaded) {
    getVisitReportsAsync().then(reports => {
      reportsCache = reports;
      reportsCacheLoaded = true;
    });
  }
  return reportsCache;
}

export function saveVisitReports(reports: VisitReport[]): void {
  reportsCache = reports;
}

export function getVisitReport(id: string): VisitReport | undefined {
  return reportsCache.find(r => r.id === id);
}

export function getReportsByVisit(visitId: string): VisitReport[] {
  return reportsCache
    .filter(r => r.visitId === visitId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReportsByClient(clientId: string): VisitReport[] {
  return reportsCache
    .filter(r => r.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addVisitReport(report: Omit<VisitReport, 'id' | 'createdAt' | 'updatedAt'>): VisitReport {
  const newId = generateId();
  const now = new Date().toISOString();
  
  const tempReport: VisitReport = {
    ...report,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  
  reportsCache.push(tempReport);
  
  // Sync to Supabase in background - include ID!
  supabase.from('clozer_visit_reports').insert({
    id: newId,
    visit_id: report.visitId,
    client_id: report.clientId,
    content: report.content,
    created_by: report.createdBy,
    created_at: now,
    updated_at: now,
  }).then(({ error }) => {
    if (error) console.error('Error adding visit report:', error);
  });
  
  return tempReport;
}

export function updateVisitReport(id: string, updates: Partial<VisitReport>): VisitReport | null {
  const index = reportsCache.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  reportsCache[index] = {
    ...reportsCache[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  // Sync to Supabase in background
  const dbUpdates: any = {};
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  
  supabase.from('clozer_visit_reports').update(dbUpdates).eq('id', id);
  
  return reportsCache[index];
}

export function deleteVisitReport(id: string): boolean {
  reportsCache = reportsCache.filter(r => r.id !== id);
  supabase.from('clozer_visit_reports').delete().eq('id', id);
  return true;
}

// ==================== CLIENT STATUS (V2) ====================

export function getActiveClients(): Client[] {
  return clientsCache.filter(c => c.status === 'active');
}

export function getInactiveClients(): Client[] {
  return clientsCache.filter(c => c.status === 'inactive');
}

export async function deactivateClient(
  clientId: string, 
  reason: string, 
  deactivatedBy: string
): Promise<Client | null> {
  const now = new Date().toISOString();
  return updateClientAsync(clientId, {
    status: 'inactive',
    deactivationReason: reason,
    deactivatedAt: now,
    deactivatedBy: deactivatedBy,
  });
}

export async function reactivateClient(clientId: string): Promise<Client | null> {
  return updateClientAsync(clientId, {
    status: 'active',
    deactivationReason: null,
    deactivatedAt: null,
    deactivatedBy: null,
  });
}

// ==================== TOUR NOTES (V2) ====================

let tourNotesCache: TourNote[] = [];
let tourNotesCacheLoaded = false;

export async function getTourNotesAsync(tourId?: string): Promise<TourNote[]> {
  let query = supabase
    .from('clozer_tour_notes')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (tourId) {
    query = query.eq('tour_id', tourId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching tour notes:', error);
    return [];
  }
  
  return (data || []).map(fromDbTourNote);
}

export function getTourNotes(tourId: string): TourNote[] {
  return tourNotesCache
    .filter(n => n.tourId === tourId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function addTourNote(tourId: string, content: string): Promise<TourNote | null> {
  const { data, error } = await supabase
    .from('clozer_tour_notes')
    .insert({ tour_id: tourId, content })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding tour note:', error);
    return null;
  }
  
  const newNote = fromDbTourNote(data);
  tourNotesCache.push(newNote);
  return newNote;
}

export async function updateTourNote(id: string, content: string): Promise<TourNote | null> {
  const { data, error } = await supabase
    .from('clozer_tour_notes')
    .update({ content })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating tour note:', error);
    return null;
  }
  
  const updatedNote = fromDbTourNote(data);
  const index = tourNotesCache.findIndex(n => n.id === id);
  if (index !== -1) {
    tourNotesCache[index] = updatedNote;
  }
  return updatedNote;
}

export async function deleteTourNote(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('clozer_tour_notes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting tour note:', error);
    return false;
  }
  
  tourNotesCache = tourNotesCache.filter(n => n.id !== id);
  return true;
}

// ==================== USER ADDRESSES (V2) ====================

let userAddressesCache: UserAddress[] = [];
let userAddressesCacheLoaded = false;

export async function getUserAddressesAsync(userId?: string): Promise<UserAddress[]> {
  let query = supabase
    .from('clozer_user_addresses')
    .select('*')
    .order('name');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching user addresses:', error);
    return [];
  }
  
  return (data || []).map(fromDbUserAddress);
}

export function getUserAddresses(userId: string): UserAddress[] {
  return userAddressesCache.filter(a => a.userId === userId);
}

export function getDefaultUserAddress(userId: string): UserAddress | undefined {
  return userAddressesCache.find(a => a.userId === userId && a.isDefault);
}

export async function addUserAddress(
  address: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserAddress | null> {
  // If this is the first address or marked as default, unset other defaults
  if (address.isDefault) {
    await supabase
      .from('clozer_user_addresses')
      .update({ is_default: false })
      .eq('user_id', address.userId);
    
    userAddressesCache = userAddressesCache.map(a => 
      a.userId === address.userId ? { ...a, isDefault: false } : a
    );
  }
  
  const { data, error } = await supabase
    .from('clozer_user_addresses')
    .insert({
      user_id: address.userId,
      name: address.name,
      address: address.address,
      city: address.city,
      postal_code: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
      is_default: address.isDefault,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding user address:', error);
    return null;
  }
  
  const newAddress = fromDbUserAddress(data);
  userAddressesCache.push(newAddress);
  return newAddress;
}

export async function updateUserAddress(
  id: string, 
  updates: Partial<Omit<UserAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserAddress | null> {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode;
  if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
  if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;
  
  // If setting as default, unset other defaults
  if (updates.isDefault) {
    const existingAddress = userAddressesCache.find(a => a.id === id);
    if (existingAddress) {
      await supabase
        .from('clozer_user_addresses')
        .update({ is_default: false })
        .eq('user_id', existingAddress.userId)
        .neq('id', id);
      
      userAddressesCache = userAddressesCache.map(a => 
        a.userId === existingAddress.userId && a.id !== id ? { ...a, isDefault: false } : a
      );
    }
  }
  
  const { data, error } = await supabase
    .from('clozer_user_addresses')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user address:', error);
    return null;
  }
  
  const updatedAddress = fromDbUserAddress(data);
  const index = userAddressesCache.findIndex(a => a.id === id);
  if (index !== -1) {
    userAddressesCache[index] = updatedAddress;
  }
  return updatedAddress;
}

export async function deleteUserAddress(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('clozer_user_addresses')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting user address:', error);
    return false;
  }
  
  userAddressesCache = userAddressesCache.filter(a => a.id !== id);
  return true;
}

// ==================== REACTIVATION REQUESTS (V2) ====================

let reactivationRequestsCache: ReactivationRequest[] = [];
let reactivationRequestsCacheLoaded = false;

export async function getReactivationRequestsAsync(status?: ReactivationRequestStatus): Promise<ReactivationRequest[]> {
  let query = supabase
    .from('clozer_reactivation_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching reactivation requests:', error);
    return [];
  }
  
  return (data || []).map(fromDbReactivationRequest);
}

export function getReactivationRequests(status?: ReactivationRequestStatus): ReactivationRequest[] {
  if (status) {
    return reactivationRequestsCache.filter(r => r.status === status);
  }
  return reactivationRequestsCache;
}

export function getPendingReactivationRequests(): ReactivationRequest[] {
  return reactivationRequestsCache.filter(r => r.status === 'pending');
}

export async function createReactivationRequest(
  clientId: string,
  requestedBy: string,
  reason: string
): Promise<ReactivationRequest | null> {
  const { data, error } = await supabase
    .from('clozer_reactivation_requests')
    .insert({
      client_id: clientId,
      requested_by: requestedBy,
      reason: reason,
      status: 'pending',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating reactivation request:', error);
    return null;
  }
  
  const newRequest = fromDbReactivationRequest(data);
  reactivationRequestsCache.push(newRequest);
  return newRequest;
}

export async function reviewReactivationRequest(
  id: string,
  reviewedBy: string,
  approved: boolean,
  comment?: string
): Promise<ReactivationRequest | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('clozer_reactivation_requests')
    .update({
      status: approved ? 'approved' : 'rejected',
      reviewed_by: reviewedBy,
      review_comment: comment || null,
      reviewed_at: now,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error reviewing reactivation request:', error);
    return null;
  }
  
  const updatedRequest = fromDbReactivationRequest(data);
  const index = reactivationRequestsCache.findIndex(r => r.id === id);
  if (index !== -1) {
    reactivationRequestsCache[index] = updatedRequest;
  }
  
  // If approved, reactivate the client
  if (approved) {
    await reactivateClient(updatedRequest.clientId);
  }
  
  return updatedRequest;
}

// ==================== USER SUPERVISORS (V2) ====================

let userSupervisorsCache: UserSupervisor[] = [];
let userSupervisorsCacheLoaded = false;

export async function getUserSupervisorsAsync(userId?: string): Promise<UserSupervisor[]> {
  let query = supabase
    .from('clozer_user_supervisors')
    .select('*');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching user supervisors:', error);
    return [];
  }
  
  return (data || []).map(fromDbUserSupervisor);
}

export function getUserSupervisors(userId: string): UserSupervisor[] {
  return userSupervisorsCache.filter(s => s.userId === userId);
}

export function getSupervisorIds(userId: string): string[] {
  return userSupervisorsCache
    .filter(s => s.userId === userId)
    .map(s => s.supervisorId);
}

export async function setUserSupervisors(userId: string, supervisorIds: string[]): Promise<boolean> {
  // Delete existing supervisors
  const { error: deleteError } = await supabase
    .from('clozer_user_supervisors')
    .delete()
    .eq('user_id', userId);
  
  if (deleteError) {
    console.error('Error deleting user supervisors:', deleteError);
    return false;
  }
  
  // Remove from cache
  userSupervisorsCache = userSupervisorsCache.filter(s => s.userId !== userId);
  
  // Insert new supervisors
  if (supervisorIds.length > 0) {
    const inserts = supervisorIds.map(supervisorId => ({
      user_id: userId,
      supervisor_id: supervisorId,
    }));
    
    const { data, error: insertError } = await supabase
      .from('clozer_user_supervisors')
      .insert(inserts)
      .select();
    
    if (insertError) {
      console.error('Error inserting user supervisors:', insertError);
      return false;
    }
    
    if (data) {
      userSupervisorsCache.push(...data.map(fromDbUserSupervisor));
    }
  }
  
  return true;
}

// ==================== TOUR REPORT (V2) ====================

export async function validateTourReport(
  tourId: string, 
  finalReport: string
): Promise<Tour | null> {
  const now = new Date().toISOString();
  return updateTourAsync(tourId, {
    finalReport,
    reportValidatedAt: now,
    status: 'completed',
  } as Partial<Tour>);
}

export async function markTourReportSent(tourId: string): Promise<Tour | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('clozer_tours')
    .update({ report_sent_at: now })
    .eq('id', tourId)
    .select()
    .single();
  
  if (error) {
    console.error('Error marking tour report as sent:', error);
    return null;
  }
  
  const updatedTour = fromDbTour(data);
  const index = toursCache.findIndex(t => t.id === tourId);
  if (index !== -1) {
    toursCache[index] = updatedTour;
  }
  
  return updatedTour;
}

// Get random confirmation word for tour end
export function getRandomConfirmationWord(): string {
  const words = settingsCache.confirmationWords || ['TERMINER', 'VALIDER', 'CONFIRMER'];
  return words[Math.floor(Math.random() * words.length)];
}

// ==================== EXPORT / IMPORT DATA ====================

export function exportAllData(): string {
  const data = {
    clients: clientsCache,
    tours: toursCache,
    visits: visitsCache,
    quotes: quotesCache,
    users: usersCache,
    settings: settingsCache,
    visitReports: reportsCache,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.clients) clientsCache = data.clients;
    if (data.tours) toursCache = data.tours;
    if (data.visits) visitsCache = data.visits;
    if (data.quotes) quotesCache = data.quotes;
    if (data.users) usersCache = data.users;
    if (data.settings) settingsCache = data.settings;
    if (data.visitReports) reportsCache = data.visitReports;
    return true;
  } catch {
    return false;
  }
}

export async function clearAllData(): Promise<void> {
  // Clear Supabase tables (order matters due to foreign keys)
  try {
    // First delete dependent tables (using gte on created_at to match all records)
    const { error: e1 } = await supabase.from('clozer_visit_reports').delete().gte('created_at', '1970-01-01');
    if (e1) console.error('Error deleting visit_reports:', e1);
    
    const { error: e2 } = await supabase.from('clozer_tour_notes').delete().gte('created_at', '1970-01-01');
    if (e2) console.error('Error deleting tour_notes:', e2);
    
    const { error: e3 } = await supabase.from('clozer_visits').delete().gte('created_at', '1970-01-01');
    if (e3) console.error('Error deleting visits:', e3);
    
    const { error: e4 } = await supabase.from('clozer_quotes').delete().gte('created_at', '1970-01-01');
    if (e4) console.error('Error deleting quotes:', e4);
    
    const { error: e5 } = await supabase.from('clozer_tours').delete().gte('created_at', '1970-01-01');
    if (e5) console.error('Error deleting tours:', e5);
    
    const { error: e6 } = await supabase.from('clozer_clients').delete().gte('created_at', '1970-01-01');
    if (e6) console.error('Error deleting clients:', e6);
    
    const { error: e7 } = await supabase.from('clozer_user_addresses').delete().gte('created_at', '1970-01-01');
    if (e7) console.error('Error deleting user_addresses:', e7);
    
    const { error: e8 } = await supabase.from('clozer_reactivation_requests').delete().gte('created_at', '1970-01-01');
    if (e8) console.error('Error deleting reactivation_requests:', e8);
    
    const { error: e9 } = await supabase.from('clozer_user_supervisors').delete().gte('created_at', '1970-01-01');
    if (e9) console.error('Error deleting user_supervisors:', e9);
    
    console.log('✅ Database cleared successfully (clients, tours, visits, notes, quotes)');
  } catch (error) {
    console.error('Error clearing database:', error);
  }

  // Clear in-memory caches
  clientsCache = [];
  toursCache = [];
  visitsCache = [];
  quotesCache = [];
  usersCache = [DEFAULT_ADMIN];
  settingsCache = DEFAULT_SETTINGS;
  reportsCache = [];
  // V2 caches
  tourNotesCache = [];
  userAddressesCache = [];
  reactivationRequestsCache = [];
  userSupervisorsCache = [];
  currentAuthUserId = null;
}

// ==================== INITIAL DATA LOAD ====================

export async function initializeData(): Promise<void> {
  console.log('Initializing data from Supabase...');
  
  try {
    const [
      clients, 
      tours, 
      visits, 
      quotes, 
      users, 
      settings, 
      reports,
      tourNotes,
      userAddresses,
      reactivationRequests,
      userSupervisors,
    ] = await Promise.all([
      getClientsAsync(),
      getToursAsync(),
      getVisitsAsync(),
      getQuotesAsync(),
      getUsersAsync(),
      getSettingsAsync(),
      getVisitReportsAsync(),
      getTourNotesAsync(),
      getUserAddressesAsync(),
      getReactivationRequestsAsync(),
      getUserSupervisorsAsync(),
    ]);
    
    clientsCache = clients;
    clientsCacheLoaded = true;
    
    toursCache = tours;
    toursCacheLoaded = true;
    
    visitsCache = visits;
    visitsCacheLoaded = true;
    
    quotesCache = quotes;
    quotesCacheLoaded = true;
    
    usersCache = users.length > 0 ? users : [DEFAULT_ADMIN];
    usersCacheLoaded = true;
    
    settingsCache = settings;
    settingsCacheLoaded = true;
    
    reportsCache = reports;
    reportsCacheLoaded = true;
    
    // V2 caches
    tourNotesCache = tourNotes;
    tourNotesCacheLoaded = true;
    
    userAddressesCache = userAddresses;
    userAddressesCacheLoaded = true;
    
    reactivationRequestsCache = reactivationRequests;
    reactivationRequestsCacheLoaded = true;
    
    userSupervisorsCache = userSupervisors;
    userSupervisorsCacheLoaded = true;
    
    console.log('Data initialized:', {
      clients: clients.length,
      tours: tours.length,
      visits: visits.length,
      quotes: quotes.length,
      users: users.length,
      reports: reports.length,
      tourNotes: tourNotes.length,
      userAddresses: userAddresses.length,
      reactivationRequests: reactivationRequests.length,
      userSupervisors: userSupervisors.length,
    });
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}
