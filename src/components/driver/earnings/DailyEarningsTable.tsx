import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import type { DailyEarning } from "@/hooks/useDriverEarnings";

interface DailyEarningsTableProps {
  earnings: DailyEarning[];
}

export const DailyEarningsTable = ({ earnings }: DailyEarningsTableProps) => {
  if (earnings.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Daily Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No earnings recorded yet.</p>
            <p className="text-sm">Complete trips to start earning!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Daily Earnings (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Trips</TableHead>
              <TableHead className="text-right">Total Fares</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Net Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.map((earning) => (
              <TableRow key={earning.id}>
                <TableCell className="font-medium">
                  {format(parseISO(earning.date), 'EEE, MMM d')}
                </TableCell>
                <TableCell className="text-center">{earning.trips_count}</TableCell>
                <TableCell className="text-right">
                  RWF {Number(earning.total_fares).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  -RWF {Number(earning.commission_amount).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  RWF {Number(earning.net_earnings).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
