import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Car, Wallet, Clock } from "lucide-react";

interface EarningsStatsCardsProps {
  todayEarnings: number;
  todayTrips: number;
  weeklyEarnings: number;
  weeklyTrips: number;
}

export const EarningsStatsCards = ({
  todayEarnings,
  todayTrips,
  weeklyEarnings,
  weeklyTrips,
}: EarningsStatsCardsProps) => {
  const stats = [
    {
      title: "Today's Earnings",
      value: `RWF ${todayEarnings.toLocaleString()}`,
      subtitle: `${todayTrips} trips completed`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "This Week",
      value: `RWF ${weeklyEarnings.toLocaleString()}`,
      subtitle: `${weeklyTrips} trips completed`,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Avg per Trip",
      value: weeklyTrips > 0 
        ? `RWF ${Math.round(weeklyEarnings / weeklyTrips).toLocaleString()}`
        : "RWF 0",
      subtitle: "Weekly average",
      icon: Car,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Active Hours",
      value: "—",
      subtitle: "This week",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
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
