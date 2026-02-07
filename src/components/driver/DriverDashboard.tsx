import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useDriverAuth } from "@/apps/driver/auth/DriverAuthContext";
import { useDriverOnline } from "@/hooks/useDriverOnline";
import { useDriverActiveRide } from "@/hooks/useDriverActiveRide";
import { useDriverEarnings } from "@/hooks/useDriverEarnings";
import { useDriverPerformance } from "@/hooks/useDriverPerformance";
import { useDriverRideChat } from "@/hooks/useDriverRideChat";
import { useIncomingRideRequests } from "@/hooks/useIncomingRideRequests";
import { api } from "@/shared";
import {
  DollarSign,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  Car,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleMap } from "@/components/maps/GoogleMap";
import { RideChatDrawer } from "@/components/ride/RideChatDrawer";

type TripPhase = "navigating_pickup" | "at_pickup" | "in_trip";

export const DriverDashboard = () => {
  const { profile } = useDriverAuth();
  const { isOnline, setOnline, isToggling, error: onlineError, driverLocation } = useDriverOnline();
  const { ride: activeRide, completeRide, cancelRide } = useDriverActiveRide();
  const { stats: earningsStats, refetch: refetchEarnings } = useDriverEarnings();
  const { stats: performanceStats, refetch: refetchPerformance } = useDriverPerformance();
  const [tripPhase, setTripPhase] = useState<TripPhase>("navigating_pickup");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { requests: incomingRequests, isLoading: isIncomingLoading } = useIncomingRideRequests();

  const pickupCoords = useMemo(
    () =>
      activeRide?.pickupLat != null && activeRide?.pickupLng != null
        ? { lat: activeRide.pickupLat, lng: activeRide.pickupLng }
        : null,
    [activeRide]
  );
  const destinationCoords = useMemo(
    () =>
      activeRide?.dropoffLat != null && activeRide?.dropoffLng != null
        ? { lat: activeRide.dropoffLat, lng: activeRide.dropoffLng }
        : null,
    [activeRide]
  );
  const defaultDriverLoc = { lat: -1.9441, lng: 30.0619 };

  const {
    messages,
    isLoading: isChatLoading,
    isSending: isChatSending,
    unreadCount,
    sendMessage,
    markAsRead,
  } = useDriverRideChat({
    rideId: activeRide?.id ?? null,
    enabled: !!activeRide,
  });

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isChatOpen && unreadCount > 0) {
      markAsRead();
    }
  }, [isChatOpen, unreadCount, markAsRead]);

  const toggleOnline = (checked: boolean) => {
    setOnline(checked);
  };

  const arrivedAtPickup = () => setTripPhase("at_pickup");
  const startTrip = () => setTripPhase("in_trip");
  const completeTrip = async () => {
    if (activeRide) {
      await completeRide();
      await Promise.all([refetchEarnings(), refetchPerformance()]);
      setTripPhase("navigating_pickup");
    }
  };

  const hasActiveRide = !!activeRide;
  const hasIncoming = incomingRequests.length > 0;
  const nextIncoming = hasIncoming ? incomingRequests[0] : null;
  const driverState = !isOnline ? "offline" : hasActiveRide ? "active_trip" : "online";

  return (
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-[1fr,380px]">
      {/* Map Area */}
      <div className="relative order-2 lg:order-1">
        <GoogleMap
          pickup={pickupCoords}
          destination={destinationCoords}
          driverLocation={driverLocation ?? defaultDriverLoc}
          showRoute={hasActiveRide}
          className="absolute inset-0"
        />
      </div>

      {/* Sidebar */}
      <div className="bg-card border-l border-border p-6 overflow-y-auto order-1 lg:order-2">
        {/* Driver Status Toggle */}
        <div className="flex items-center justify-between mb-6 p-4 bg-secondary rounded-xl">
          <div>
            <div className="font-semibold text-foreground">
              {isOnline ? "You're Online" : "You're Offline"}
            </div>
            <div className="text-sm text-muted-foreground">
              {isOnline ? "Accepting ride requests" : "Go online to start earning"}
            </div>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={toggleOnline}
            disabled={isToggling}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        {onlineError && (
          <p className="text-sm text-destructive mb-4">{onlineError}</p>
        )}

        {profile && profile.is_driver_approved === false && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Your application is under review
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can go online, but you&apos;ll only receive ride requests once an admin approves your account.
            </p>
          </div>
        )}

        {/* Earnings Summary */}
        <Link to="/earnings" className="block mb-6 group">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-goride-green-light rounded-xl p-4 transition-all group-hover:ring-2 group-hover:ring-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Today's Earnings</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                RWF {(Number(earningsStats?.todayEarnings) || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-goride-amber-light rounded-xl p-4 transition-all group-hover:ring-2 group-hover:ring-accent/30">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Trips Today</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Number.isFinite(Number(earningsStats?.todayTrips)) ? Number(earningsStats?.todayTrips) : 0}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
            <span>View earnings breakdown</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Active Trip Panel */}
        {driverState === "active_trip" && activeRide && (
          <div className="space-y-4">
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold text-primary">
                      {(activeRide.passengerName ?? "P").charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{activeRide.passengerName ?? "Passenger"}</div>
                    <div className="text-sm text-muted-foreground">
                      RWF {activeRide.fareAmount.toLocaleString()}
                      {activeRide.distanceKm != null && ` • ${activeRide.distanceKm} km`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeRide.passengerPhone ? (
                    <Button size="icon" variant="outline" asChild>
                      <a href={`tel:${activeRide.passengerPhone.replace(/\s/g, "")}`} rel="noopener noreferrer" aria-label="Call passenger">
                        <Phone className="w-4 h-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button size="icon" variant="outline" disabled aria-label="Call passenger" title="Passenger phone not available">
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="outline"
                    className="relative"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className={cn(
                    "w-5 h-5 mt-0.5",
                    tripPhase === "in_trip" ? "text-muted-foreground" : "text-primary"
                  )} />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {tripPhase === "in_trip" ? "Picked up from" : "Navigate to pickup"}
                    </div>
                    <div className="font-medium">{activeRide.pickupAddress}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Navigation className={cn(
                    "w-5 h-5 mt-0.5",
                    tripPhase === "in_trip" ? "text-accent" : "text-muted-foreground"
                  )} />
                  <div>
                    <div className="text-xs text-muted-foreground">Drop-off</div>
                    <div className="font-medium">{activeRide.dropoffAddress}</div>
                  </div>
                </div>
              </div>
            </div>

            {tripPhase === "navigating_pickup" && (
              <Button variant="goride" className="w-full h-14 text-lg" onClick={arrivedAtPickup}>
                <MapPin className="w-5 h-5 mr-2" />
                I've Arrived at Pickup
              </Button>
            )}

            {tripPhase === "at_pickup" && (
              <Button variant="goride-accent" className="w-full h-14 text-lg" onClick={startTrip}>
                <Car className="w-5 h-5 mr-2" />
                Start Trip
              </Button>
            )}

            {tripPhase === "in_trip" && (
              <>
                <Button variant="goride" className="w-full h-14 text-lg" onClick={completeTrip}>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Complete Trip - RWF {activeRide.fareAmount.toLocaleString()}
                </Button>
                <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={cancelRide}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel ride
                </Button>
              </>
            )}
          </div>
        )}

        {/* Offline/Online Status */}
        {driverState === "offline" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Ready to earn?</h3>
            <p className="text-muted-foreground mb-6">
              Toggle the switch above to go online and start receiving ride requests.
            </p>
          </div>
        )}

        {driverState === "online" && !activeRide && !hasIncoming && (
          <div className="text-center py-12">
            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Looking for rides...</h3>
            <p className="text-muted-foreground">
              Stay in high-demand areas to get more requests
            </p>
          </div>
        )}

        {/* Incoming ride request card */}
        {driverState === "online" && !activeRide && nextIncoming && (
          <div className="mb-6">
            <Card className="border-primary/40 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>New ride request</span>
                  {isIncomingLoading && (
                    <span className="text-xs text-muted-foreground">Updating…</span>
                  )}
                </CardTitle>
                <CardDescription>Review pickup and dropoff, then accept or decline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Pickup</div>
                      <div className="font-medium text-foreground">{nextIncoming.pickup_address}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Navigation className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Drop-off</div>
                      <div className="text-foreground">{nextIncoming.dropoff_address}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="goride"
                    className="flex-1"
                    onClick={async () => {
                      await api.post(`/ride-requests/${nextIncoming.id}/accept`, {});
                      await Promise.all([refetchEarnings(), refetchPerformance()]);
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      await api.post(`/ride-requests/${nextIncoming.id}/reject`, {});
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        {isOnline && (
          <Link to="/performance" className="block mt-6 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Today's Stats</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg group-hover:ring-1 group-hover:ring-primary/20 transition-all">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Online Time</span>
                  </div>
                  <span className="font-medium">
                    {Number.isFinite(performanceStats?.avgOnlineHours) && (performanceStats?.avgOnlineHours ?? 0) > 0
                      ? `${Math.floor(performanceStats.avgOnlineHours)}h ${Math.round(((performanceStats?.avgOnlineHours ?? 0) % 1) * 60)}m`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg group-hover:ring-1 group-hover:ring-primary/20 transition-all">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    <span className="text-sm">Rating</span>
                  </div>
                  <span className="font-medium">
                    {Number.isFinite(performanceStats?.currentRating) && (performanceStats?.currentRating ?? 0) > 0
                      ? Number(performanceStats.currentRating).toFixed(1)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg group-hover:ring-1 group-hover:ring-primary/20 transition-all">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm">Acceptance Rate</span>
                  </div>
                  <span className="font-medium">
                    {Number.isFinite(performanceStats?.currentAcceptanceRate) && (performanceStats?.currentAcceptanceRate ?? -1) >= 0
                      ? `${performanceStats?.currentAcceptanceRate}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Chat Drawer for driver ↔ passenger messaging */}
      <RideChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={sendMessage}
        isSending={isChatSending}
        isLoading={isChatLoading}
        driverName={activeRide?.passengerName ?? "Passenger"}
        isDriverView
      />
    </div>
  );
};
