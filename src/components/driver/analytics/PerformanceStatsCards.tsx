import { Card, CardContent } from "@/components/ui/card";
import { Star, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PerformanceStatsCardsProps {
  currentRating: number;
  ratingTrend: "up" | "down" | "stable";
  currentAcceptanceRate: number;
  acceptanceTrend: "up" | "down" | "stable";
  totalTripsThisWeek: number;
  cancellationRate: number;
  avgOnlineHours: number;
}

export const PerformanceStatsCards = ({
  currentRating,
  ratingTrend,
  currentAcceptanceRate,
  acceptanceTrend,
  totalTripsThisWeek,
  cancellationRate,
  avgOnlineHours,
}: PerformanceStatsCardsProps) => {
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const stats = [
    {
      title: "Current Rating",
      value: currentRating.toFixed(2),
      subtitle: "Average this week",
      icon: Star,
      color: "text-accent",
      bgColor: "bg-accent/10",
      trend: ratingTrend,
    },
    {
      title: "Acceptance Rate",
      value: `${currentAcceptanceRate}%`,
      subtitle: "This week",
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      trend: acceptanceTrend,
    },
    {
      title: "Trips Completed",
      value: totalTripsThisWeek.toString(),
      subtitle: "This week",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: null,
    },
    {
      title: "Cancellation Rate",
      value: `${cancellationRate}%`,
      subtitle: cancellationRate <= 5 ? "Excellent" : cancellationRate <= 10 ? "Good" : "Needs attention",
      icon: XCircle,
      color: cancellationRate <= 5 ? "text-green-600" : cancellationRate <= 10 ? "text-amber-600" : "text-red-600",
      bgColor: cancellationRate <= 5 ? "bg-green-100" : cancellationRate <= 10 ? "bg-amber-100" : "bg-red-100",
      trend: null,
    },
    {
      title: "Avg Online Hours",
      value: `${avgOnlineHours}h`,
      subtitle: "Per day this week",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  {stat.trend && getTrendIcon(stat.trend)}
                </div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
