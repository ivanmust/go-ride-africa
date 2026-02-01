-- Create driver_earnings table for tracking daily earnings
CREATE TABLE public.driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
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

-- Create driver_payouts table for payout history
CREATE TABLE public.driver_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
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

-- Enable RLS
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_earnings
CREATE POLICY "Drivers can view own earnings"
ON public.driver_earnings
FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert own earnings"
ON public.driver_earnings
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own earnings"
ON public.driver_earnings
FOR UPDATE
USING (auth.uid() = driver_id);

-- RLS policies for driver_payouts
CREATE POLICY "Drivers can view own payouts"
ON public.driver_payouts
FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can request payouts"
ON public.driver_payouts
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Create updated_at trigger for driver_earnings
CREATE TRIGGER update_driver_earnings_updated_at
BEFORE UPDATE ON public.driver_earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();