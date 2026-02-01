// Storage V2 - Extended features for Clozer Evolution
// Products, Opportunities, Objectives, Achievements, Notifications, etc.

import {
  Product,
  ClientProduct,
  Opportunity,
  OpportunityStage,
  UserObjective,
  ObjectiveType,
  PeriodType,
  Achievement,
  UserAchievement,
  UserStats,
  Notification,
  NotificationType,
  ActivityLog,
  ClientNote,
  ClientInteraction,
  InteractionType,
  ClientPhoto,
  VisitPreparationSheet,
  Client,
} from '@/types';
import { supabase } from './supabase';
import { generateId } from './utils';
import { 
  getClient, 
  getQuotesByClient, 
  getReportsByClient, 
  getVisits 
} from './storage';

// ==================== HELPER FUNCTIONS ====================

function fromDbProduct(db: any): Product {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    category: db.category,
    priceHT: db.price_ht,
    tvaRate: db.tva_rate,
    sku: db.sku,
    imageUrl: db.image_url,
    isActive: db.is_active,
    features: db.features || [],
    competitorComparison: db.competitor_comparison || {},
    salesPitch: db.sales_pitch,
    objectionHandlers: db.objection_handlers || [],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbClientProduct(db: any): ClientProduct {
  return {
    id: db.id,
    clientId: db.client_id,
    productId: db.product_id,
    quantity: db.quantity,
    purchaseDate: db.purchase_date,
    pricePaid: db.price_paid,
    quoteId: db.quote_id,
    notes: db.notes,
    createdAt: db.created_at,
  };
}

function fromDbOpportunity(db: any): Opportunity {
  return {
    id: db.id,
    clientId: db.client_id,
    title: db.title,
    description: db.description,
    stage: db.stage,
    estimatedValue: db.estimated_value,
    probability: db.probability,
    expectedCloseDate: db.expected_close_date,
    actualCloseDate: db.actual_close_date,
    lossReason: db.loss_reason,
    products: db.products || [],
    nextAction: db.next_action,
    nextActionDate: db.next_action_date,
    assignedTo: db.assigned_to,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbUserObjective(db: any): UserObjective {
  return {
    id: db.id,
    userId: db.user_id,
    type: db.type,
    targetValue: db.target_value,
    currentValue: db.current_value,
    periodType: db.period_type,
    periodStart: db.period_start,
    periodEnd: db.period_end,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbAchievement(db: any): Achievement {
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    description: db.description,
    icon: db.icon,
    category: db.category,
    conditionType: db.condition_type,
    conditionValue: db.condition_value,
    points: db.points,
    isActive: db.is_active,
    createdAt: db.created_at,
  };
}

function fromDbUserAchievement(db: any): UserAchievement {
  return {
    id: db.id,
    oduserId: db.user_id,
    achievementId: db.achievement_id,
    earnedAt: db.earned_at,
  };
}

function fromDbUserStats(db: any): UserStats {
  return {
    id: db.id,
    userId: db.user_id,
    totalVisits: db.total_visits,
    totalCompletedVisits: db.total_completed_visits,
    totalAbsentVisits: db.total_absent_visits,
    totalTours: db.total_tours,
    totalCompletedTours: db.total_completed_tours,
    totalQuotes: db.total_quotes,
    totalAcceptedQuotes: db.total_accepted_quotes,
    totalRevenue: db.total_revenue,
    currentStreak: db.current_streak,
    longestStreak: db.longest_streak,
    lastVisitDate: db.last_visit_date,
    totalDistanceKm: db.total_distance_km,
    totalPoints: db.total_points,
    level: db.level,
    updatedAt: db.updated_at,
  };
}

function fromDbNotification(db: any): Notification {
  return {
    id: db.id,
    userId: db.user_id,
    type: db.type,
    title: db.title,
    message: db.message,
    data: db.data || {},
    isRead: db.is_read,
    readAt: db.read_at,
    actionUrl: db.action_url,
    createdAt: db.created_at,
  };
}

function fromDbActivityLog(db: any): ActivityLog {
  return {
    id: db.id,
    userId: db.user_id,
    action: db.action,
    entityType: db.entity_type,
    entityId: db.entity_id,
    metadata: db.metadata || {},
    createdAt: db.created_at,
  };
}

function fromDbClientNote(db: any): ClientNote {
  return {
    id: db.id,
    clientId: db.client_id,
    content: db.content,
    isPinned: db.is_pinned,
    tags: db.tags || [],
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function fromDbClientInteraction(db: any): ClientInteraction {
  return {
    id: db.id,
    clientId: db.client_id,
    type: db.type,
    title: db.title,
    description: db.description,
    metadata: db.metadata || {},
    createdBy: db.created_by,
    createdAt: db.created_at,
  };
}

function fromDbClientPhoto(db: any): ClientPhoto {
  return {
    id: db.id,
    clientId: db.client_id,
    url: db.url,
    caption: db.caption,
    isPrimary: db.is_primary,
    createdBy: db.created_by,
    createdAt: db.created_at,
  };
}

// ==================== CACHES ====================

let productsCache: Product[] = [];
let productsCacheLoaded = false;

let clientProductsCache: ClientProduct[] = [];
let clientProductsCacheLoaded = false;

let opportunitiesCache: Opportunity[] = [];
let opportunitiesCacheLoaded = false;

let objectivesCache: UserObjective[] = [];
let objectivesCacheLoaded = false;

let achievementsCache: Achievement[] = [];
let achievementsCacheLoaded = false;

let userAchievementsCache: UserAchievement[] = [];
let userAchievementsCacheLoaded = false;

let userStatsCache: Map<string, UserStats> = new Map();

let notificationsCache: Notification[] = [];
let notificationsCacheLoaded = false;

let activityLogCache: ActivityLog[] = [];

let clientNotesCache: ClientNote[] = [];
let clientNotesCacheLoaded = false;

let clientInteractionsCache: ClientInteraction[] = [];
let clientInteractionsCacheLoaded = false;

let clientPhotosCache: ClientPhoto[] = [];
let clientPhotosCacheLoaded = false;

// ==================== PRODUCTS ====================

export async function getProductsAsync(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('clozer_products')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return (data || []).map(fromDbProduct);
}

export function getProducts(): Product[] {
  if (!productsCacheLoaded) {
    getProductsAsync().then(products => {
      productsCache = products;
      productsCacheLoaded = true;
    });
  }
  return productsCache;
}

export function getProduct(id: string): Product | undefined {
  return productsCache.find(p => p.id === id);
}

export function getActiveProducts(): Product[] {
  return productsCache.filter(p => p.isActive);
}

export function getProductsByCategory(category: string): Product[] {
  return productsCache.filter(p => p.category === category && p.isActive);
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
  const { data, error } = await supabase
    .from('clozer_products')
    .insert({
      name: product.name,
      description: product.description,
      category: product.category,
      price_ht: product.priceHT,
      tva_rate: product.tvaRate,
      sku: product.sku,
      image_url: product.imageUrl,
      is_active: product.isActive,
      features: product.features,
      competitor_comparison: product.competitorComparison,
      sales_pitch: product.salesPitch,
      objection_handlers: product.objectionHandlers,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    return null;
  }

  const newProduct = fromDbProduct(data);
  productsCache.push(newProduct);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.priceHT !== undefined) dbUpdates.price_ht = updates.priceHT;
  if (updates.tvaRate !== undefined) dbUpdates.tva_rate = updates.tvaRate;
  if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.features !== undefined) dbUpdates.features = updates.features;
  if (updates.competitorComparison !== undefined) dbUpdates.competitor_comparison = updates.competitorComparison;
  if (updates.salesPitch !== undefined) dbUpdates.sales_pitch = updates.salesPitch;
  if (updates.objectionHandlers !== undefined) dbUpdates.objection_handlers = updates.objectionHandlers;

  const { data, error } = await supabase
    .from('clozer_products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return null;
  }

  const updatedProduct = fromDbProduct(data);
  const index = productsCache.findIndex(p => p.id === id);
  if (index !== -1) {
    productsCache[index] = updatedProduct;
  }
  return updatedProduct;
}

// ==================== CLIENT PRODUCTS ====================

export async function getClientProductsAsync(clientId?: string): Promise<ClientProduct[]> {
  let query = supabase
    .from('clozer_client_products')
    .select('*')
    .order('purchase_date', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching client products:', error);
    return [];
  }

  return (data || []).map(fromDbClientProduct);
}

export function getClientProducts(clientId: string): ClientProduct[] {
  return clientProductsCache.filter(cp => cp.clientId === clientId);
}

export async function addClientProduct(
  clientProduct: Omit<ClientProduct, 'id' | 'createdAt'>
): Promise<ClientProduct | null> {
  const { data, error } = await supabase
    .from('clozer_client_products')
    .insert({
      client_id: clientProduct.clientId,
      product_id: clientProduct.productId,
      quantity: clientProduct.quantity,
      purchase_date: clientProduct.purchaseDate,
      price_paid: clientProduct.pricePaid,
      quote_id: clientProduct.quoteId,
      notes: clientProduct.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding client product:', error);
    return null;
  }

  const newClientProduct = fromDbClientProduct(data);
  clientProductsCache.push(newClientProduct);
  return newClientProduct;
}

// ==================== OPPORTUNITIES (Sales Pipeline) ====================

export async function getOpportunitiesAsync(filters?: {
  clientId?: string;
  stage?: OpportunityStage;
  assignedTo?: string;
}): Promise<Opportunity[]> {
  let query = supabase
    .from('clozer_opportunities')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters?.clientId) query = query.eq('client_id', filters.clientId);
  if (filters?.stage) query = query.eq('stage', filters.stage);
  if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }

  return (data || []).map(fromDbOpportunity);
}

export function getOpportunities(): Opportunity[] {
  if (!opportunitiesCacheLoaded) {
    getOpportunitiesAsync().then(opps => {
      opportunitiesCache = opps;
      opportunitiesCacheLoaded = true;
    });
  }
  return opportunitiesCache;
}

export function getOpportunitiesByStage(stage: OpportunityStage): Opportunity[] {
  return opportunitiesCache.filter(o => o.stage === stage);
}

export function getOpportunitiesByClient(clientId: string): Opportunity[] {
  return opportunitiesCache.filter(o => o.clientId === clientId);
}

export function getPipelineValue(): number {
  return opportunitiesCache
    .filter(o => !['won', 'lost'].includes(o.stage))
    .reduce((sum, o) => sum + (o.estimatedValue * o.probability / 100), 0);
}

export async function addOpportunity(
  opportunity: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from('clozer_opportunities')
    .insert({
      client_id: opportunity.clientId,
      title: opportunity.title,
      description: opportunity.description,
      stage: opportunity.stage,
      estimated_value: opportunity.estimatedValue,
      probability: opportunity.probability,
      expected_close_date: opportunity.expectedCloseDate,
      products: opportunity.products,
      next_action: opportunity.nextAction,
      next_action_date: opportunity.nextActionDate,
      assigned_to: opportunity.assignedTo,
      created_by: opportunity.createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding opportunity:', error);
    return null;
  }

  const newOpp = fromDbOpportunity(data);
  opportunitiesCache.push(newOpp);
  
  // Log activity
  await logActivity(opportunity.createdBy || null, 'opportunity_created', 'opportunity', newOpp.id, {
    title: opportunity.title,
    value: opportunity.estimatedValue,
  });

  return newOpp;
}

export async function updateOpportunity(
  id: string,
  updates: Partial<Opportunity>
): Promise<Opportunity | null> {
  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
  if (updates.estimatedValue !== undefined) dbUpdates.estimated_value = updates.estimatedValue;
  if (updates.probability !== undefined) dbUpdates.probability = updates.probability;
  if (updates.expectedCloseDate !== undefined) dbUpdates.expected_close_date = updates.expectedCloseDate;
  if (updates.actualCloseDate !== undefined) dbUpdates.actual_close_date = updates.actualCloseDate;
  if (updates.lossReason !== undefined) dbUpdates.loss_reason = updates.lossReason;
  if (updates.products !== undefined) dbUpdates.products = updates.products;
  if (updates.nextAction !== undefined) dbUpdates.next_action = updates.nextAction;
  if (updates.nextActionDate !== undefined) dbUpdates.next_action_date = updates.nextActionDate;

  const { data, error } = await supabase
    .from('clozer_opportunities')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opportunity:', error);
    return null;
  }

  const updatedOpp = fromDbOpportunity(data);
  const index = opportunitiesCache.findIndex(o => o.id === id);
  if (index !== -1) {
    opportunitiesCache[index] = updatedOpp;
  }
  return updatedOpp;
}

export async function moveOpportunityStage(
  id: string,
  newStage: OpportunityStage,
  lossReason?: string
): Promise<Opportunity | null> {
  const updates: Partial<Opportunity> = { stage: newStage };
  
  if (newStage === 'won' || newStage === 'lost') {
    updates.actualCloseDate = new Date().toISOString().split('T')[0];
    if (newStage === 'lost' && lossReason) {
      updates.lossReason = lossReason;
    }
  }

  return updateOpportunity(id, updates);
}

// ==================== USER OBJECTIVES ====================

export async function getUserObjectivesAsync(userId: string): Promise<UserObjective[]> {
  const { data, error } = await supabase
    .from('clozer_user_objectives')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('period_start', { ascending: false });

  if (error) {
    console.error('Error fetching user objectives:', error);
    return [];
  }

  return (data || []).map(fromDbUserObjective);
}

export function getUserObjectives(userId: string): UserObjective[] {
  return objectivesCache.filter(o => o.userId === userId && o.isActive);
}

export function getCurrentObjectives(userId: string): UserObjective[] {
  const today = new Date().toISOString().split('T')[0];
  return objectivesCache.filter(o => 
    o.userId === userId && 
    o.isActive && 
    o.periodStart <= today && 
    o.periodEnd >= today
  );
}

export async function addUserObjective(
  objective: Omit<UserObjective, 'id' | 'currentValue' | 'createdAt' | 'updatedAt'>
): Promise<UserObjective | null> {
  const { data, error } = await supabase
    .from('clozer_user_objectives')
    .insert({
      user_id: objective.userId,
      type: objective.type,
      target_value: objective.targetValue,
      current_value: 0,
      period_type: objective.periodType,
      period_start: objective.periodStart,
      period_end: objective.periodEnd,
      is_active: objective.isActive,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding user objective:', error);
    return null;
  }

  const newObjective = fromDbUserObjective(data);
  objectivesCache.push(newObjective);
  return newObjective;
}

export async function updateObjectiveProgress(
  id: string,
  currentValue: number
): Promise<UserObjective | null> {
  const { data, error } = await supabase
    .from('clozer_user_objectives')
    .update({ current_value: currentValue })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating objective progress:', error);
    return null;
  }

  const updatedObjective = fromDbUserObjective(data);
  const index = objectivesCache.findIndex(o => o.id === id);
  if (index !== -1) {
    objectivesCache[index] = updatedObjective;
  }

  // Check if objective is achieved
  if (currentValue >= updatedObjective.targetValue) {
    await createNotification({
      userId: updatedObjective.userId,
      type: 'objective',
      title: 'Objectif atteint ! 🎉',
      message: `Félicitations ! Vous avez atteint votre objectif de ${updatedObjective.type}.`,
      data: { objectiveId: id },
      actionUrl: '/gamification',
    });
  }

  return updatedObjective;
}

// ==================== ACHIEVEMENTS ====================

export async function getAchievementsAsync(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('clozer_achievements')
    .select('*')
    .eq('is_active', true)
    .order('points');

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return (data || []).map(fromDbAchievement);
}

export function getAchievements(): Achievement[] {
  if (!achievementsCacheLoaded) {
    getAchievementsAsync().then(achievements => {
      achievementsCache = achievements;
      achievementsCacheLoaded = true;
    });
  }
  return achievementsCache;
}

export async function getUserAchievementsAsync(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('clozer_user_achievements')
    .select('*, achievement:clozer_achievements(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    ...fromDbUserAchievement(d),
    achievement: d.achievement ? fromDbAchievement(d.achievement) : undefined,
  }));
}

export function getUserAchievements(userId: string): UserAchievement[] {
  return userAchievementsCache.filter(ua => ua.oduserId === userId);
}

export async function awardAchievement(
  userId: string,
  achievementCode: string
): Promise<UserAchievement | null> {
  const achievement = achievementsCache.find(a => a.code === achievementCode);
  if (!achievement) return null;

  // Check if already earned
  const existing = userAchievementsCache.find(
    ua => ua.oduserId === userId && ua.achievementId === achievement.id
  );
  if (existing) return existing;

  const { data, error } = await supabase
    .from('clozer_user_achievements')
    .insert({
      user_id: userId,
      achievement_id: achievement.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error awarding achievement:', error);
    return null;
  }

  const newUserAchievement = fromDbUserAchievement(data);
  userAchievementsCache.push(newUserAchievement);

  // Create notification
  await createNotification({
    userId,
    type: 'achievement',
    title: `Nouveau badge : ${achievement.name} ${achievement.icon}`,
    message: achievement.description,
    data: { achievementId: achievement.id, points: achievement.points },
    actionUrl: '/gamification',
  });

  // Update user stats with points
  await updateUserPoints(userId, achievement.points);

  return newUserAchievement;
}

// ==================== USER STATS ====================

export async function getUserStatsAsync(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('clozer_user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No stats yet, create default
      return createUserStats(userId);
    }
    console.error('Error fetching user stats:', error);
    return null;
  }

  return fromDbUserStats(data);
}

export function getUserStats(userId: string): UserStats | undefined {
  return userStatsCache.get(userId);
}

async function createUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('clozer_user_stats')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('Error creating user stats:', error);
    return null;
  }

  const stats = fromDbUserStats(data);
  userStatsCache.set(userId, stats);
  return stats;
}

export async function updateUserStats(
  userId: string,
  updates: Partial<Omit<UserStats, 'id' | 'userId' | 'updatedAt'>>
): Promise<UserStats | null> {
  const dbUpdates: any = {};
  if (updates.totalVisits !== undefined) dbUpdates.total_visits = updates.totalVisits;
  if (updates.totalCompletedVisits !== undefined) dbUpdates.total_completed_visits = updates.totalCompletedVisits;
  if (updates.totalAbsentVisits !== undefined) dbUpdates.total_absent_visits = updates.totalAbsentVisits;
  if (updates.totalTours !== undefined) dbUpdates.total_tours = updates.totalTours;
  if (updates.totalCompletedTours !== undefined) dbUpdates.total_completed_tours = updates.totalCompletedTours;
  if (updates.totalQuotes !== undefined) dbUpdates.total_quotes = updates.totalQuotes;
  if (updates.totalAcceptedQuotes !== undefined) dbUpdates.total_accepted_quotes = updates.totalAcceptedQuotes;
  if (updates.totalRevenue !== undefined) dbUpdates.total_revenue = updates.totalRevenue;
  if (updates.currentStreak !== undefined) dbUpdates.current_streak = updates.currentStreak;
  if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak;
  if (updates.lastVisitDate !== undefined) dbUpdates.last_visit_date = updates.lastVisitDate;
  if (updates.totalDistanceKm !== undefined) dbUpdates.total_distance_km = updates.totalDistanceKm;
  if (updates.totalPoints !== undefined) dbUpdates.total_points = updates.totalPoints;
  if (updates.level !== undefined) dbUpdates.level = updates.level;

  const { data, error } = await supabase
    .from('clozer_user_stats')
    .update(dbUpdates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user stats:', error);
    return null;
  }

  const updatedStats = fromDbUserStats(data);
  userStatsCache.set(userId, updatedStats);
  return updatedStats;
}

async function updateUserPoints(userId: string, pointsToAdd: number): Promise<void> {
  const currentStats = userStatsCache.get(userId) || await getUserStatsAsync(userId);
  if (!currentStats) return;

  const newPoints = currentStats.totalPoints + pointsToAdd;
  const newLevel = calculateLevel(newPoints);

  await updateUserStats(userId, {
    totalPoints: newPoints,
    level: newLevel,
  });
}

function calculateLevel(points: number): number {
  // Level thresholds: 0, 100, 250, 500, 1000, 2000, 4000, 8000, ...
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) {
      return i + 1;
    }
  }
  return 1;
}

// ==================== NOTIFICATIONS ====================

export async function getNotificationsAsync(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let query = supabase
    .from('clozer_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []).map(fromDbNotification);
}

export function getNotifications(userId: string): Notification[] {
  return notificationsCache.filter(n => n.userId === userId);
}

export function getUnreadNotifications(userId: string): Notification[] {
  return notificationsCache.filter(n => n.userId === userId && !n.isRead);
}

export function getUnreadCount(userId: string): number {
  return notificationsCache.filter(n => n.userId === userId && !n.isRead).length;
}

export async function createNotification(
  notification: Omit<Notification, 'id' | 'isRead' | 'readAt' | 'createdAt'>
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('clozer_notifications')
    .insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      action_url: notification.actionUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  const newNotification = fromDbNotification(data);
  notificationsCache.unshift(newNotification);
  return newNotification;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('clozer_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification read:', error);
    return false;
  }

  const index = notificationsCache.findIndex(n => n.id === id);
  if (index !== -1) {
    notificationsCache[index].isRead = true;
    notificationsCache[index].readAt = new Date().toISOString();
  }
  return true;
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clozer_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications read:', error);
    return false;
  }

  notificationsCache = notificationsCache.map(n =>
    n.userId === userId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
  );
  return true;
}

// ==================== ACTIVITY LOG ====================

export async function logActivity(
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  supabase
    .from('clozer_activity_log')
    .insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
    })
    .then(({ error }) => {
      if (error) console.error('Error logging activity:', error);
    });
}

// ==================== CLIENT NOTES ====================

export async function getClientNotesAsync(clientId: string): Promise<ClientNote[]> {
  const { data, error } = await supabase
    .from('clozer_client_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client notes:', error);
    return [];
  }

  return (data || []).map(fromDbClientNote);
}

export function getClientNotes(clientId: string): ClientNote[] {
  return clientNotesCache
    .filter(n => n.clientId === clientId)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export async function addClientNote(
  note: Omit<ClientNote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ClientNote | null> {
  const { data, error } = await supabase
    .from('clozer_client_notes')
    .insert({
      client_id: note.clientId,
      content: note.content,
      is_pinned: note.isPinned,
      tags: note.tags,
      created_by: note.createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding client note:', error);
    return null;
  }

  const newNote = fromDbClientNote(data);
  clientNotesCache.push(newNote);
  return newNote;
}

export async function updateClientNote(
  id: string,
  updates: Partial<Pick<ClientNote, 'content' | 'isPinned' | 'tags'>>
): Promise<ClientNote | null> {
  const dbUpdates: any = {};
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

  const { data, error } = await supabase
    .from('clozer_client_notes')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client note:', error);
    return null;
  }

  const updatedNote = fromDbClientNote(data);
  const index = clientNotesCache.findIndex(n => n.id === id);
  if (index !== -1) {
    clientNotesCache[index] = updatedNote;
  }
  return updatedNote;
}

export async function deleteClientNote(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('clozer_client_notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client note:', error);
    return false;
  }

  clientNotesCache = clientNotesCache.filter(n => n.id !== id);
  return true;
}

// ==================== CLIENT INTERACTIONS (Timeline) ====================

export async function getClientInteractionsAsync(
  clientId: string,
  limit: number = 50
): Promise<ClientInteraction[]> {
  const { data, error } = await supabase
    .from('clozer_client_interactions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching client interactions:', error);
    return [];
  }

  return (data || []).map(fromDbClientInteraction);
}

export function getClientInteractions(clientId: string): ClientInteraction[] {
  return clientInteractionsCache
    .filter(i => i.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addClientInteraction(
  interaction: Omit<ClientInteraction, 'id' | 'createdAt'>
): Promise<ClientInteraction | null> {
  const { data, error } = await supabase
    .from('clozer_client_interactions')
    .insert({
      client_id: interaction.clientId,
      type: interaction.type,
      title: interaction.title,
      description: interaction.description,
      metadata: interaction.metadata,
      created_by: interaction.createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding client interaction:', error);
    return null;
  }

  const newInteraction = fromDbClientInteraction(data);
  clientInteractionsCache.push(newInteraction);
  return newInteraction;
}

// ==================== CLIENT PHOTOS ====================

export async function getClientPhotosAsync(clientId: string): Promise<ClientPhoto[]> {
  const { data, error } = await supabase
    .from('clozer_client_photos')
    .select('*')
    .eq('client_id', clientId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client photos:', error);
    return [];
  }

  return (data || []).map(fromDbClientPhoto);
}

export function getClientPhotos(clientId: string): ClientPhoto[] {
  return clientPhotosCache.filter(p => p.clientId === clientId);
}

export async function addClientPhoto(
  photo: Omit<ClientPhoto, 'id' | 'createdAt'>
): Promise<ClientPhoto | null> {
  // If marking as primary, unset other primaries
  if (photo.isPrimary) {
    await supabase
      .from('clozer_client_photos')
      .update({ is_primary: false })
      .eq('client_id', photo.clientId);

    clientPhotosCache = clientPhotosCache.map(p =>
      p.clientId === photo.clientId ? { ...p, isPrimary: false } : p
    );
  }

  const { data, error } = await supabase
    .from('clozer_client_photos')
    .insert({
      client_id: photo.clientId,
      url: photo.url,
      caption: photo.caption,
      is_primary: photo.isPrimary,
      created_by: photo.createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding client photo:', error);
    return null;
  }

  const newPhoto = fromDbClientPhoto(data);
  clientPhotosCache.push(newPhoto);
  return newPhoto;
}

// ==================== VISIT PREPARATION SHEET ====================

export async function getVisitPreparationSheet(clientId: string): Promise<VisitPreparationSheet | null> {
  const client = getClient(clientId);
  if (!client) return null;

  const [interactions, notes, products, photos] = await Promise.all([
    getClientInteractionsAsync(clientId),
    getClientNotesAsync(clientId),
    getClientProductsAsync(clientId),
    getClientPhotosAsync(clientId),
  ]);

  const quotes = getQuotesByClient(clientId);
  const activeQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');

  // Find last visit
  const visits = getVisits().filter(v => v.clientId === clientId && v.status === 'completed');
  const lastVisit = visits.sort((a, b) => 
    new Date(b.visitedAt || b.updatedAt).getTime() - new Date(a.visitedAt || a.updatedAt).getTime()
  )[0];

  const reports = getReportsByClient(clientId);
  const lastReport = reports[0];

  // Calculate days since last visit
  let daysSinceLastVisit: number | null = null;
  if (client.lastVisitedAt) {
    daysSinceLastVisit = Math.floor(
      (Date.now() - new Date(client.lastVisitedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Check for upcoming birthday
  let upcomingBirthday = false;
  if (client.birthday) {
    const birthday = new Date(client.birthday);
    const today = new Date();
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    const daysUntilBirthday = Math.floor(
      (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    upcomingBirthday = daysUntilBirthday >= 0 && daysUntilBirthday <= 14;
  }

  // Get suggested products (products not yet bought by client)
  const boughtProductIds = new Set(products.map(p => p.productId));
  const suggestedProducts = getActiveProducts().filter(p => !boughtProductIds.has(p.id)).slice(0, 5);

  // Calculate total spent
  const totalSpent = products.reduce((sum, p) => sum + p.pricePaid, 0);

  return {
    client,
    lastVisit: lastVisit ? {
      date: lastVisit.visitedAt || lastVisit.updatedAt,
      notes: lastVisit.notes,
      report: lastReport?.content || null,
    } : null,
    recentInteractions: interactions.slice(0, 10),
    activeQuotes,
    purchaseHistory: products,
    totalSpent,
    daysSinceLastVisit,
    upcomingBirthday,
    suggestedProducts,
    notes,
    priorityScore: client.priorityScore,
  };
}

// ==================== SMART ALERTS ====================

export async function generateSmartAlerts(userId: string): Promise<void> {
  const clients = await import('./storage').then(m => m.getClientsByUser(userId));
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  for (const client of clients) {
    // Alert: Client not visited in 60+ days
    if (client.lastVisitedAt) {
      const daysSince = Math.floor(
        (today.getTime() - new Date(client.lastVisitedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 60) {
        await createNotification({
          userId,
          type: 'client_inactive',
          title: `Client inactif: ${client.prenom} ${client.nom}`,
          message: `Pas de visite depuis ${daysSince} jours`,
          data: { clientId: client.id, daysSince },
          actionUrl: `/clients/${client.id}`,
        });
      }
    }

    // Alert: Birthday coming up
    if (client.birthday) {
      const birthday = new Date(client.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      const daysUntil = Math.floor(
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil === 0) {
        await createNotification({
          userId,
          type: 'birthday',
          title: `🎂 Anniversaire aujourd'hui !`,
          message: `${client.prenom} ${client.nom} fête son anniversaire`,
          data: { clientId: client.id },
          actionUrl: `/clients/${client.id}`,
        });
      } else if (daysUntil === 7) {
        await createNotification({
          userId,
          type: 'birthday',
          title: `Anniversaire dans 7 jours`,
          message: `${client.prenom} ${client.nom} fêtera son anniversaire le ${thisYearBirthday.toLocaleDateString('fr-FR')}`,
          data: { clientId: client.id },
          actionUrl: `/clients/${client.id}`,
        });
      }
    }
  }

  // Alert: Expiring quotes
  const quotes = await import('./storage').then(m => m.getQuotes());
  for (const quote of quotes) {
    if (quote.validUntil && (quote.status === 'draft' || quote.status === 'sent')) {
      const daysUntil = Math.floor(
        (new Date(quote.validUntil).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 3 && daysUntil >= 0) {
        await createNotification({
          userId,
          type: 'quote_expiring',
          title: `Devis expire ${daysUntil === 0 ? "aujourd'hui" : `dans ${daysUntil} jours`}`,
          message: `Devis de ${quote.totalTTC.toLocaleString('fr-FR')}€ pour ${quote.clientName}`,
          data: { quoteId: quote.id, clientId: quote.clientId },
          actionUrl: `/clients/${quote.clientId}`,
        });
      }
    }
  }
}

// ==================== INITIALIZE V2 DATA ====================

export async function initializeV2Data(): Promise<void> {
  console.log('Initializing V2 data...');

  try {
    const [
      products,
      clientProducts,
      opportunities,
      achievements,
      notifications,
    ] = await Promise.all([
      getProductsAsync(),
      getClientProductsAsync(),
      getOpportunitiesAsync(),
      getAchievementsAsync(),
      // Notifications are user-specific, will be loaded on demand
      Promise.resolve([]),
    ]);

    productsCache = products;
    productsCacheLoaded = true;

    clientProductsCache = clientProducts;
    clientProductsCacheLoaded = true;

    opportunitiesCache = opportunities;
    opportunitiesCacheLoaded = true;

    achievementsCache = achievements;
    achievementsCacheLoaded = true;

    console.log('V2 data initialized:', {
      products: products.length,
      clientProducts: clientProducts.length,
      opportunities: opportunities.length,
      achievements: achievements.length,
    });
  } catch (error) {
    console.error('Error initializing V2 data:', error);
  }
}
