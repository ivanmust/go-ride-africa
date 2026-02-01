import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { useDriverEarnings } from "@/hooks/useDriverEarnings";
import { EarningsStatsCards } from "@/components/driver/earnings/EarningsStatsCards";
import { CommissionBreakdown } from "@/components/driver/earnings/CommissionBreakdown";
import { DailyEarningsTable } from "@/components/driver/earnings/DailyEarningsTable";
import { PayoutHistory } from "@/components/driver/earnings/PayoutHistory";
import { RequestPayoutCard } from "@/components/driver/earnings/RequestPayoutCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DriverEarningsPage = () => {
  const { dailyEarnings, payouts, stats, loading, requestPayout } = useDriverEarnings();

  return (
    <>
      <Helmet>
        <title>Earnings - GoRide Driver</title>
        <meta name="description" content="View your earnings breakdown, commission calculation, and payout history." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-6 max-w-6xl">
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
            <p className="text-muted-foreground">Track your earnings, commissions, and payouts</p>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-96 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <EarningsStatsCards
                todayEarnings={stats.todayEarnings}
                todayTrips={stats.todayTrips}
                weeklyEarnings={stats.weeklyEarnings}
                weeklyTrips={stats.weeklyTrips}
              />

              {/* Commission & Payout Section */}
              <div className="grid lg:grid-cols-2 gap-6">
                <CommissionBreakdown
                  weeklyEarnings={stats.weeklyEarnings}
                  weeklyCommission={stats.weeklyCommission}
                />
                <RequestPayoutCard
                  availableBalance={stats.availableBalance}
                  pendingPayout={stats.pendingPayout}
                  onRequestPayout={requestPayout}
                />
              </div>

              {/* Daily Earnings & Payout History */}
              <div className="grid lg:grid-cols-2 gap-6">
                <DailyEarningsTable earnings={dailyEarnings} />
                <PayoutHistory payouts={payouts} />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default DriverEarningsPage;
