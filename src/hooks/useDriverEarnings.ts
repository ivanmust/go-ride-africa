import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, format, subDays } from 'date-fns';

export interface DailyEarning {
  id: string;
  date: string;
  total_fares: number;
  commission_rate: number;
  commission_amount: number;
  net_earnings: number;
  trips_count: number;
  online_hours: number | null;
}

export interface Payout {
  id: string;
  amount: number;
  payout_method: string;
  mobile_money_provider: string | null;
  mobile_money_number: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
  transaction_reference: string | null;
  notes: string | null;
}

export interface EarningsStats {
  todayEarnings: number;
  todayTrips: number;
  weeklyEarnings: number;
  weeklyTrips: number;
  weeklyCommission: number;
  pendingPayout: number;
  availableBalance: number;
}

export const useDriverEarnings = () => {
  const { user } = useAuth();
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    todayEarnings: 0,
    todayTrips: 0,
    weeklyEarnings: 0,
    weeklyTrips: 0,
    weeklyCommission: 0,
    pendingPayout: 0,
    availableBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchEarnings = async () => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Fetch daily earnings for the last 30 days
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    
    const { data: earningsData, error: earningsError } = await supabase
      .from('driver_earnings')
      .select('*')
      .eq('driver_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false });

    if (!earningsError && earningsData) {
      setDailyEarnings(earningsData);

      // Calculate stats
      const todayData = earningsData.find(e => e.date === today);
      const weeklyData = earningsData.filter(e => e.date >= weekStart && e.date <= weekEnd);

      const weeklyEarnings = weeklyData.reduce((sum, e) => sum + Number(e.net_earnings), 0);
      const weeklyTrips = weeklyData.reduce((sum, e) => sum + e.trips_count, 0);
      const weeklyCommission = weeklyData.reduce((sum, e) => sum + Number(e.commission_amount), 0);

      setStats(prev => ({
        ...prev,
        todayEarnings: todayData ? Number(todayData.net_earnings) : 0,
        todayTrips: todayData ? todayData.trips_count : 0,
        weeklyEarnings,
        weeklyTrips,
        weeklyCommission,
      }));
    }

    // Fetch payouts
    const { data: payoutsData, error: payoutsError } = await supabase
      .from('driver_payouts')
      .select('*')
      .eq('driver_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(20);

    if (!payoutsError && payoutsData) {
      setPayouts(payoutsData);

      // Calculate pending payout amount
      const pendingAmount = payoutsData
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      // Calculate available balance (total net earnings - processed payouts)
      const processedPayouts = payoutsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const totalNetEarnings = dailyEarnings.reduce((sum, e) => sum + Number(e.net_earnings), 0);

      setStats(prev => ({
        ...prev,
        pendingPayout: pendingAmount,
        availableBalance: Math.max(0, totalNetEarnings - processedPayouts - pendingAmount),
      }));
    }

    setLoading(false);
  };

  const requestPayout = async (amount: number, provider: string, phoneNumber: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('driver_payouts')
      .insert({
        driver_id: user.id,
        amount,
        payout_method: 'mobile_money',
        mobile_money_provider: provider,
        mobile_money_number: phoneNumber,
        status: 'pending',
      });

    if (!error) {
      await fetchEarnings();
    }

    return { error };
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  return {
    dailyEarnings,
    payouts,
    stats,
    loading,
    refetch: fetchEarnings,
    requestPayout,
  };
};
