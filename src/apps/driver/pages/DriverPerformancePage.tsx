import { Helmet } from "react-helmet-async";
import { useDriverPerformance } from "@/hooks/useDriverPerformance";
import { PerformanceStatsCards } from "@/components/driver/analytics/PerformanceStatsCards";
import { AcceptanceRateChart } from "@/components/driver/analytics/AcceptanceRateChart";
import { RatingHistoryChart } from "@/components/driver/analytics/RatingHistoryChart";
import { TripsCompletedChart } from "@/components/driver/analytics/TripsCompletedChart";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DriverPerformancePage = () => {
  const { dailyPerformance, stats, loading } = useDriverPerformance();

  return (
    <>
      <Helmet>
        <title>Performance Analytics - GoRide Driver</title>
        <meta name="description" content="Track your driver performance metrics, acceptance rate trends, and rating history." />
      </Helmet>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link to="/drive">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
              <p className="text-muted-foreground">Track your acceptance rate, ratings, and trip activity</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <Skeleton className="h-72 rounded-lg" />
                <Skeleton className="h-72 rounded-lg" />
              </div>
              <Skeleton className="h-72 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Performance Stats Cards */}
              <PerformanceStatsCards
                currentRating={stats.currentRating}
                ratingTrend={stats.ratingTrend}
                currentAcceptanceRate={stats.currentAcceptanceRate}
                acceptanceTrend={stats.acceptanceTrend}
                totalTripsThisWeek={stats.totalTripsThisWeek}
                cancellationRate={stats.cancellationRate}
                avgOnlineHours={stats.avgOnlineHours}
              />

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6">
                <AcceptanceRateChart
                  data={dailyPerformance}
                  currentRate={stats.currentAcceptanceRate}
                  trend={stats.acceptanceTrend}
                />
                <RatingHistoryChart
                  data={dailyPerformance}
                  currentRating={stats.currentRating}
                  trend={stats.ratingTrend}
                />
              </div>

              {/* Trips Activity Chart */}
              <TripsCompletedChart data={dailyPerformance} />

              {/* Performance Tips */}
              <div className="bg-secondary rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Performance Tips</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-background rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Keep Acceptance High</h4>
                    <p className="text-xs text-muted-foreground">
                      Maintain 90%+ acceptance rate to get priority ride requests and bonuses.
                    </p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Boost Your Rating</h4>
                    <p className="text-xs text-muted-foreground">
                      Keep your car clean, be courteous, and follow preferred routes for 5-star reviews.
                    </p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Minimize Cancellations</h4>
                    <p className="text-xs text-muted-foreground">
                      Only accept rides you can complete. High cancellation rates affect your standing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default DriverPerformancePage;
