import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AcceptanceRateChartProps {
  data: Array<{
    date: string;
    acceptanceRate: number;
  }>;
  currentRate: number;
  trend: "up" | "down" | "stable";
}

const chartConfig: ChartConfig = {
  acceptanceRate: {
    label: "Acceptance Rate",
    color: "hsl(var(--primary))",
  },
};

export const AcceptanceRateChart = ({ data, currentRate, trend }: AcceptanceRateChartProps) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Acceptance Rate Trend</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{currentRate}%</span>
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Last 14 days performance</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[70, 100]} 
              tickLine={false} 
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Acceptance Rate"]}
            />
            <ReferenceLine y={90} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="acceptanceRate"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ChartContainer>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="h-px w-4 bg-muted-foreground opacity-50" style={{ borderTop: "2px dashed" }} />
          <span>90% target threshold</span>
        </div>
      </CardContent>
    </Card>
  );
};
