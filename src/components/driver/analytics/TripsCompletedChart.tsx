import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Car } from "lucide-react";

interface TripsCompletedChartProps {
  data: Array<{
    date: string;
    tripsCompleted: number;
    tripsCancelled: number;
  }>;
}

const chartConfig: ChartConfig = {
  tripsCompleted: {
    label: "Completed",
    color: "hsl(var(--primary))",
  },
  tripsCancelled: {
    label: "Cancelled",
    color: "hsl(var(--destructive))",
  },
};

export const TripsCompletedChart = ({ data }: TripsCompletedChartProps) => {
  const totalCompleted = data.reduce((sum, d) => sum + d.tripsCompleted, 0);
  const totalCancelled = data.reduce((sum, d) => sum + d.tripsCancelled, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Daily Trip Activity</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Completed: {totalCompleted}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-destructive" />
              <span className="text-muted-foreground">Cancelled: {totalCancelled}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Trip completion vs cancellation over 14 days</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="tripsCompleted" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              name="Completed"
            />
            <Bar 
              dataKey="tripsCancelled" 
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]}
              name="Cancelled"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
