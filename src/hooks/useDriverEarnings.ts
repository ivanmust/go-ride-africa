import { useState, useEffect } from 'react';
import { useDriverAuth } from "@/apps/driver/auth/DriverAuthContext";
import { api } from "@/shared";
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
  const { user } = useDriverAuth();
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
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const [earningsRes, payoutsRes] = await Promise.all([
      api.get<DailyEarning[]>('/driver-earnings'),
      api.get<Payout[]>('/driver-earnings/payouts'),
    ]);
    const earningsData = !earningsRes.error && earningsRes.data
      ? earningsRes.data.filter((e: { date: string }) => e.date >= thirtyDaysAgo)
      : null;
    const payoutsData = !payoutsRes.error && payoutsRes.data ? payoutsRes.data : null;

    if (earningsData) {
      setDailyEarnings(earningsData);
      const todayData = earningsData.find((e) => e.date === today);
      const weeklyData = earningsData.filter((e) => e.date >= weekStart && e.date <= weekEnd);
      const todayEarnings = todayData ? Number(todayData.net_earnings) : 0;
      const todayTrips = todayData != null && todayData.trips_count != null ? Number(todayData.trips_count) : 0;
      setStats((prev) => ({
        ...prev,
        todayEarnings: Number.isFinite(todayEarnings) ? todayEarnings : 0,
        todayTrips: Number.isInteger(todayTrips) && todayTrips >= 0 ? todayTrips : 0,
        weeklyEarnings: weeklyData.reduce((sum, e) => sum + Number(e.net_earnings || 0), 0),
        weeklyTrips: weeklyData.reduce((sum, e) => sum + Number(e.trips_count || 0), 0),
        weeklyCommission: weeklyData.reduce((sum, e) => sum + Number(e.commission_amount || 0), 0),
      }));
    }

    if (payoutsData) {
      setPayouts(payoutsData);
      const pendingAmount = payoutsData.filter((p) => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const processedPayouts = payoutsData.filter((p) => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalNetEarnings = (earningsData ?? []).reduce((sum, e) => sum + Number(e.net_earnings || 0), 0);
      setStats((prev) => ({
        ...prev,
        pendingPayout: pendingAmount,
        availableBalance: Math.max(0, totalNetEarnings - processedPayouts - pendingAmount),
      }));
    }

    setLoading(false);
  };

  const requestPayout = async (amount: number, provider: string, phoneNumber: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await api.post('/driver-earnings/payouts', {
      amount,
      payout_method: 'mobile_money',
      mobile_money_provider: provider,
      mobile_money_number: phoneNumber,
    });
    if (!error) await fetchEarnings();
    return { error: error ? new Error(error.message) : undefined };
  };

  useEffect(() => {
    fetchEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchEarnings identity would cause extra runs
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
