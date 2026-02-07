import { useState, useEffect } from "react";
import { useDriverAuth } from "@/apps/driver/auth/DriverAuthContext";
import { api } from "@/shared";
import { subDays, format } from "date-fns";

interface DailyPerformance {
  date: string;
  acceptanceRate: number;
  rating: number;
  tripsCompleted: number;
  tripsCancelled: number;
  onlineHours: number;
}

interface PerformanceStats {
  currentRating: number;
  ratingTrend: "up" | "down" | "stable";
  currentAcceptanceRate: number;
  acceptanceTrend: "up" | "down" | "stable";
  totalTripsThisWeek: number;
  cancellationRate: number;
  avgOnlineHours: number;
}

interface DriverEarningRow {
  date: string;
  trips_count: number;
  online_hours: number | null;
}

export const useDriverPerformance = () => {
  const { user } = useDriverAuth();
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformance[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    currentRating: 0,
    ratingTrend: "stable",
    currentAcceptanceRate: 0,
    acceptanceTrend: "stable",
    totalTripsThisWeek: 0,
    cancellationRate: 0,
    avgOnlineHours: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchPerformanceData = async () => {
    if (!user) return;
    setLoading(true);

    const fourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");

    const { data: earningsData, error } = await api.get<DriverEarningRow[]>("/driver-earnings");
    if (error) {
      console.error("Error fetching performance data:", error);
      setDailyPerformance([]);
      setStats({
        currentRating: 0,
        ratingTrend: "stable",
        currentAcceptanceRate: 0,
        acceptanceTrend: "stable",
        totalTripsThisWeek: 0,
        cancellationRate: 0,
        avgOnlineHours: 0,
      });
      setLoading(false);
      return;
    }

    const filtered = (earningsData || []).filter((e) => e.date >= fourteenDaysAgo);

    if (filtered.length === 0) {
      setDailyPerformance([]);
      setStats({
        currentRating: 0,
        ratingTrend: "stable",
        currentAcceptanceRate: 0,
        acceptanceTrend: "stable",
        totalTripsThisWeek: 0,
        cancellationRate: 0,
        avgOnlineHours: 0,
      });
      setLoading(false);
      return;
    }

    const performanceData: DailyPerformance[] = filtered.map((day) => ({
      date: format(new Date(day.date), "MMM dd"),
      acceptanceRate: 0,
      rating: 0,
      tripsCompleted: day.trips_count ?? 0,
      tripsCancelled: 0,
      onlineHours: Number(day.online_hours ?? 0),
    }));

    setDailyPerformance(performanceData);

    const lastWeek = performanceData.slice(-7);
    const totalTrips = lastWeek.reduce((sum, d) => sum + d.tripsCompleted, 0);
    const avgOnline =
      lastWeek.length > 0
        ? lastWeek.reduce((sum, d) => sum + d.onlineHours, 0) / lastWeek.length
        : 0;

    const safeAvgOnline = Number(avgOnline.toFixed(1));
    setStats({
      currentRating: 0,
      ratingTrend: "stable",
      currentAcceptanceRate: 0,
      acceptanceTrend: "stable",
      totalTripsThisWeek: Number.isFinite(totalTrips) ? totalTrips : 0,
      cancellationRate: 0,
      avgOnlineHours: Number.isFinite(safeAvgOnline) ? safeAvgOnline : 0,
    });

    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchPerformanceData();
  }, [user?.id]);

  return { dailyPerformance, stats, loading, refetch: fetchPerformanceData };
};
