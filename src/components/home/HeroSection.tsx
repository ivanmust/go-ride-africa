import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navigation, ArrowRight, Car, Bike, Truck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleMap } from "@/components/maps/GoogleMap";
import { GoogleAddressAutocomplete } from "@/components/maps/GoogleAddressAutocomplete";
import { GOOGLE_MAPS_API_KEY } from "@/components/maps/GoogleMapsProvider";
import { useFareEstimation } from "@/hooks/useFareEstimation";

const vehicleTypes = [
  { id: "economy", name: "Economy", icon: Car },
  { id: "comfort", name: "Comfort", icon: Car },
  { id: "bike", name: "Bike", icon: Bike },
  { id: "xl", name: "XL", icon: Truck },
];

// Route waypoints from pickup to destination for smooth animation
const routeWaypoints = [
  { lat: -1.9403, lng: 29.8739 },
  { lat: -1.9420, lng: 29.8900 },
  { lat: -1.9450, lng: 29.9100 },
  { lat: -1.9480, lng: 29.9300 },
  { lat: -1.9500, lng: 29.9500 },
  { lat: -1.9520, lng: 29.9800 },
  { lat: -1.9530, lng: 30.0100 },
  { lat: -1.9535, lng: 30.0350 },
  { lat: -1.9536, lng: 30.0606 },
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const [pickupInput, setPickupInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState("economy");
  const [driverPosition, setDriverPosition] = useState(0);
  const [isLocating, setIsLocating] = useState(false);

  // Animate driver along the route
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverPosition((prev) => (prev + 1) % routeWaypoints.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  const driverLocation = routeWaypoints[driverPosition];

  // Fare estimation
  const { fareEstimate, isLoading: isFareLoading, formatFare } = useFareEstimation(
    pickupCoords,
    destinationCoords,
    selectedVehicle
  );

  const handleCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setPickupCoords({ lat: latitude, lng: longitude });
          
          // Reverse geocode to get address using Google Geocoding API
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.results?.[0]) {
              setPickupInput(data.results[0].formatted_address);
            } else {
              setPickupInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } catch {
            setPickupInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleRequestRide = () => {
    if (pickupCoords && destinationCoords) {
      // Navigate to ride page with location data
      navigate("/ride", {
        state: {
          pickup: { ...pickupCoords, address: pickupInput },
          destination: { ...destinationCoords, address: destinationInput },
          vehicleType: selectedVehicle,
        },
      });
    }
  };

  const canRequestRide = pickupCoords && destinationCoords;

  return (
    <section className="relative min-h-screen pt-16 overflow-hidden gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="relative z-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-goride-green-light text-primary rounded-full text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now available in Kigali
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Go anywhere with{" "}
              <span className="text-primary relative">
                GoRide
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-accent/60"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 10C50 2 150 2 198 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Request a ride, hop in, and go. Your reliable ride is just a tap away. 
              Safe, affordable, and always on time.
            </p>

            {/* Booking Card */}
            <div className="bg-card rounded-2xl shadow-card p-6 border border-border">
              <div className="space-y-4">
                {/* Pickup Input with Autocomplete */}
                <GoogleAddressAutocomplete
                  value={pickupInput}
                  onChange={setPickupInput}
                  onSelect={(result) => {
                    setPickupCoords({ lat: result.lat, lng: result.lng });
                  }}
                  placeholder="Enter pickup location"
                  variant="pickup"
                  showCurrentLocation
                  onCurrentLocation={handleCurrentLocation}
                  isLocating={isLocating}
                />

                {/* Destination Input with Autocomplete */}
                <GoogleAddressAutocomplete
                  value={destinationInput}
                  onChange={setDestinationInput}
                  onSelect={(result) => {
                    setDestinationCoords({ lat: result.lat, lng: result.lng });
                  }}
                  placeholder="Where to?"
                  variant="destination"
                />

                {/* Fare Estimate Preview */}
                {fareEstimate && pickupCoords && destinationCoords && (
                  <div className="bg-secondary rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Navigation className="w-4 h-4" />
                      <span>{fareEstimate.distance} km</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>~{fareEstimate.duration} min</span>
                    </div>
                    <div className="font-semibold text-primary">
                      {formatFare(fareEstimate.baseFare)}
                    </div>
                  </div>
                )}

                {/* Vehicle Selection */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {vehicleTypes.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-xl transition-all",
                        selectedVehicle === vehicle.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-secondary hover:bg-secondary/80 text-foreground"
                      )}
                    >
                      <vehicle.icon className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">{vehicle.name}</span>
                    </button>
                  ))}
                </div>

                {/* CTA Button */}
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full group"
                  onClick={handleRequestRide}
                  disabled={!canRequestRide}
                >
                  Request GoRide
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-8">
              <div>
                <div className="text-2xl font-bold text-foreground">2M+</div>
                <div className="text-sm text-muted-foreground">Happy Riders</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Drivers</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold text-foreground">10+</div>
                <div className="text-sm text-muted-foreground">Cities</div>
              </div>
            </div>
          </div>

          {/* Right Content - Real Map */}
          <div className="relative hidden lg:block animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Real Google Map */}
              <div className="absolute inset-0 rounded-3xl shadow-2xl overflow-hidden border border-border">
                <GoogleMap
                  pickup={{ lat: -1.9403, lng: 29.8739 }}
                  destination={{ lat: -1.9536, lng: 30.0606 }}
                  driverLocation={driverLocation}
                  showRoute={true}
                  className="w-full h-full"
                />
              </div>

              {/* Floating cards */}
              <div className="absolute -right-6 top-1/4 bg-card rounded-xl shadow-card p-4 border border-border animate-float z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-goride-green-light rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Driver arriving</div>
                    <div className="text-xs text-muted-foreground">3 min away</div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-6 bottom-1/4 bg-card rounded-xl shadow-card p-4 border border-border animate-float z-10" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-goride-amber-light rounded-full flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">RWF 1,200</div>
                    <div className="text-xs text-muted-foreground">Estimated fare</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
