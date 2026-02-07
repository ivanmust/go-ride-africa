import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
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
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useApprovedDrivers } from "@/hooks/useApprovedDrivers";
import { useDriverLiveLocation } from "@/hooks/useDriverLiveLocation";
import { useCreateRide, type MatchedDriver } from "@/hooks/useCreateRide";
import { usePassengerAuth } from "@/apps/passenger/auth/PassengerAuthContext";
import { api } from "@/shared";
import { toast } from "sonner";
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
  CreditCard,
  CheckCircle,
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
  const navigate = useNavigate();
  const locationState = location.state as LocationState | null;
  const { user } = usePassengerAuth();
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
  const [rideRequestId, setRideRequestId] = useState<string | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [matchedDriver, setMatchedDriver] = useState<MatchedDriver | null>(null);
  const [completedFareAmount, setCompletedFareAmount] = useState<number | null>(null);
  const [completedDistanceKm, setCompletedDistanceKm] = useState<number | null>(null);
  const [completedRating, setCompletedRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{ paid: boolean; status: string | null } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const hasReassignedRef = useRef(false);
  const paymentVerifyDoneRef = useRef(false);

  const { methods: paymentMethods, isLoading: isLoadingPaymentMethods, defaultMethod } = usePaymentMethods();
  const { drivers: approvedDrivers, isLoading: isLoadingApprovedDrivers } = useApprovedDrivers({ enabled: !!user });
  const { createRide, isSubmitting: isCreatingRide, error: createRideError } = useCreateRide();
  const { fareEstimate, isLoading: isFareLoading, formatFare } = useFareEstimation(
    pickupCoords,
    destinationCoords,
    selectedVehicle,
    rideSharing
  );

  // Live driver location for the matched driver (uses real GPS from driver app)
  const { location: liveDriverLocation } = useDriverLiveLocation(matchedDriver?.driverId ?? null);

  // Set default payment method when loaded
  useEffect(() => {
    if (defaultMethod && !selectedPaymentMethodId) setSelectedPaymentMethodId(defaultMethod.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when default method id or selection changes
  }, [defaultMethod?.id, selectedPaymentMethodId]);

  // When arriving from ScheduledRidesPage "Start ride", apply the result and go to searching state
  useEffect(() => {
    const state = location.state as { scheduledStartResult?: { rideRequestId: string; driver: MatchedDriver | null } } | null;
    const result = state?.scheduledStartResult;
    if (!result?.rideRequestId) return;
    setRideRequestId(result.rideRequestId);
    setMatchedDriver(result.driver ?? null);
    setRideState("searching");
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  // Flutterwave payment callback: verify tx_id then clear URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") !== "callback" || !params.get("tx_id") || paymentVerifyDoneRef.current) return;
    paymentVerifyDoneRef.current = true;
    const txId = params.get("tx_id")!;
    api.get<{ status: string; message?: string }>(`/payments/verify?tx_id=${encodeURIComponent(txId)}`).then(({ data, error }) => {
      if (data?.status === "completed") {
        toast.success("Payment successful!");
        setPaymentStatus({ paid: true, status: "completed" });
      } else if (data?.status === "failed") toast.error("Payment failed or was not completed.");
      else if (error) toast.error("Could not verify payment.");
      navigate(location.pathname, { replace: true });
    });
  }, [location.search, location.pathname, navigate]);

  // Fetch payment status when ride is completed
  useEffect(() => {
    if (rideState !== "completed" || !currentRideId) {
      setPaymentStatus(null);
      return;
    }
    api.get<{ paid: boolean; status: string | null }>(`/payments/status?ride_history_id=${encodeURIComponent(currentRideId)}`).then(({ data }) => {
      if (data) setPaymentStatus({ paid: data.paid, status: data.status });
    });
  }, [rideState, currentRideId]);

  // Determine tracking phase based on ride state
  const trackingPhase = rideState === "matched" || rideState === "arriving" 
    ? "to_pickup" 
    : rideState === "riding" 
      ? "to_destination" 
      : "idle";

  // Real-time driver tracking
  const {
    driverLocation: simulatedDriverLocation,
    eta: driverEta,
    distanceRemaining,
    isMoving,
    hasArrived,
    progress: rideProgress,
    resetTracking,
  } = useDriverTracking({
    pickupCoords,
    destinationCoords,
    isActive: rideState !== "booking" && rideState !== "searching" && rideState !== "completed",
    phase: trackingPhase,
  });

  // Handle phase transitions when driver arrives (simulated tracking)
  useEffect(() => {
    if (!hasArrived) return;
    if (rideState === "matched" || rideState === "arriving") {
      // Driver reached pickup, now driving to destination
      setRideState("riding");
    } else if (rideState === "riding") {
      // Driver reached destination
      setRideState("completed");
      if (fareEstimate) {
        setCompletedFareAmount(fareEstimate.discountedFare ?? fareEstimate.baseFare);
        setCompletedDistanceKm(fareEstimate.distance ?? null);
      }
      if (currentRideId) {
        const updateRide = async () => {
          const { error } = await api.patch(`/ride-history/${currentRideId}`, { status: "completed", completed_at: new Date().toISOString() });
          if (error) console.error("Failed to complete ride:", error);
        };
        updateRide();
      }
    }
  }, [hasArrived, rideState, currentRideId, fareEstimate]);

  // Poll for ride status when driver completes (no realtime with Postgres backend)
  const RIDE_STATUS_POLL_MS = 3000;
  useEffect(() => {
    if (!currentRideId || rideState === "completed") return;
    const poll = async () => {
      const { data } = await api.get<{ status: string; fare_amount?: number; distance_km?: number }>(`/ride-history/${currentRideId}`);
      if (data?.status === "completed") {
        setRideState("completed");
        if (data.fare_amount != null) setCompletedFareAmount(Number(data.fare_amount));
        if (data.distance_km != null) setCompletedDistanceKm(Number(data.distance_km));
      } else if (data?.status === "cancelled") {
        setRideState("booking");
        resetTracking();
        setCurrentRideId(null);
        setMatchedDriver(null);
        toast.info("Ride was cancelled");
      }
    };
    const interval = setInterval(poll, RIDE_STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [currentRideId, rideState]);

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

  const handleRequestRide = async () => {
    if (!fareEstimate || !pickupCoords || !destinationCoords) return;

    // If user chose a future time, save as a scheduled ride instead of starting now.
    if (scheduledDate) {
      try {
        await api.post("/scheduled-rides", {
          pickup_address: pickup || "Pickup",
          pickup_lat: pickupCoords.lat,
          pickup_lng: pickupCoords.lng,
          dropoff_address: destination,
          dropoff_lat: destinationCoords.lat,
          dropoff_lng: destinationCoords.lng,
          vehicle_type: selectedVehicle,
          scheduled_at: scheduledDate.toISOString(),
        });
        toast.success("Ride scheduled successfully");
        setScheduledDate(null);
      } catch (e) {
        console.error("Failed to schedule ride", e);
        toast.error("Failed to schedule ride");
      }
      return;
    }

    if (!selectedPaymentMethodId) {
      toast.error("Please select a payment method to book your ride.");
      return;
    }

    setRideState("searching");
    const result = await createRide({
      pickupAddress: pickup || "Pickup",
      pickupLat: pickupCoords.lat,
      pickupLng: pickupCoords.lng,
      dropoffAddress: destination,
      dropoffLat: destinationCoords.lat,
      dropoffLng: destinationCoords.lng,
      vehicleType: selectedVehicle,
      paymentMethodId: selectedPaymentMethodId,
      fareAmount: fareEstimate.discountedFare ?? fareEstimate.baseFare,
      currency: fareEstimate.currency ?? "RWF",
      distanceKm: fareEstimate.distance ?? null,
      durationMinutes: fareEstimate.duration ?? null,
      rideSharing: rideSharing ?? false,
    });

    if (result) {
      setRideRequestId(result.rideRequestId);
      setMatchedDriver(result.driver);
      // Stay in "searching" state until driver accepts
    } else {
      setRideState("booking");
      if (createRideError) toast.error(createRideError);
    }
  };

  const startRideToPickup = () => {
    setRideState("arriving");
    // The useDriverTracking hook handles the movement automatically
  };

  // Reset reassign flag when starting a new request
  useEffect(() => {
    hasReassignedRef.current = false;
  }, [rideRequestId]);

  // Poll for ride request status while searching for driver acceptance; auto-reassign once if declined
  useEffect(() => {
    if (!rideRequestId || rideState !== "searching") return;
    const POLL_MS = 3000;
    const poll = async () => {
      const { data, error } = await api.get<{ status: string; ride_history_id?: string }>(
        `/ride-requests/${rideRequestId}`
      );
      if (error || !data) return;
      if (data.status === "accepted" && data.ride_history_id) {
        setCurrentRideId(data.ride_history_id);
        setRideState("matched");
        hasReassignedRef.current = false;
      } else if (data.status === "declined") {
        if (!hasReassignedRef.current) {
          hasReassignedRef.current = true;
          const { data: reassignData, error: reassignError } = await api.post<{
            ride_request_id: string;
            driver?: { driver_id: string; full_name: string | null; avatar_url: string | null; phone: string | null; vehicle_type: string | null; vehicle_plate: string | null; vehicle_make?: string | null; vehicle_model?: string | null; vehicle_color?: string | null };
          }>(`/ride-requests/${rideRequestId}/reassign`, {});
          if (!reassignError && reassignData?.driver) {
            setMatchedDriver({
              driverId: reassignData.driver.driver_id,
              fullName: reassignData.driver.full_name ?? "Your driver",
              avatarUrl: reassignData.driver.avatar_url ?? null,
              phone: reassignData.driver.phone ?? null,
              vehicleType: reassignData.driver.vehicle_type ?? "economy",
              vehiclePlate: reassignData.driver.vehicle_plate ?? "—",
              vehicleMake: reassignData.driver.vehicle_make ?? null,
              vehicleModel: reassignData.driver.vehicle_model ?? null,
              vehicleColor: reassignData.driver.vehicle_color ?? null,
            });
            toast.info("Finding another driver…");
            return;
          }
        }
        setRideState("booking");
        setRideRequestId(null);
        setMatchedDriver(null);
        hasReassignedRef.current = false;
        toast.error("No driver accepted your ride. Please try again.");
      } else if (data.status === "cancelled" || data.status === "timeout") {
        setRideState("booking");
        setRideRequestId(null);
        setMatchedDriver(null);
        hasReassignedRef.current = false;
        toast.error("Ride was cancelled.");
      }
    };
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [rideRequestId, rideState]);

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

      <div className="grid lg:grid-cols-[1fr,400px] min-h-[calc(100vh-64px)]">
            {/* Map Area */}
            <div className="relative order-2 lg:order-1">
              <GoogleMap
                pickup={pickupCoords}
                destination={destinationCoords}
                driverLocation={
                  // Prefer real-time GPS from backend when available,
                  // otherwise fall back to simulated tracking for demo.
                  liveDriverLocation
                    ? { lat: liveDriverLocation.lat, lng: liveDriverLocation.lng }
                    : simulatedDriverLocation
                }
                nearbyDrivers={
                  rideState === "booking"
                    ? approvedDrivers.map((d) => ({
                        driverId: d.driverId,
                        latitude: d.latitude,
                        longitude: d.longitude,
                      }))
                    : undefined
                }
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

                    <div className="bg-secondary rounded-xl p-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Trip fare</span>
                        <span className="font-semibold">
                          {completedFareAmount != null ? `RWF ${completedFareAmount.toLocaleString()}` : fareEstimate ? formatFare(fareEstimate.discountedFare ?? fareEstimate.baseFare) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance</span>
                        <span className="font-semibold">{completedDistanceKm != null ? `${completedDistanceKm} km` : fareEstimate?.distance ?? "—"}</span>
                      </div>
                    </div>

                    {currentRideId && completedFareAmount != null && completedFareAmount > 0 && (
                      <div className="mb-4">
                        {paymentStatus?.paid ? (
                          <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 py-3 text-green-700 dark:text-green-400">
                            <CheckCircle className="h-5 w-5 shrink-0" />
                            <span className="font-medium">Paid</span>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="goride"
                            className="w-full"
                            disabled={isPaying}
                            onClick={async () => {
                              if (!currentRideId) return;
                              setIsPaying(true);
                              const { data, error } = await api.post<{ payment_url: string }>("/payments/initialize", { ride_history_id: currentRideId });
                              setIsPaying(false);
                              if (error || !data?.payment_url) {
                                toast.error(error?.message || "Could not start payment. Try again.");
                                return;
                              }
                              window.location.href = data.payment_url;
                            }}
                          >
                            {isPaying ? "Redirecting…" : (
                              <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay RWF {completedFareAmount.toLocaleString()} with Flutterwave
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground mb-3 text-center">Rate your driver</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setCompletedRating(star)}
                            className={cn(
                              "text-3xl transition-transform hover:scale-110",
                              completedRating !== null && star <= completedRating ? "text-accent" : "text-muted-foreground/40"
                            )}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="goride"
                      className="w-full"
                      disabled={isSubmittingRating}
                      onClick={async () => {
                        if (currentRideId && completedRating !== null) {
                          setIsSubmittingRating(true);
                          const { error } = await api.patch(`/ride-history/${currentRideId}`, { user_rating: completedRating });
                          if (!error) toast.success("Thanks for rating your driver!");
                          setIsSubmittingRating(false);
                        }
                        setRideState("booking");
                        setPickupCoords(null);
                        setDestinationCoords(null);
                        resetTracking();
                        setPickup("");
                        setDestination("");
                        setCurrentRideId(null);
                        setMatchedDriver(null);
                        setCompletedFareAmount(null);
                        setCompletedDistanceKm(null);
                        setCompletedRating(null);
                      }}
                    >
                      {isSubmittingRating ? "Saving…" : "Book Another Ride"}
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

                      {/* Payment Method (required to book) */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Payment method</h3>
                        {isLoadingPaymentMethods ? (
                          <div className="h-14 rounded-xl bg-secondary animate-pulse" />
                        ) : paymentMethods.length === 0 ? (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Add a payment method to book a ride</p>
                            <Link to="/payment-methods">
                              <Button variant="outline" size="sm" className="mt-2">Add payment method</Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {paymentMethods.map((pm) => (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => setSelectedPaymentMethodId(pm.id)}
                                className={cn(
                                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                                  selectedPaymentMethodId === pm.id
                                    ? "border-primary bg-goride-green-light"
                                    : "border-transparent bg-secondary hover:bg-secondary/80"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-goride-amber-light rounded-lg flex items-center justify-center">
                                    <span className="text-lg">{pm.type === "cash" ? "💵" : "💳"}</span>
                                  </div>
                                  <span className="font-medium capitalize">{pm.type.replace("_", " ")}</span>
                                  {pm.account_number_masked && (
                                    <span className="text-sm text-muted-foreground">{pm.account_number_masked}</span>
                                  )}
                                </div>
                                {selectedPaymentMethodId === pm.id && (
                                  <span className="text-primary text-sm font-medium">Selected</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Request Button */}
                      <Button
                        variant="hero"
                        size="xl"
                        className="w-full"
                        onClick={handleRequestRide}
                        disabled={!pickupCoords || !selectedPaymentMethodId || paymentMethods.length === 0 || isCreatingRide}
                      >
                        {isCreatingRide
                          ? "Finding driver..."
                          : scheduledDate
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
                    <Button variant="ghost" size="icon" onClick={async () => {
                      if (currentRideId) {
                        await api.patch(`/ride-history/${currentRideId}`, { status: "cancelled" });
                      }
                      setRideState("booking");
                      resetTracking();
                      setCurrentRideId(null);
                      setMatchedDriver(null);
                    }}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Driver Card (real data from DB) */}
                  <div className="bg-secondary rounded-2xl p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {matchedDriver?.avatarUrl ? (
                          <img src={matchedDriver.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{matchedDriver?.fullName ?? "Your driver"}</div>
                        <div className="text-sm text-muted-foreground">
                          {matchedDriver?.vehicleType ?? "Vehicle"} • {matchedDriver?.vehiclePlate ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-background rounded-xl mb-4">
                      <Car className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">
                          {([matchedDriver?.vehicleMake, matchedDriver?.vehicleModel, matchedDriver?.vehicleColor].filter(Boolean).join(" • ") || matchedDriver?.vehicleType) ?? "Vehicle"}
                        </div>
                        <div className="text-sm text-muted-foreground">{matchedDriver?.vehiclePlate ?? "—"}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {matchedDriver?.phone ? (
                        <Button variant="goride-outline" className="flex-1" asChild>
                          <a href={`tel:${matchedDriver.phone.replace(/\s/g, "")}`} rel="noopener noreferrer">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </a>
                        </Button>
                      ) : (
                        <Button variant="goride-outline" className="flex-1" disabled title="Driver phone not available">
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      )}
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
                      {fareEstimate ? formatFare(fareEstimate.discountedFare || fareEstimate.baseFare) : (completedFareAmount != null ? `RWF ${completedFareAmount.toLocaleString()}` : "—")}
                    </span>
                  </div>

                  {/* Driver Mini Card */}
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {matchedDriver?.avatarUrl ? (
                        <img src={matchedDriver.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{matchedDriver?.fullName ?? "Your driver"}</div>
                      <div className="text-sm text-muted-foreground">{matchedDriver?.vehicleType ?? "Vehicle"}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(true)} className="relative">
                      <MessageSquare className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                    {matchedDriver?.phone ? (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`tel:${matchedDriver.phone.replace(/\s/g, "")}`} rel="noopener noreferrer" aria-label="Call driver">
                          <Phone className="w-4 h-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" disabled aria-label="Call driver">
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Safety Features */}
                  <div className="flex gap-3">
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share trip
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a href="tel:112" rel="noopener noreferrer">
                        <Shield className="w-4 h-4 mr-2" />
                        SOS
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
        driverName={matchedDriver?.fullName ?? "Your driver"}
      />
    </>
  );
};

export default RidePage;
