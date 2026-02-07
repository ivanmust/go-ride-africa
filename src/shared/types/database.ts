/**
 * Shared types for GoRide (Postgres/API). No Supabase dependency.
 */
export type AppRole = "admin" | "driver" | "passenger";

export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
  is_driver_approved?: boolean;
}

/** Minimal user shape used by auth contexts (replaces @supabase/supabase-js User) */
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string | null };
}

/** Minimal session shape used by auth contexts (replaces @supabase/supabase-js Session) */
export interface AuthSession {
  user: AuthUser;
  access_token: string;
}
