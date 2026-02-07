-- Add ride_sharing flag to ride_requests (for shared vs solo ride product)
ALTER TABLE public.ride_requests
  ADD COLUMN IF NOT EXISTS ride_sharing BOOLEAN NOT NULL DEFAULT false;
