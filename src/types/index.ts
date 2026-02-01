// Types pour l'application Clozer - Gestion de tournées commerciales
// V2 Evolution - Full CRM Features

// ==================== USER TYPES ====================
export type UserRole = 'admin' | 'commercial';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  notificationPreferences: NotificationPreferences;
  theme: ThemePreference;
  language: string;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ==================== CLIENT TYPES ====================
export type ClientStatus = 'active' | 'inactive';
export type AvailabilityProfile = 'retired' | 'working' | null;
export type PreferredContactMethod = 'phone' | 'email' | 'sms' | 'visit';

export interface Client {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  telDomicile: string | null;
  portableM: string | null;
  portableMme: string | null;
  email: string | null;
  adresse: string;
  codePostal: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  assignedTo: string | null;
  // V2 Status fields
  status: ClientStatus;
  availabilityProfile: AvailabilityProfile;
  deactivationReason: string | null;
  deactivatedAt: string | null;
  deactivatedBy: string | null;
  // V2 Extended info
  birthday: string | null;
  companyName: string | null;
  jobTitle: string | null;
  interests: string[];
  preferredContactMethod: PreferredContactMethod | null;
  bestContactTime: string | null;
  // V2 Analytics fields
  lastVisitedAt: string | null;
  visitCount: number;
  totalRevenue: number;
  priorityScore: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ==================== CLIENT NOTES ====================
export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  isPinned: boolean;
  tags: string[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== CLIENT INTERACTIONS (Timeline) ====================
export type InteractionType = 'visit' | 'call' | 'email' | 'quote_sent' | 'quote_accepted' | 'quote_rejected' | 'note' | 'status_change' | 'other';

export interface ClientInteraction {
  id: string;
  clientId: string;
  type: InteractionType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

// ==================== CLIENT PHOTOS ====================
export interface ClientPhoto {
  id: string;
  clientId: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  createdBy: string | null;
  createdAt: string;
}

// ==================== TOUR TYPES ====================
export type TourStatus = 'planning' | 'in_progress' | 'completed' | 'paused';

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
  totalDistance: number | null;
  totalDuration: number | null;
  userId: string | null;
  startAddressId: string | null;
  finalReport: string | null;
  reportValidatedAt: string | null;
  reportSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== TOUR NOTES (Carnet de bord) ====================
export interface TourNote {
  id: string;
  tourId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== VISIT TYPES ====================
export type VisitStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'absent'
  | 'postponed'
  | 'skipped';

export type AbsentStrategy = 
  | 'after_next'
  | 'on_return'
  | 'another_day';

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
  estimatedDuration: number;
  distanceFromPrevious: number | null;
  durationFromPrevious: number | null;
  createdAt: string;
  updatedAt: string;
  // Relation
  client?: Client;
}

// ==================== QUOTE TYPES ====================
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface Quote {
  id: string;
  visitId: string | null;
  clientId: string;
  date: string;
  status: QuoteStatus;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  items: QuoteItem[];
  notes: string | null;
  totalHT: number;
  tva: number;
  totalTTC: number;
  signatureData: string | null;
  // V2 fields
  validUntil: string | null;
  reminderSentAt: string | null;
  rejectionReason: string | null;
  followUpDate: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ==================== PRODUCTS CATALOG ====================
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  priceHT: number;
  tvaRate: number;
  sku: string | null;
  imageUrl: string | null;
  isActive: boolean;
  features: string[];
  competitorComparison: Record<string, string>;
  salesPitch: string | null;
  objectionHandlers: ObjectionHandler[];
  createdAt: string;
  updatedAt: string;
}

export interface ObjectionHandler {
  objection: string;
  response: string;
}

export interface ClientProduct {
  id: string;
  clientId: string;
  productId: string;
  quantity: number;
  purchaseDate: string;
  pricePaid: number;
  quoteId: string | null;
  notes: string | null;
  createdAt: string;
  // Relations
  product?: Product;
}

// ==================== SALES PIPELINE (Opportunities) ====================
export type OpportunityStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Opportunity {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  stage: OpportunityStage;
  estimatedValue: number;
  probability: number;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  lossReason: string | null;
  products: OpportunityProduct[];
  nextAction: string | null;
  nextActionDate: string | null;
  assignedTo: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  client?: Client;
}

export interface OpportunityProduct {
  productId: string;
  quantity: number;
  price: number;
}

// ==================== USER OBJECTIVES (Gamification) ====================
export type ObjectiveType = 'visits' | 'revenue' | 'quotes' | 'conversions' | 'new_clients';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface UserObjective {
  id: string;
  userId: string;
  type: ObjectiveType;
  targetValue: number;
  currentValue: number;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== ACHIEVEMENTS (Badges) ====================
export type AchievementCategory = 'visits' | 'revenue' | 'streak' | 'conversion' | 'special';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  conditionType: string;
  conditionValue: number;
  points: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  oduserId: string;
  achievementId: string;
  earnedAt: string;
  // Relations
  achievement?: Achievement;
}

// ==================== USER STATS ====================
export interface UserStats {
  id: string;
  userId: string;
  totalVisits: number;
  totalCompletedVisits: number;
  totalAbsentVisits: number;
  totalTours: number;
  totalCompletedTours: number;
  totalQuotes: number;
  totalAcceptedQuotes: number;
  totalRevenue: number;
  currentStreak: number;
  longestStreak: number;
  lastVisitDate: string | null;
  totalDistanceKm: number;
  totalPoints: number;
  level: number;
  updatedAt: string;
}

// ==================== NOTIFICATIONS ====================
export type NotificationType = 'reminder' | 'achievement' | 'alert' | 'info' | 'objective' | 'birthday' | 'quote_expiring' | 'client_inactive';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

// ==================== ACTIVITY LOG ====================
export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ==================== VISIT REPORTS ====================
export interface VisitReport {
  id: string;
  visitId: string;
  clientId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

// ==================== USER ADDRESSES ====================
export interface UserAddress {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== REACTIVATION REQUESTS ====================
export type ReactivationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ReactivationRequest {
  id: string;
  clientId: string;
  requestedBy: string;
  reason: string;
  status: ReactivationRequestStatus;
  reviewedBy: string | null;
  reviewComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  // Relations
  client?: Client;
  requester?: User;
  reviewer?: User;
}

// ==================== USER SUPERVISORS ====================
export interface UserSupervisor {
  id: string;
  userId: string;
  supervisorId: string;
  createdAt: string;
}

// ==================== APP SETTINGS ====================
export interface AppSettings {
  startPoint: {
    lat: number;
    lng: number;
    address: string;
  };
  workStartTime: string;
  workEndTime: string;
  lunchBreakStart: string | null;
  lunchBreakEnd: string | null;
  defaultVisitDuration: number;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companySiret: string;
  currentUserId: string | null;
  workingProfileHour: string;
  headquarters: {
    address: string;
    city: string;
    postalCode: string;
    lat: number | null;
    lng: number | null;
  };
  confirmationWords: string[];
}

// ==================== ROUTING & GEO TYPES ====================
export interface RouteSegment {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  distance: number;
  duration: number;
  geometry: [number, number][];
}

export interface OptimizedRoute {
  visits: Visit[];
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
}

export interface LatLng {
  lat: number;
  lng: number;
  address?: string;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  confidence: number;
}

// ==================== PREPARATION SHEET (Fiche de préparation) ====================
export interface VisitPreparationSheet {
  client: Client;
  lastVisit: {
    date: string;
    notes: string | null;
    report: string | null;
  } | null;
  recentInteractions: ClientInteraction[];
  activeQuotes: Quote[];
  purchaseHistory: ClientProduct[];
  totalSpent: number;
  daysSinceLastVisit: number | null;
  upcomingBirthday: boolean;
  suggestedProducts: Product[];
  notes: ClientNote[];
  priorityScore: number;
}

// ==================== DASHBOARD ANALYTICS ====================
export interface DashboardKPIs {
  // Visits
  totalVisits: number;
  completedVisits: number;
  visitSuccessRate: number;
  avgVisitsPerDay: number;
  // Revenue
  totalRevenue: number;
  avgDealSize: number;
  pipelineValue: number;
  // Clients
  totalClients: number;
  activeClients: number;
  newClientsThisPeriod: number;
  clientsToVisit: number;
  clientsOverdue: number;
  // Quotes
  totalQuotes: number;
  acceptedQuotes: number;
  conversionRate: number;
  avgQuoteValue: number;
  // Performance
  currentStreak: number;
  objectivesProgress: ObjectiveProgress[];
  recentAchievements: UserAchievement[];
}

export interface ObjectiveProgress {
  objective: UserObjective;
  percentComplete: number;
  remaining: number;
  onTrack: boolean;
}

// ==================== SMART SUGGESTIONS ====================
export interface TourSuggestion {
  id: string;
  name: string;
  date: string;
  clients: Client[];
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedVisits: number;
  zone: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface DailyPlan {
  date: string;
  suggestions: TourSuggestion[];
  totalClientsToVisit: number;
  clientsPerZone: Map<string, number>;
  recommendation: string;
}
