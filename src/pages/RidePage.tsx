import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

type RideState = "booking" | "searching" | "matched" | "arriving" | "riding" | "completed";

const vehicleTypes = [
  { id: "economy", name: "Economy", icon: Car, price: "RWF 800", time: "3 min", description: "Affordable everyday rides" },
  { id: "comfort", name: "Comfort", icon: Car, price: "RWF 1,200", time: "5 min", description: "Newer cars, top drivers" },
  { id: "bike", name: "Bike", icon: Bike, price: "RWF 400", time: "2 min", description: "Quick trips, beat traffic" },
  { id: "xl", name: "XL", icon: Truck, price: "RWF 1,800", time: "7 min", description: "Extra space for groups" },
];

const recentLocations = [
  { name: "Home", address: "KG 123 St, Kigali", icon: "🏠" },
  { name: "Office", address: "KN 5 Ave, Downtown", icon: "🏢" },
  { name: "Kigali Convention Centre", address: "KN 2 Ave", icon: "📍" },
];

export const RidePage = () => {
  const [rideState, setRideState] = useState<RideState>("booking");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("economy");

  const handleRequestRide = () => {
    setRideState("searching");
    setTimeout(() => setRideState("matched"), 2000);
  };

  const simulateRideProgress = () => {
    setRideState("arriving");
    setTimeout(() => setRideState("riding"), 3000);
    setTimeout(() => setRideState("completed"), 8000);
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
            <div className="relative bg-gradient-to-br from-goride-green-light via-secondary to-goride-amber-light order-2 lg:order-1">
              {/* Simulated Map */}
              <div className="absolute inset-0">
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(20)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute w-full h-px bg-foreground" style={{ top: `${i * 5}%` }} />
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute h-full w-px bg-foreground" style={{ left: `${i * 5}%` }} />
                  ))}
                </div>

                {/* Roads */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M10 50 Q50 20 90 50" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" strokeDasharray="2 1" />
                  <path d="M30 10 Q50 50 30 90" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" strokeDasharray="2 1" />
                  <path d="M70 20 Q60 50 70 80" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" strokeDasharray="2 1" />
                </svg>

                {/* Pickup Marker */}
                {pickup && (
                  <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-primary/20 rounded-full pulse-ring" />
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <MapPin className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card px-3 py-1 rounded-lg shadow-md text-sm font-medium">
                        Pickup
                      </div>
                    </div>
                  </div>
                )}

                {/* Destination Marker */}
                {destination && (
                  <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/2 translate-y-1/2 z-10">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-lg">
                      <Navigation className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card px-3 py-1 rounded-lg shadow-md text-sm font-medium">
                      Destination
                    </div>
                  </div>
                )}

                {/* Driver Car (when matched) */}
                {(rideState === "matched" || rideState === "arriving") && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-car-move z-20">
                    <div className="bg-foreground text-background w-12 h-12 rounded-xl flex items-center justify-center shadow-xl">
                      <Car className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </div>

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

                    <Button variant="goride" className="w-full" onClick={() => setRideState("booking")}>
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
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full" />
                      <input
                        type="text"
                        placeholder="Enter pickup location"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="w-full pl-10 pr-12 py-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-background rounded-lg transition-colors">
                        <Navigation className="w-5 h-5 text-primary" />
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-sm" />
                      <input
                        type="text"
                        placeholder="Where to?"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Recent Locations */}
                  {!destination && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent</h3>
                      <div className="space-y-2">
                        {recentLocations.map((location) => (
                          <button
                            key={location.name}
                            onClick={() => setDestination(location.address)}
                            className="w-full flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-left"
                          >
                            <span className="text-xl">{location.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{location.name}</div>
                              <div className="text-sm text-muted-foreground">{location.address}</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle Selection */}
                  {destination && (
                    <>
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
                                <div className="font-semibold text-foreground">{vehicle.price}</div>
                                <div className="text-sm text-muted-foreground">{vehicle.time}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

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
                      >
                        Request {vehicleTypes.find(v => v.id === selectedVehicle)?.name}
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
                        {rideState === "matched" ? "3 min away" : "Almost there"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setRideState("booking")}>
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
                      <Button variant="goride-outline" className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
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

                  <Button variant="goride" className="w-full" onClick={simulateRideProgress}>
                    Simulate Ride Progress
                  </Button>
                </div>
              )}

              {/* Riding State */}
              {rideState === "riding" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">On your way!</h2>
                    <p className="text-muted-foreground">Arriving in 8 minutes</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full w-1/3 rounded-full animate-pulse" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">4.2 km remaining</span>
                    <span className="font-medium text-foreground">RWF 1,200</span>
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
                    <Button variant="ghost" size="icon-sm">
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
    </>
  );
};

export default RidePage;
