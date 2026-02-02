import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Car, MapPin, Clock, Star, SearchX } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { RideHistoryFilters, type RideStatus } from '@/components/ride/RideHistoryFilters';
import type { DateRange } from 'react-day-picker';

interface RideHistoryItem {
  id: string;
  driver_name: string | null;
  driver_rating: number | null;
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

const RideHistoryPage = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [status, setStatus] = useState<RideStatus>("all");

  useEffect(() => {
    const fetchRideHistory = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('ride_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRides(data);
      }
      setLoading(false);
    };

    fetchRideHistory();
  }, [user]);

  // Filter rides based on selected filters
  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      // Status filter
      if (status !== "all" && ride.status !== status) {
        return false;
      }

      // Date range filter
      if (dateRange?.from) {
        const rideDate = new Date(ride.completed_at || ride.created_at);
        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        
        if (!isWithinInterval(rideDate, { start: fromDate, end: toDate })) {
          return false;
        }
      }

      return true;
    });
  }, [rides, dateRange, status]);

  const handleClearFilters = () => {
    setDateRange(undefined);
    setStatus("all");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string | null) => {
    return `${currency || 'RWF'} ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Ride History</h1>
            <p className="text-muted-foreground mt-2">View all your past trips</p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <RideHistoryFilters
              dateRange={dateRange}
              status={status}
              onDateRangeChange={setDateRange}
              onStatusChange={setStatus}
              onClearFilters={handleClearFilters}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rides.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No rides yet</h3>
                <p className="text-muted-foreground">
                  Your ride history will appear here after your first trip
                </p>
              </CardContent>
            </Card>
          ) : filteredRides.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <SearchX className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No matching rides</h3>
                <p className="text-muted-foreground">
                  No rides found for the selected filters. Try adjusting your criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results count */}
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredRides.length} of {rides.length} rides
              </p>

              <div className="space-y-4">
                {filteredRides.map((ride) => (
                  <Card key={ride.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {ride.completed_at 
                              ? format(new Date(ride.completed_at), 'MMM d, yyyy • h:mm a')
                              : format(new Date(ride.created_at), 'MMM d, yyyy • h:mm a')
                            }
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                              {ride.vehicle_type}
                            </Badge>
                            {getStatusBadge(ride.status)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(Number(ride.fare_amount), ride.currency)}
                          </p>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 mt-1.5 rounded-full bg-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Pickup</p>
                            <p className="font-medium">{ride.pickup_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 mt-1.5 rounded-full bg-red-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Dropoff</p>
                            <p className="font-medium">{ride.dropoff_address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Trip Details */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
                        {ride.distance_km && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{ride.distance_km} km</span>
                          </div>
                        )}
                        {ride.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{ride.duration_minutes} min</span>
                          </div>
                        )}
                        {ride.driver_name && (
                          <div className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            <span>{ride.driver_name}</span>
                            {ride.vehicle_plate && (
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {ride.vehicle_plate}
                              </span>
                            )}
                          </div>
                        )}
                        {ride.user_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>You rated {ride.user_rating}/5</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RideHistoryPage;
