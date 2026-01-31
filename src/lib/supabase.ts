import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to prevent build-time errors when env vars are not available
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

// Legacy export for backward compatibility - use getSupabase() for new code
// This getter ensures lazy initialization
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});

// Types for database tables
export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'commercial';
  created_at: string;
  updated_at: string;
}

export interface DbClient {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  tel_domicile: string | null;
  portable_m: string | null;
  portable_mme: string | null;
  adresse: string;
  code_postal: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  assigned_to: string | null;
  status: 'active' | 'inactive';
  availability_profile: 'retired' | 'working' | null;
  deactivation_reason: string | null;
  deactivated_at: string | null;
  deactivated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTour {
  id: string;
  name: string;
  date: string;
  start_lat: number;
  start_lng: number;
  start_address: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  total_distance: number | null;
  total_duration: number | null;
  user_id: string | null;
  start_address_id: string | null;
  final_report: string | null;
  report_validated_at: string | null;
  report_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVisit {
  id: string;
  tour_id: string;
  client_id: string;
  order_index: number;
  status: 'pending' | 'in_progress' | 'completed' | 'absent' | 'postponed' | 'skipped';
  visited_at: string | null;
  notes: string | null;
  absent_strategy: 'after_next' | 'on_return' | 'another_day' | null;
  estimated_arrival: string | null;
  estimated_duration: number;
  distance_from_previous: number | null;
  duration_from_previous: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbQuote {
  id: string;
  visit_id: string | null;
  client_id: string;
  date: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  client_name: string;
  client_address: string;
  client_phone: string;
  items: any; // JSON
  notes: string | null;
  total_ht: number;
  tva: number;
  total_ttc: number;
  signature_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVisitReport {
  id: string;
  visit_id: string;
  client_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSettings {
  id: string;
  user_id: string | null;
  start_lat: number;
  start_lng: number;
  start_address: string;
  work_start_time: string;
  work_end_time: string;
  lunch_break_start: string | null;
  lunch_break_end: string | null;
  default_visit_duration: number;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_siret: string;
  working_profile_hour: string;
  headquarters_address: string;
  headquarters_city: string;
  headquarters_postal_code: string;
  headquarters_lat: number | null;
  headquarters_lng: number | null;
  confirmation_words: string[];
  created_at: string;
  updated_at: string;
}

// ==================== NEW INTERFACES FOR V2 ====================

export interface DbUserAddress {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTourNote {
  id: string;
  tour_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DbReactivationRequest {
  id: string;
  client_id: string;
  requested_by: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  review_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface DbUserSupervisor {
  id: string;
  user_id: string;
  supervisor_id: string;
  created_at: string;
}
