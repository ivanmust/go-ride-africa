import { useState, useCallback } from "react";
import { usePassengerAuth } from "@/apps/passenger/auth/PassengerAuthContext";
import { api } from "@/shared";

export interface MatchedDriver {
  driverId: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  vehicleType: string;
  vehiclePlate: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
}

export interface CreateRideParams {
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  vehicleType: string;
  paymentMethodId: string;
  fareAmount: number;
  currency: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  rideSharing?: boolean;
}

export interface CreateRideResult {
  rideId: string;
  rideRequestId: string;
  driver: MatchedDriver;
}

interface CreateRideRequestResultDriver {
  driver_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
}

interface CreateRideRequestResult {
  ride_request_id?: string;
  id?: string;
  driver?: CreateRideRequestResultDriver;
}

export const useCreateRide = () => {
  const { user } = usePassengerAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRide = useCallback(
    async (params: CreateRideParams): Promise<CreateRideResult | null> => {
      if (!user) {
        setError("You must be signed in to book a ride.");
        return null;
      }
      setError(null);
      setIsSubmitting(true);
      try {
        if (!params.pickupLat || !params.pickupLng || !params.dropoffLat || !params.dropoffLng) {
          throw new Error("Pickup and dropoff coordinates are required");
        }

        const { data, error } = await api.post<CreateRideRequestResult>("/ride-requests/create", {
          pickup_address: params.pickupAddress,
          dropoff_address: params.dropoffAddress,
          vehicle_type: params.vehicleType,
          payment_method_id: params.paymentMethodId,
          fare_amount: params.fareAmount,
          pickup_lat: params.pickupLat,
          pickup_lng: params.pickupLng,
          dropoff_lat: params.dropoffLat,
          dropoff_lng: params.dropoffLng,
          currency: params.currency,
          distance_km: params.distanceKm,
          duration_minutes: params.durationMinutes,
          ride_sharing: params.rideSharing ?? false,
        });

        if (error) {
          throw new Error(error.message);
        }

        // Result shape comes from create_ride_request; we now only
        // create a pending ride_request and defer ride_history creation
        // until the driver accepts.
        const rideRequestId: string =
          data?.ride_request_id ??
          data?.id ??
          "";

        if (!rideRequestId) {
          throw new Error("Ride creation failed");
        }

        const driverPayload = data?.driver;

        const driver: MatchedDriver = driverPayload
          ? {
              driverId: driverPayload.driver_id,
              fullName: driverPayload.full_name ?? "Your driver",
              avatarUrl: driverPayload.avatar_url,
              phone: driverPayload.phone ?? null,
              vehicleType: driverPayload.vehicle_type ?? params.vehicleType,
              vehiclePlate: driverPayload.vehicle_plate ?? "—",
              vehicleMake: driverPayload.vehicle_make,
              vehicleModel: driverPayload.vehicle_model,
              vehicleColor: driverPayload.vehicle_color,
            }
          : {
              driverId: "unknown",
              fullName: "Your driver",
              avatarUrl: null,
              phone: null,
              vehicleType: params.vehicleType,
              vehiclePlate: "—",
              vehicleMake: null,
              vehicleModel: null,
              vehicleColor: null,
            };

        return {
          rideId: "",
          rideRequestId,
          driver,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to book ride";
        setError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user]
  );

  return { createRide, isSubmitting, error };
};
