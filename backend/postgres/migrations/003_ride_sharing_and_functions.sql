-- Apply ride_sharing column + updated create_ride_request + new reassign_ride_request
-- Run with: psql "$DATABASE_URL" -f backend/postgres/migrations/003_ride_sharing_and_functions.sql

-- 1. Add ride_sharing column (idempotent)
ALTER TABLE public.ride_requests
  ADD COLUMN IF NOT EXISTS ride_sharing BOOLEAN NOT NULL DEFAULT false;

-- 2. Updated create_ride_request (p_ride_sharing + driver phone in result)
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

-- 3. New reassign_ride_request (after driver declined)
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
