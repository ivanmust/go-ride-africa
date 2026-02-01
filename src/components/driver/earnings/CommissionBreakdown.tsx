import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommissionBreakdownProps {
  weeklyEarnings: number;
  weeklyCommission: number;
  commissionRate?: number;
}

export const CommissionBreakdown = ({
  weeklyEarnings,
  weeklyCommission,
  commissionRate = 15,
}: CommissionBreakdownProps) => {
  const totalFares = weeklyEarnings + weeklyCommission;
  const driverPercentage = 100 - commissionRate;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Commission Breakdown</CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>GoRide takes a {commissionRate}% commission on each fare</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Fares (This Week)</span>
            <span className="font-medium">RWF {totalFares.toLocaleString()}</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 font-medium">Your Earnings ({driverPercentage}%)</p>
            <p className="text-lg font-bold text-green-800">
              RWF {weeklyEarnings.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground font-medium">Platform Fee ({commissionRate}%)</p>
            <p className="text-lg font-bold text-foreground">
              RWF {weeklyCommission.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${driverPercentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-primary">{driverPercentage}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You keep {driverPercentage}% of every fare
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
