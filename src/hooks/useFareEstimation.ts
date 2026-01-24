import { useState, useEffect } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/components/maps/GoogleMapsProvider";

interface Coordinates {
  lat: number;
  lng: number;
}

interface FareEstimate {
  distance: number; // in km
  duration: number; // in minutes
  baseFare: number;
  discountedFare?: number;
  currency: string;
}

interface VehiclePricing {
  basePrice: number; // RWF per km
  minFare: number;
  perMinute: number;
}

const vehiclePricing: Record<string, VehiclePricing> = {
  economy: { basePrice: 300, minFare: 800, perMinute: 30 },
  comfort: { basePrice: 450, minFare: 1200, perMinute: 45 },
  bike: { basePrice: 150, minFare: 400, perMinute: 15 },
  xl: { basePrice: 600, minFare: 1800, perMinute: 60 },
};

export const useFareEstimation = (
  pickup: Coordinates | null,
  destination: Coordinates | null,
  vehicleType: string = "economy",
  rideSharing: boolean = false
) => {
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pickup || !destination) {
      setFareEstimate(null);
      return;
    }

    const calculateFare = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use Distance Matrix API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickup.lat},${pickup.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}`
        );

        // Note: Direct API calls from browser will be blocked by CORS
        // We'll use the geometry library for distance calculation instead
        if (!window.google?.maps?.geometry) {
          throw new Error("Google Maps geometry library not loaded");
        }

        const pickupLatLng = new google.maps.LatLng(pickup.lat, pickup.lng);
        const destLatLng = new google.maps.LatLng(destination.lat, destination.lng);
        
        // Calculate straight-line distance and multiply by 1.3 for road factor
        const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(
          pickupLatLng,
          destLatLng
        );
        const distanceKm = (distanceMeters / 1000) * 1.3; // Road factor adjustment
        
        // Estimate duration based on average speed of 25 km/h in city
        const durationMinutes = Math.ceil((distanceKm / 25) * 60);

        const pricing = vehiclePricing[vehicleType] || vehiclePricing.economy;
        
        // Calculate fare: base + distance + time
        let calculatedFare = Math.max(
          pricing.minFare,
          Math.round((distanceKm * pricing.basePrice) + (durationMinutes * pricing.perMinute))
        );

        // Round to nearest 100
        calculatedFare = Math.round(calculatedFare / 100) * 100;

        const estimate: FareEstimate = {
          distance: Math.round(distanceKm * 10) / 10,
          duration: durationMinutes,
          baseFare: calculatedFare,
          currency: "RWF",
        };

        // Apply 30% discount for ride sharing
        if (rideSharing) {
          estimate.discountedFare = Math.round(calculatedFare * 0.7 / 100) * 100;
        }

        setFareEstimate(estimate);
      } catch (err) {
        console.error("Fare estimation error:", err);
        setError("Unable to estimate fare");
        
        // Fallback calculation using simple distance
        const pricing = vehiclePricing[vehicleType] || vehiclePricing.economy;
        const fallbackFare = pricing.minFare;
        
        setFareEstimate({
          distance: 0,
          duration: 0,
          baseFare: fallbackFare,
          discountedFare: rideSharing ? Math.round(fallbackFare * 0.7) : undefined,
          currency: "RWF",
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculateFare();
  }, [pickup, destination, vehicleType, rideSharing]);

  const formatFare = (amount: number) => {
    return `RWF ${amount.toLocaleString()}`;
  };

  return {
    fareEstimate,
    isLoading,
    error,
    formatFare,
  };
};
