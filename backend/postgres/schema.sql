-- GoRide Postgres-only schema for ride_sharing database
-- Run once: psql "postgresql://postgres:Mustaf%40123@localhost:5433/ride_sharing" -f schema.sql
-- Or in psql: \i path/to/schema.sql

-- ========== 1. Users (replaces auth.users) ==========
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 2. Enum ==========
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'passenger');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========== 3. Profiles ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_driver_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 4. User roles ==========
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'passenger',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ========== 5. Saved locations ==========
CREATE TABLE IF NOT EXISTS public.saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 6. Ride history ==========
CREATE TABLE IF NOT EXISTS public.ride_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  driver_name TEXT,
  driver_photo TEXT,
  driver_rating DECIMAL(2, 1),
  vehicle_type TEXT NOT NULL,
  vehicle_plate TEXT,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  fare_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RWF',
  distance_km DECIMAL(6, 2),
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_rating INTEGER,
  user_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ride_history_driver_id ON public.ride_history(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ride_history_user_id ON public.ride_history(user_id);

-- ========== 7. Payment methods (before ride_requests) ==========
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cash', 'mobile_money', 'card', 'wallet')),
  provider TEXT,
  account_number_masked TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 8. Ride requests ==========
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  vehicle_type TEXT NOT NULL,
  fare_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'RWF',
  distance_km DECIMAL(6, 2),
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'timeout')),
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ride_history_id UUID REFERENCES public.ride_history(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  ride_sharing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 9. Ride messages ==========
CREATE TABLE IF NOT EXISTS public.ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.ride_history(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('passenger', 'driver')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ride_messages_ride_id ON public.ride_messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_messages_created_at ON public.ride_messages(created_at);

-- ========== 10. User locations (driver location) ==========
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ========== 11. Vehicles ==========
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  vehicle_type TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 12. Driver availability ==========
CREATE TABLE IF NOT EXISTS public.driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (driver_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_availability_is_online ON public.driver_availability(is_online) WHERE is_online = true;

-- ========== 13. Driver documents ==========
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('drivers_license', 'national_id', 'vehicle_registration', 'insurance', 'inspection_certificate')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_type)
);

-- ========== 14. Driver earnings ==========
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_fares NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 15.00,
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0,
  trips_count INTEGER NOT NULL DEFAULT 0,
  online_hours NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (driver_id, date)
);

-- ========== 15. Driver payouts ==========
CREATE TABLE IF NOT EXISTS public.driver_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payout_method TEXT NOT NULL DEFAULT 'mobile_money',
  mobile_money_provider TEXT,
  mobile_money_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 21. Scheduled rides ==========
CREATE TABLE IF NOT EXISTS public.scheduled_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  vehicle_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_rides_user_id ON public.scheduled_rides(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_scheduled_at ON public.scheduled_rides(scheduled_at);

-- ========== 16. Trigger: update_updated_at ==========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========== 17. Haversine (distance in km) ==========
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT (6371.0 * 2.0 * asin(least(1.0, sqrt(
    sin(radians((lat2::float - lat1::float) / 2.0)) * sin(radians((lat2::float - lat1::float) / 2.0))
    + cos(radians(lat1::float)) * cos(radians(lat2::float))
      * sin(radians((lng2::float - lng1::float) / 2.0)) * sin(radians((lng2::float - lng1::float) / 2.0))
  ))))::decimal;
$$;

-- ========== 18. create_ride_request (passenger_id from API/JWT) ==========
CREATE OR REPLACE FUNCTION public.create_ride_request(
  p_passenger_id UUID,
  p_pickup_address TEXT,
  p_dropoff_address TEXT,
  p_vehicle_type TEXT,
  p_payment_method_id UUID,
  p_fare_amount DECIMAL,
  p_pickup_lat DECIMAL DEFAULT NULL,
  p_pickup_lng DECIMAL DEFAULT NULL,
  p_dropoff_lat DECIMAL DEFAULT NULL,
  p_dropoff_lng DECIMAL DEFAULT NULL,
  p_currency TEXT DEFAULT 'RWF',
  p_distance_km DECIMAL DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_ride_sharing BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passenger_id UUID := p_passenger_id;
  v_driver_id UUID;
  v_request_id UUID;
  v_driver_name TEXT;
  v_driver_photo TEXT;
  v_driver_phone TEXT;
  v_vehicle_type TEXT;
  v_vehicle_plate TEXT;
  v_vehicle_make TEXT;
  v_vehicle_model TEXT;
  v_vehicle_color TEXT;
  v_pickup_lat DECIMAL := NULLIF(p_pickup_lat, 0);
  v_pickup_lng DECIMAL := NULLIF(p_pickup_lng, 0);
BEGIN
  IF v_passenger_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.payment_methods
    WHERE id = p_payment_method_id AND user_id = v_passenger_id
  ) THEN
    RAISE EXCEPTION 'Invalid or unauthorized payment method';
  END IF;

  SELECT d.id INTO v_driver_id
  FROM (
    SELECT p.id,
      public.haversine_km(
        COALESCE(v_pickup_lat, 0), COALESCE(v_pickup_lng, 0),
        ul.latitude, ul.longitude
      ) AS dist_km
    FROM public.profiles p
    INNER JOIN public.user_locations ul ON ul.user_id = p.id
    INNER JOIN public.driver_availability da ON da.driver_id = p.id AND da.is_online = true
    WHERE p.is_driver_approved = true
      AND ul.latitude IS NOT NULL AND ul.longitude IS NOT NULL
  ) d
  ORDER BY d.dist_km ASC
  LIMIT 1;

  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'No approved drivers are currently online in your area';
  END IF;

  SELECT COALESCE(p.full_name, 'Driver'), p.avatar_url, p.phone INTO v_driver_name, v_driver_photo, v_driver_phone
  FROM public.profiles p WHERE p.id = v_driver_id;

  SELECT v.vehicle_type, v.plate_number, v.make, v.model, v.color
  INTO v_vehicle_type, v_vehicle_plate, v_vehicle_make, v_vehicle_model, v_vehicle_color
  FROM public.vehicles v
  WHERE v.driver_id = v_driver_id AND v.is_primary = true
  LIMIT 1;

  v_vehicle_type := COALESCE(v_vehicle_type, p_vehicle_type);
  v_vehicle_plate := COALESCE(v_vehicle_plate, '—');

  INSERT INTO public.ride_requests (
    user_id, pickup_address, pickup_lat, pickup_lng,
    dropoff_address, dropoff_lat, dropoff_lng, vehicle_type,
    fare_amount, currency, distance_km, duration_minutes,
    status, driver_id, payment_method_id, ride_sharing
  ) VALUES (
    v_passenger_id, p_pickup_address, p_pickup_lat, p_pickup_lng,
    p_dropoff_address, p_dropoff_lat, p_dropoff_lng, p_vehicle_type,
    p_fare_amount, COALESCE(NULLIF(TRIM(p_currency), ''), 'RWF'), p_distance_km, p_duration_minutes,
    'pending', v_driver_id, p_payment_method_id, COALESCE(p_ride_sharing, false)
  )
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'ride_request_id', v_request_id,
    'driver', jsonb_build_object(
      'driver_id', v_driver_id,
      'full_name', v_driver_name,
      'avatar_url', v_driver_photo,
      'phone', v_driver_phone,
      'vehicle_type', v_vehicle_type,
      'vehicle_plate', v_vehicle_plate,
      'vehicle_make', v_vehicle_make,
      'vehicle_model', v_vehicle_model,
      'vehicle_color', v_vehicle_color
    )
  );
END;
$$;

-- ========== 18b. reassign_ride_request (after driver declined) ==========
CREATE OR REPLACE FUNCTION public.reassign_ride_request(
  p_request_id UUID,
  p_passenger_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_new_driver_id UUID;
  v_driver_name TEXT;
  v_driver_photo TEXT;
  v_driver_phone TEXT;
  v_vehicle_type TEXT;
  v_vehicle_plate TEXT;
  v_vehicle_make TEXT;
  v_vehicle_model TEXT;
  v_vehicle_color TEXT;
  v_pickup_lat DECIMAL;
  v_pickup_lng DECIMAL;
BEGIN
  SELECT id, user_id, pickup_lat, pickup_lng, driver_id INTO v_request
  FROM public.ride_requests
  WHERE id = p_request_id AND user_id = p_passenger_id AND status = 'declined';
  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Ride request not found or not declined';
  END IF;

  v_pickup_lat := COALESCE(NULLIF(v_request.pickup_lat, 0), 0);
  v_pickup_lng := COALESCE(NULLIF(v_request.pickup_lng, 0), 0);

  SELECT d.id INTO v_new_driver_id
  FROM (
    SELECT p.id,
      public.haversine_km(
        v_pickup_lat, v_pickup_lng,
        ul.latitude, ul.longitude
      ) AS dist_km
    FROM public.profiles p
    INNER JOIN public.user_locations ul ON ul.user_id = p.id
    INNER JOIN public.driver_availability da ON da.driver_id = p.id AND da.is_online = true
    WHERE p.is_driver_approved = true
      AND ul.latitude IS NOT NULL AND ul.longitude IS NOT NULL
      AND (v_request.driver_id IS NULL OR p.id != v_request.driver_id)
  ) d
  ORDER BY d.dist_km ASC
  LIMIT 1;

  IF v_new_driver_id IS NULL THEN
    RAISE EXCEPTION 'No other approved drivers are currently online in your area';
  END IF;

  UPDATE public.ride_requests
  SET driver_id = v_new_driver_id, status = 'pending', updated_at = now()
  WHERE id = p_request_id AND user_id = p_passenger_id AND status = 'declined';

  SELECT COALESCE(p.full_name, 'Driver'), p.avatar_url, p.phone INTO v_driver_name, v_driver_photo, v_driver_phone
  FROM public.profiles p WHERE p.id = v_new_driver_id;

  SELECT v.vehicle_type, v.plate_number, v.make, v.model, v.color
  INTO v_vehicle_type, v_vehicle_plate, v_vehicle_make, v_vehicle_model, v_vehicle_color
  FROM public.vehicles v
  WHERE v.driver_id = v_new_driver_id AND v.is_primary = true
  LIMIT 1;

  v_vehicle_plate := COALESCE(v_vehicle_plate, '—');

  RETURN jsonb_build_object(
    'ride_request_id', p_request_id,
    'driver', jsonb_build_object(
      'driver_id', v_new_driver_id,
      'full_name', v_driver_name,
      'avatar_url', v_driver_photo,
      'phone', v_driver_phone,
      'vehicle_type', v_vehicle_type,
      'vehicle_plate', v_vehicle_plate,
      'vehicle_make', v_vehicle_make,
      'vehicle_model', v_vehicle_model,
      'vehicle_color', v_vehicle_color
    )
  );
END;
$$;

-- ========== 19. Trigger: driver_earnings on ride complete ==========
CREATE OR REPLACE FUNCTION public.on_ride_completed_update_driver_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_fare NUMERIC;
  v_commission_rate NUMERIC := 15.00;
  v_commission_amount NUMERIC;
  v_net NUMERIC;
BEGIN
  IF NEW.status <> 'completed' OR NEW.driver_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_driver_id := NEW.driver_id;
  v_fare := COALESCE(NEW.fare_amount, 0)::NUMERIC;
  v_commission_amount := ROUND(v_fare * (v_commission_rate / 100.0), 2);
  v_net := v_fare - v_commission_amount;

  INSERT INTO public.driver_earnings (
    driver_id, date, total_fares, commission_rate, commission_amount, net_earnings, trips_count, online_hours
  )
  VALUES (
    v_driver_id,
    COALESCE(NEW.completed_at::date, CURRENT_DATE),
    v_fare, v_commission_rate, v_commission_amount, v_net, 1, NULL
  )
  ON CONFLICT (driver_id, date)
  DO UPDATE SET
    total_fares = driver_earnings.total_fares + EXCLUDED.total_fares,
    commission_amount = driver_earnings.commission_amount + EXCLUDED.commission_amount,
    net_earnings = driver_earnings.net_earnings + EXCLUDED.net_earnings,
    trips_count = driver_earnings.trips_count + 1,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_ride_completed_driver_earnings ON public.ride_history;
CREATE TRIGGER trigger_on_ride_completed_driver_earnings
  AFTER UPDATE OF status ON public.ride_history
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION public.on_ride_completed_update_driver_earnings();

-- ========== 20. Triggers for updated_at ==========
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_earnings_updated_at ON public.driver_earnings;
CREATE TRIGGER update_driver_earnings_updated_at
  BEFORE UPDATE ON public.driver_earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_documents_updated_at ON public.driver_documents;
CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
