import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RatingHistoryChartProps {
  data: Array<{
    date: string;
    rating: number;
  }>;
  currentRating: number;
  trend: "up" | "down" | "stable";
}

const chartConfig: ChartConfig = {
  rating: {
    label: "Rating",
    color: "hsl(var(--accent))",
  },
};

export const RatingHistoryChart = ({ data, currentRating, trend }: RatingHistoryChartProps) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Rating History</CardTitle>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-accent text-accent" />
            <span className="text-2xl font-bold">{currentRating.toFixed(2)}</span>
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Average daily rating over 14 days</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[4, 5]} 
              tickLine={false} 
              axisLine={false}
              tick={{ fontSize: 11 }}
              ticks={[4, 4.25, 4.5, 4.75, 5]}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value) => [Number(value).toFixed(2), "Rating"]}
            />
            <ReferenceLine y={4.7} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
            <Area
              type="monotone"
              dataKey="rating"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              fill="url(#ratingGradient)"
              dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "hsl(var(--accent))" }}
            />
          </AreaChart>
        </ChartContainer>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="h-px w-4 bg-muted-foreground opacity-50" style={{ borderTop: "2px dashed" }} />
          <span>4.7 excellence threshold</span>
        </div>
      </CardContent>
    </Card>
  );
};
