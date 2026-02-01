import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Smartphone, CheckCircle, Clock, XCircle } from "lucide-react";
import type { Payout } from "@/hooks/useDriverEarnings";

interface PayoutHistoryProps {
  payouts: Payout[];
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-600",
  },
  processing: {
    label: "Processing",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-blue-600",
  },
  completed: {
    label: "Completed",
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600",
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
  },
};

export const PayoutHistory = ({ payouts }: PayoutHistoryProps) => {
  if (payouts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No payouts yet.</p>
            <p className="text-sm">Request a payout when you have available balance.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Payout History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payouts.map((payout) => {
            const config = statusConfig[payout.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div
                key={payout.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-full border">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {payout.mobile_money_provider || 'Mobile Money'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payout.mobile_money_number || '—'} • {format(parseISO(payout.requested_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">RWF {Number(payout.amount).toLocaleString()}</p>
                  <Badge variant={config.variant} className="mt-1">
                    <StatusIcon className={`h-3 w-3 mr-1 ${config.color}`} />
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
