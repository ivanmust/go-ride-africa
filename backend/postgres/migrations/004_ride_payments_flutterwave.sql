-- Ride payments (Flutterwave): one record per ride when passenger pays online
CREATE TABLE IF NOT EXISTS public.ride_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_history_id UUID NOT NULL REFERENCES public.ride_history(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  flw_tx_ref TEXT NOT NULL UNIQUE,
  flw_tx_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ride_payments_ride_history_id ON public.ride_payments(ride_history_id);
CREATE INDEX IF NOT EXISTS idx_ride_payments_flw_tx_ref ON public.ride_payments(flw_tx_ref);
CREATE INDEX IF NOT EXISTS idx_ride_payments_user_id ON public.ride_payments(user_id);
