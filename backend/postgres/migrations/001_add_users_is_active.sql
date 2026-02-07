-- Add is_active to users for account deactivation (run on existing DBs)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
