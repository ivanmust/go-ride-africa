import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
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
  XCircle,
  Timer,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleMap } from "@/components/maps/GoogleMap";

interface RideRequest {
  id: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
  fare: number;
  distance: string;
  passengerName: string;
  passengerRating: number;
  expiresIn: number;
}

type DriverState = "offline" | "online" | "ride_request" | "navigating_pickup" | "at_pickup" | "in_trip";

export const DriverDashboard = () => {
  const { profile } = useAuth();
  const [driverState, setDriverState] = useState<DriverState>("offline");
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [earnings, setEarnings] = useState({ today: 12500, trips: 8 });

  // Driver's current location (simulated)
  const [driverLocation] = useState({ lat: -1.9441, lng: 30.0619 });

  const toggleOnline = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    setDriverState(newState ? "online" : "offline");
    
    // Simulate a ride request after going online
    if (newState) {
      setTimeout(() => {
        setCurrentRide({
          id: crypto.randomUUID(),
          pickupAddress: "Kigali Convention Centre",
          destinationAddress: "Kigali Heights",
          pickupCoords: { lat: -1.9536, lng: 30.0606 },
          destinationCoords: { lat: -1.9403, lng: 30.0619 },
          fare: 2500,
          distance: "3.2 km",
          passengerName: "Jean Pierre",
          passengerRating: 4.8,
          expiresIn: 15,
        });
        setDriverState("ride_request");
      }, 3000);
    }
  };

  const acceptRide = () => {
    setDriverState("navigating_pickup");
  };

  const declineRide = () => {
    setCurrentRide(null);
    setDriverState("online");
  };

  const arrivedAtPickup = () => {
    setDriverState("at_pickup");
  };

  const startTrip = () => {
    setDriverState("in_trip");
  };

  const completeTrip = () => {
    if (currentRide) {
      setEarnings(prev => ({
        today: prev.today + currentRide.fare,
        trips: prev.trips + 1,
      }));
    }
    setCurrentRide(null);
    setDriverState("online");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-[1fr,380px]">
      {/* Map Area */}
      <div className="relative order-2 lg:order-1">
        <GoogleMap
          pickup={currentRide?.pickupCoords}
          destination={currentRide?.destinationCoords}
          driverLocation={driverLocation}
          showRoute={!!currentRide}
          className="absolute inset-0"
        />

        {/* Ride Request Popup */}
        {driverState === "ride_request" && currentRide && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30 p-4">
            <div className="bg-card rounded-2xl p-6 shadow-xl max-w-sm w-full animate-scale-in border-2 border-accent">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Ride Request</h3>
                <div className="flex items-center gap-1 text-accent">
                  <Timer className="w-4 h-4" />
                  <span className="font-mono">{currentRide.expiresIn}s</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {currentRide.passengerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{currentRide.passengerName}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3 h-3 fill-accent text-accent" />
                      {currentRide.passengerRating}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xl font-bold text-primary">RWF {currentRide.fare.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{currentRide.distance}</div>
                  </div>
                </div>

                <div className="bg-secondary rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary mt-1" />
                    <div>
                      <div className="text-xs text-muted-foreground">Pickup</div>
                      <div className="text-sm font-medium">{currentRide.pickupAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent mt-1" />
                    <div>
                      <div className="text-xs text-muted-foreground">Drop-off</div>
                      <div className="text-sm font-medium">{currentRide.destinationAddress}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={declineRide} className="h-12">
                  <XCircle className="w-5 h-5 mr-2" />
                  Decline
                </Button>
                <Button variant="goride" onClick={acceptRide} className="h-12">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          </div>
        )}
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
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Earnings Summary */}
        <Link to="/earnings" className="block mb-6 group">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-goride-green-light rounded-xl p-4 transition-all group-hover:ring-2 group-hover:ring-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Today's Earnings</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                RWF {earnings.today.toLocaleString()}
              </div>
            </div>
            <div className="bg-goride-amber-light rounded-xl p-4 transition-all group-hover:ring-2 group-hover:ring-accent/30">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Trips Today</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{earnings.trips}</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
            <span>View earnings breakdown</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Active Trip Panel */}
        {(driverState === "navigating_pickup" || driverState === "at_pickup" || driverState === "in_trip") && currentRide && (
          <div className="space-y-4">
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold text-primary">
                      {currentRide.passengerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{currentRide.passengerName}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3 h-3 fill-accent text-accent" />
                      {currentRide.passengerRating}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className={cn(
                    "w-5 h-5 mt-0.5",
                    driverState === "in_trip" ? "text-muted-foreground" : "text-primary"
                  )} />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {driverState === "in_trip" ? "Picked up from" : "Navigate to pickup"}
                    </div>
                    <div className="font-medium">{currentRide.pickupAddress}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Navigation className={cn(
                    "w-5 h-5 mt-0.5",
                    driverState === "in_trip" ? "text-accent" : "text-muted-foreground"
                  )} />
                  <div>
                    <div className="text-xs text-muted-foreground">Drop-off</div>
                    <div className="font-medium">{currentRide.destinationAddress}</div>
                  </div>
                </div>
              </div>
            </div>

            {driverState === "navigating_pickup" && (
              <Button variant="goride" className="w-full h-14 text-lg" onClick={arrivedAtPickup}>
                <MapPin className="w-5 h-5 mr-2" />
                I've Arrived at Pickup
              </Button>
            )}

            {driverState === "at_pickup" && (
              <Button variant="goride-accent" className="w-full h-14 text-lg" onClick={startTrip}>
                <Car className="w-5 h-5 mr-2" />
                Start Trip
              </Button>
            )}

            {driverState === "in_trip" && (
              <Button variant="goride" className="w-full h-14 text-lg" onClick={completeTrip}>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Complete Trip - RWF {currentRide.fare.toLocaleString()}
              </Button>
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

        {driverState === "online" && !currentRide && (
          <div className="text-center py-12">
            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Looking for rides...</h3>
            <p className="text-muted-foreground">
              Stay in high-demand areas to get more requests
            </p>
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
                  <span className="font-medium">4h 32m</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg group-hover:ring-1 group-hover:ring-primary/20 transition-all">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    <span className="text-sm">Rating</span>
                  </div>
                  <span className="font-medium">4.92</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg group-hover:ring-1 group-hover:ring-primary/20 transition-all">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm">Acceptance Rate</span>
                  </div>
                  <span className="font-medium">94%</span>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};
