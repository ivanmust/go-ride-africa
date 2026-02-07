import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, MapPin, Trash2, Play } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useScheduledRides } from "@/hooks/useScheduledRides";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MatchedDriver } from "@/hooks/useCreateRide";

export const ScheduledRidesPage = () => {
  const navigate = useNavigate();
  const { rides, isLoading, error, cancelRide, startRide } = useScheduledRides();

  const handleCancel = async (id: string) => {
    const ok = await cancelRide(id);
    if (ok) toast.success("Scheduled ride cancelled");
    else toast.error("Failed to cancel scheduled ride");
  };

  const handleStartRide = async (ride: { id: string }) => {
    const fareInput = window.prompt("Enter fare amount (RWF):", "1500");
    if (fareInput == null) return;
    const fare = Number(fareInput);
    if (!Number.isFinite(fare) || fare <= 0) {
      toast.error("Please enter a valid fare amount");
      return;
    }
    const result = await startRide(ride.id, fare);
    if (result) {
      toast.success("Ride requested! Finding your driver…");
      navigate("/ride", {
        state: {
          scheduledStartResult: {
            rideRequestId: result.rideRequestId,
            driver: result.driver as MatchedDriver | null,
          },
        },
      });
    } else {
      toast.error("Failed to start ride. Try again or book from the main ride page.");
    }
  };

  const hasRides = rides.length > 0;

  return (
    <>
      <Helmet>
        <title>Scheduled Rides | GoRide</title>
      </Helmet>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Link to="/ride">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Rides
            </CardTitle>
            <CardDescription>View and manage your scheduled trips.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="py-8 text-center text-sm text-destructive">
                {error}
              </div>
            ) : !hasRides ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-4 opacity-50" />
                <p>No scheduled rides. Book a ride and choose “Schedule” to add one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rides.map((ride) => {
                  const scheduledAt = new Date(ride.scheduled_at);
                  const now = new Date();
                  const isPast = scheduledAt < now;
                  const isDueOrSoon = isPast || scheduledAt.getTime() - now.getTime() < 30 * 60 * 1000; // due or within 30 min
                  const isScheduled = ride.status === "scheduled";
                  return (
                    <div
                      key={ride.id}
                      className={cn(
                        "p-4 rounded-xl border flex items-start justify-between gap-4",
                        isScheduled
                          ? "border-primary/20 bg-goride-green-light/40"
                          : "border-border bg-secondary/40"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(ride.scheduled_at), "EEE, MMM d • h:mm a")}
                          </span>
                          <span className="mx-1">•</span>
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              ride.status === "scheduled" && !isPast
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                                : ride.status === "cancelled"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {ride.status === "scheduled" && isPast ? "Past time" : ride.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-primary mt-0.5" />
                            <span className="font-medium text-foreground">
                              {ride.pickup_address}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-accent mt-0.5" />
                            <span className="text-muted-foreground">
                              {ride.dropoff_address}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ride.vehicle_type?.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isScheduled && isDueOrSoon && (
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleStartRide(ride)}
                          >
                            <Play className="h-4 w-4" />
                            Start ride
                          </Button>
                        )}
                        {isScheduled && !isPast && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleCancel(ride.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ScheduledRidesPage;
