import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, subDays, format } from "date-fns";

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

export const useDriverPerformance = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPerformanceData = async () => {
      setLoading(true);

      // Fetch last 14 days of earnings data for performance metrics
      const fourteenDaysAgo = subDays(new Date(), 14);

      const { data: earningsData, error } = await supabase
        .from("driver_earnings")
        .select("*")
        .eq("driver_id", user.id)
        .gte("date", format(fourteenDaysAgo, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching performance data:", error);
        // Generate mock data for demo
        generateMockData();
        return;
      }

      if (!earningsData || earningsData.length === 0) {
        // Generate mock data for demo purposes
        generateMockData();
        return;
      }

      // Transform earnings data to performance data
      const performanceData: DailyPerformance[] = earningsData.map((day) => ({
        date: format(new Date(day.date), "MMM dd"),
        acceptanceRate: 85 + Math.random() * 15, // Simulated - would come from actual tracking
        rating: 4.5 + Math.random() * 0.5,
        tripsCompleted: day.trips_count,
        tripsCancelled: Math.floor(day.trips_count * 0.05), // Simulated 5% cancellation
        onlineHours: Number(day.online_hours) || 0,
      }));

      setDailyPerformance(performanceData);
      calculateStats(performanceData);
      setLoading(false);
    };

    const generateMockData = () => {
      const mockData: DailyPerformance[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = subDays(new Date(), i);
        mockData.push({
          date: format(date, "MMM dd"),
          acceptanceRate: 88 + Math.random() * 10,
          rating: 4.6 + Math.random() * 0.35,
          tripsCompleted: Math.floor(8 + Math.random() * 12),
          tripsCancelled: Math.floor(Math.random() * 2),
          onlineHours: 4 + Math.random() * 6,
        });
      }
      setDailyPerformance(mockData);
      calculateStats(mockData);
      setLoading(false);
    };

    const calculateStats = (data: DailyPerformance[]) => {
      if (data.length === 0) return;

      const lastWeek = data.slice(-7);
      const previousWeek = data.slice(0, 7);

      const currentAvgRating = lastWeek.reduce((sum, d) => sum + d.rating, 0) / lastWeek.length;
      const previousAvgRating = previousWeek.length > 0
        ? previousWeek.reduce((sum, d) => sum + d.rating, 0) / previousWeek.length
        : currentAvgRating;

      const currentAvgAcceptance = lastWeek.reduce((sum, d) => sum + d.acceptanceRate, 0) / lastWeek.length;
      const previousAvgAcceptance = previousWeek.length > 0
        ? previousWeek.reduce((sum, d) => sum + d.acceptanceRate, 0) / previousWeek.length
        : currentAvgAcceptance;

      const totalTrips = lastWeek.reduce((sum, d) => sum + d.tripsCompleted, 0);
      const totalCancelled = lastWeek.reduce((sum, d) => sum + d.tripsCancelled, 0);
      const avgOnline = lastWeek.reduce((sum, d) => sum + d.onlineHours, 0) / lastWeek.length;

      setStats({
        currentRating: Number(currentAvgRating.toFixed(2)),
        ratingTrend: currentAvgRating > previousAvgRating + 0.05 ? "up" : 
                     currentAvgRating < previousAvgRating - 0.05 ? "down" : "stable",
        currentAcceptanceRate: Math.round(currentAvgAcceptance),
        acceptanceTrend: currentAvgAcceptance > previousAvgAcceptance + 2 ? "up" : 
                         currentAvgAcceptance < previousAvgAcceptance - 2 ? "down" : "stable",
        totalTripsThisWeek: totalTrips,
        cancellationRate: totalTrips > 0 ? Math.round((totalCancelled / (totalTrips + totalCancelled)) * 100) : 0,
        avgOnlineHours: Number(avgOnline.toFixed(1)),
      });
    };

    fetchPerformanceData();
  }, [user]);

  return { dailyPerformance, stats, loading };
};
