import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { GoogleMap } from "@/components/maps/GoogleMap";
import { GoogleAddressAutocomplete } from "@/components/maps/GoogleAddressAutocomplete";
import { SaveLocationDialog } from "@/components/locations/SaveLocationDialog";
import { ScheduleRideSelector } from "@/components/ride/ScheduleRideSelector";
import { RideSharingToggle } from "@/components/ride/RideSharingToggle";
import { FareEstimateCard } from "@/components/ride/FareEstimateCard";
import { RideChatDrawer } from "@/components/ride/RideChatDrawer";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import { useFareEstimation } from "@/hooks/useFareEstimation";
import { useDriverTracking } from "@/hooks/useDriverTracking";
import { useRideChat } from "@/hooks/useRideChat";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin,
  Navigation,
  Clock,
  Star,
  Phone,
  MessageSquare,
  Share2,
  Shield,
  Car,
  Bike,
  Truck,
  ChevronRight,
  X,
  User,
  Crosshair,
  Plus,
  Heart,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

type RideState = "booking" | "searching" | "matched" | "arriving" | "riding" | "completed";

interface LocationState {
  pickup?: { lat: number; lng: number; address: string };
  destination?: { lat: number; lng: number; address: string };
  vehicleType?: string;
}

const vehicleTypes = [
  { id: "economy", name: "Economy", icon: Car, time: "3 min", description: "Affordable everyday rides" },
  { id: "comfort", name: "Comfort", icon: Car, time: "5 min", description: "Newer cars, top drivers" },
  { id: "bike", name: "Bike", icon: Bike, time: "2 min", description: "Quick trips, beat traffic" },
  { id: "xl", name: "XL", icon: Truck, time: "7 min", description: "Extra space for groups" },
];

export const RidePage = () => {
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { user } = useAuth();
  const { locations: savedLocations, isLoading: isLoadingLocations, saveLocation, deleteLocation, getLocationIcon } = useSavedLocations();

  const [rideState, setRideState] = useState<RideState>("booking");
  const [pickup, setPickup] = useState(locationState?.pickup?.address || "");
  const [destination, setDestination] = useState(locationState?.destination?.address || "");
  const [selectedVehicle, setSelectedVehicle] = useState(locationState?.vehicleType || "economy");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(
    locationState?.pickup ? { lat: locationState.pickup.lat, lng: locationState.pickup.lng } : null
  );
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(
    locationState?.destination ? { lat: locationState.destination.lat, lng: locationState.destination.lng } : null
  );
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [locationToSave, setLocationToSave] = useState<{ address: string; coords: { lat: number; lng: number } } | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [rideSharing, setRideSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // For demo purposes, we'll use a mock ride ID when in active ride states
  const [currentRideId] = useState(() => crypto.randomUUID());

  // Determine tracking phase based on ride state
  const trackingPhase = rideState === "matched" || rideState === "arriving" 
    ? "to_pickup" 
    : rideState === "riding" 
      ? "to_destination" 
      : "idle";

  // Real-time driver tracking
  const { 
    driverLocation, 
    eta: driverEta, 
    distanceRemaining, 
    isMoving, 
    hasArrived,
    progress: rideProgress,
    resetTracking 
  } = useDriverTracking({
    pickupCoords,
    destinationCoords,
    isActive: rideState !== "booking" && rideState !== "searching" && rideState !== "completed",
    phase: trackingPhase,
  });

  // Handle phase transitions when driver arrives
  useEffect(() => {
    if (hasArrived && rideState === "arriving") {
      // Driver arrived at pickup, transition to riding
      setRideState("riding");
    } else if (hasArrived && rideState === "riding") {
      // Arrived at destination, complete the ride
      setRideState("completed");
    }
  }, [hasArrived, rideState]);

  // Real-time chat
  const isRideActive = rideState === "matched" || rideState === "arriving" || rideState === "riding";
  const { 
    messages, 
    isLoading: isChatLoading, 
    isSending, 
    unreadCount,
    sendMessage,
    markAsRead 
  } = useRideChat({
    rideId: isRideActive ? currentRideId : null,
    enabled: isRideActive,
  });

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isChatOpen && unreadCount > 0) {
      markAsRead();
    }
  }, [isChatOpen, unreadCount, markAsRead]);

  // Fare estimation
  const { fareEstimate, isLoading: isFareLoading, formatFare } = useFareEstimation(
    pickupCoords,
    destinationCoords,
    selectedVehicle,
    rideSharing
  );

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLocatingUser(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setPickupCoords(coords);
          setPickup("Current location");
          setIsLocatingUser(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocatingUser(false);
          // Default to Kigali center
          setPickupCoords({ lat: -1.9441, lng: 30.0619 });
          setPickup("Kigali City Center");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleRequestRide = () => {
    setRideState("searching");
    
    // Simulate driver matching after 2 seconds
    setTimeout(() => {
      setRideState("matched");
      // Driver tracking will automatically start via the hook
    }, 2000);
  };

  const startRideToPickup = () => {
    setRideState("arriving");
    // The useDriverTracking hook handles the movement automatically
  };

  const handleSavedLocationSelect = (loc: { name: string; address: string; latitude: number | null; longitude: number | null }) => {
    if (loc.latitude && loc.longitude) {
      setDestination(loc.address);
      setDestinationCoords({ lat: loc.latitude, lng: loc.longitude });
    }
  };

  const handleSaveDestination = () => {
    if (destinationCoords && destination) {
      setLocationToSave({ address: destination, coords: destinationCoords });
      setSaveDialogOpen(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>Request a Ride | GoRide</title>
        <meta name="description" content="Request a safe and affordable ride with GoRide. Choose from Economy, Comfort, Bike, or XL vehicles." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-16">
          <div className="grid lg:grid-cols-[1fr,400px] min-h-[calc(100vh-64px)]">
            {/* Map Area */}
            <div className="relative order-2 lg:order-1">
              <GoogleMap
                pickup={pickupCoords}
                destination={destinationCoords}
                driverLocation={driverLocation}
                showRoute={!!pickupCoords && !!destinationCoords}
                className="absolute inset-0"
              />

              {/* Ride Status Overlays */}
              {rideState === "searching" && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="text-center animate-fade-in">
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Finding your driver...</h3>
                    <p className="text-muted-foreground">This usually takes a few seconds</p>
                  </div>
                </div>
              )}

              {rideState === "completed" && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="bg-card rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4 animate-scale-in">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-goride-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Ride Complete!</h3>
                      <p className="text-muted-foreground">Thank you for riding with GoRide</p>
                    </div>

                    <div className="bg-secondary rounded-xl p-4 mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Trip fare</span>
                        <span className="font-semibold">RWF 1,200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance</span>
                        <span className="font-semibold">4.2 km</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground mb-3 text-center">Rate your driver</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} className="text-3xl text-accent hover:scale-110 transition-transform">
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button variant="goride" className="w-full" onClick={() => {
                      setRideState("booking");
                      setPickupCoords(null);
                      setDestinationCoords(null);
                      resetTracking();
                      setPickup("");
                      setDestination("");
                    }}>
                      Book Another Ride
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Panel */}
            <div className="bg-card border-l border-border p-6 overflow-y-auto order-1 lg:order-2">
              {/* Booking State */}
              {rideState === "booking" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-bold text-foreground">Request a ride</h2>

                  {/* Location Inputs */}
                  <div className="space-y-3">
                    <GoogleAddressAutocomplete
                      value={pickup}
                      onChange={setPickup}
                      onSelect={(result) => {
                        setPickup(result.address);
                        setPickupCoords({ lat: result.lat, lng: result.lng });
                      }}
                      placeholder="Enter pickup location"
                      variant="pickup"
                      showCurrentLocation
                      onCurrentLocation={getCurrentLocation}
                      isLocating={isLocatingUser}
                    />

                    <GoogleAddressAutocomplete
                      value={destination}
                      onChange={setDestination}
                      onSelect={(result) => {
                        setDestination(result.address);
                        setDestinationCoords({ lat: result.lat, lng: result.lng });
                      }}
                      placeholder="Where to?"
                      variant="destination"
                    />
                  </div>

                  {/* Saved Locations */}
                  {!destinationCoords && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          {user ? "Saved Places" : "Quick Access"}
                        </h3>
                        {user && savedLocations.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {savedLocations.length} saved
                          </span>
                        )}
                      </div>
                      
                      {isLoadingLocations ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : savedLocations.length > 0 ? (
                        <div className="space-y-2">
                          {savedLocations.map((loc) => (
                            <div
                              key={loc.id}
                              className="flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors group"
                            >
                              <button
                                onClick={() => handleSavedLocationSelect(loc)}
                                className="flex items-center gap-3 flex-1 text-left"
                              >
                                <span className="text-xl">{getLocationIcon(loc.label)}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground">{loc.name}</div>
                                  <div className="text-sm text-muted-foreground truncate">{loc.address}</div>
                                </div>
                              </button>
                              <button
                                onClick={() => deleteLocation(loc.id)}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : user ? (
                        <div className="text-center py-6 bg-secondary/50 rounded-xl">
                          <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No saved places yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Search for a destination to save it
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-secondary/50 rounded-xl">
                          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Sign in to save places</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vehicle Selection */}
                  {destinationCoords && (
                    <>
                      {/* Fare Estimate */}
                      {fareEstimate && (
                        <FareEstimateCard
                          distance={fareEstimate.distance}
                          duration={fareEstimate.duration}
                          baseFare={fareEstimate.baseFare}
                          discountedFare={fareEstimate.discountedFare}
                          currency={fareEstimate.currency}
                          isLoading={isFareLoading}
                        />
                      )}

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Choose a ride</h3>
                        <div className="space-y-2">
                          {vehicleTypes.map((vehicle) => (
                            <button
                              key={vehicle.id}
                              onClick={() => setSelectedVehicle(vehicle.id)}
                              className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl transition-all border-2",
                                selectedVehicle === vehicle.id
                                  ? "border-primary bg-goride-green-light"
                                  : "border-transparent bg-secondary hover:bg-secondary/80"
                              )}
                            >
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                selectedVehicle === vehicle.id ? "bg-primary text-primary-foreground" : "bg-background"
                              )}>
                                <vehicle.icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-foreground">{vehicle.name}</div>
                                <div className="text-sm text-muted-foreground">{vehicle.description}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">{vehicle.time}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Save Destination Button */}
                      {user && (
                        <button
                          onClick={handleSaveDestination}
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Save this destination
                        </button>
                      )}

                      {/* Ride Sharing Option */}
                      <RideSharingToggle
                        enabled={rideSharing}
                        onToggle={setRideSharing}
                      />

                      {/* Schedule Ride */}
                      <ScheduleRideSelector
                        scheduledDate={scheduledDate}
                        onScheduleChange={setScheduledDate}
                      />

                      {/* Payment Method */}
                      <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-goride-amber-light rounded-lg flex items-center justify-center">
                            <span className="text-lg">💵</span>
                          </div>
                          <span className="font-medium">Cash</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {/* Request Button */}
                      <Button
                        variant="hero"
                        size="xl"
                        className="w-full"
                        onClick={handleRequestRide}
                        disabled={!pickupCoords}
                      >
                        {scheduledDate 
                          ? `Schedule ${vehicleTypes.find(v => v.id === selectedVehicle)?.name}` 
                          : `Request ${vehicleTypes.find(v => v.id === selectedVehicle)?.name}`}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Matched / Arriving State */}
              {(rideState === "matched" || rideState === "arriving") && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {rideState === "matched" ? "Driver on the way" : "Driver arriving"}
                      </h2>
                      <p className="text-muted-foreground">
                        {driverEta > 0 ? `${driverEta} min away` : "Almost there"} 
                        {distanceRemaining > 0 && ` • ${distanceRemaining} km`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setRideState("booking");
                      resetTracking();
                    }}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Driver Card */}
                  <div className="bg-secondary rounded-2xl p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">Emmanuel N.</div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span>4.95</span>
                          <span className="text-muted-foreground">• 1,234 trips</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-background rounded-xl mb-4">
                      <Car className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Toyota Corolla • White</div>
                        <div className="text-sm text-muted-foreground">RAC 123 A</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button variant="goride-outline" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                      <Button 
                        variant="goride-outline" 
                        className="flex-1 relative"
                        onClick={() => setIsChatOpen(true)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Safety Features */}
                  <div className="flex gap-3">
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share trip
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Shield className="w-4 h-4 mr-2" />
                      Safety
                    </Button>
                  </div>

                  {/* Trip Details */}
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-3 h-3 bg-primary rounded-full mt-1.5" />
                      <div>
                        <div className="font-medium text-foreground">Pickup</div>
                        <div className="text-sm text-muted-foreground">{pickup || "Your location"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-accent rounded-sm mt-1.5" />
                      <div>
                        <div className="font-medium text-foreground">Destination</div>
                        <div className="text-sm text-muted-foreground">{destination}</div>
                      </div>
                    </div>
                  </div>

                  <Button variant="goride" className="w-full" onClick={startRideToPickup}>
                    Start Tracking Driver
                  </Button>
                </div>
              )}

              {/* Riding State */}
              {rideState === "riding" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">On your way!</h2>
                    <p className="text-muted-foreground">
                      {driverEta > 0 ? `Arriving in ${driverEta} minutes` : "Arriving now"}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(rideProgress, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {distanceRemaining > 0 ? `${distanceRemaining} km remaining` : "Arrived"}
                    </span>
                    <span className="font-medium text-foreground">
                      {fareEstimate ? formatFare(fareEstimate.discountedFare || fareEstimate.baseFare) : "RWF 1,200"}
                    </span>
                  </div>

                  {/* Driver Mini Card */}
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Emmanuel N.</div>
                      <div className="text-sm text-muted-foreground">Toyota Corolla</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(true)} className="relative">
                      <MessageSquare className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Safety Features */}
                  <div className="flex gap-3">
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share trip
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1">
                      <Shield className="w-4 h-4 mr-2" />
                      SOS
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Save Location Dialog */}
      {locationToSave && (
        <SaveLocationDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          address={locationToSave.address}
          coordinates={locationToSave.coords}
          onSave={saveLocation}
        />
      )}

      {/* Chat Drawer */}
      <RideChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={sendMessage}
        isSending={isSending}
        isLoading={isChatLoading}
        driverName="Emmanuel N."
      />
    </>
  );
};

export default RidePage;
