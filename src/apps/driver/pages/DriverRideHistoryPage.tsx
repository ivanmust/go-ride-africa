import { useState, useEffect, useMemo } from "react";
import { useDriverAuth } from "@/apps/driver/auth/DriverAuthContext";
import { api } from "@/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Car, MapPin } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Helmet } from "react-helmet-async";

interface RideHistoryItem {
  id: string;
  user_id: string;
  driver_id: string | null;
  driver_name: string | null;
  vehicle_type: string;
  vehicle_plate: string | null;
  pickup_address: string;
  dropoff_address: string;
  fare_amount: number;
  currency: string | null;
  distance_km: number | null;
  duration_minutes: number | null;
  status: string;
  completed_at: string | null;
  user_rating: number | null;
  created_at: string;
}

export const DriverRideHistoryPage = () => {
  const { user } = useDriverAuth();
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    const fetchRideHistory = async () => {
      if (!user) return;
      const { data, error } = await api.get<RideHistoryItem[]>("/ride-history");
      if (!error && data) setRides(data);
      setLoading(false);
    };
    fetchRideHistory();
  }, [user]);

  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      if (status !== "all" && ride.status !== status) return false;
      if (dateRange?.from) {
        const rideDate = new Date(ride.completed_at || ride.created_at);
        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        if (!isWithinInterval(rideDate, { start: fromDate, end: toDate })) return false;
      }
      return true;
    });
  }, [rides, dateRange, status]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{s}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Ride History | GoRide Driver</title>
        <meta name="description" content="View your past trips as a driver." />
      </Helmet>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Ride History</h1>
            <p className="text-muted-foreground mt-2">Trips you’ve completed as a driver</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {(["all", "completed", "cancelled", "in_progress"] as const).map((s) => (
              <Badge
                key={s}
                variant={status === s ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setStatus(s)}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
              </Badge>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRides.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rides yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your completed trips will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRides.map((ride) => (
                <Card key={ride.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{ride.pickup_address}</span>
                      </div>
                      {getStatusBadge(ride.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{ride.dropoff_address}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-3 pt-3 border-t border-border">
                      <span className="font-medium text-foreground">
                        {ride.currency || "RWF"} {Number(ride.fare_amount).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        {ride.completed_at ? format(new Date(ride.completed_at), "MMM d, yyyy · HH:mm") : format(new Date(ride.created_at), "MMM d, yyyy")}
                      </span>
                      {ride.user_rating != null && (
                        <span className="text-amber-600">Rider rated {ride.user_rating}/5</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DriverRideHistoryPage;
