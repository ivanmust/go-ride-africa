-- Add fare and trip fields to ride_requests (for existing DBs created before this change).
-- Safe to run multiple times (IF NOT EXISTS / DO block).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'fare_amount'
  ) THEN
    ALTER TABLE public.ride_requests ADD COLUMN fare_amount DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.ride_requests ADD COLUMN currency TEXT DEFAULT 'RWF';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'distance_km'
  ) THEN
    ALTER TABLE public.ride_requests ADD COLUMN distance_km DECIMAL(6, 2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ride_requests' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE public.ride_requests ADD COLUMN duration_minutes INTEGER;
  END IF;
END $$;
