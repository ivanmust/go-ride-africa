import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared";

export interface ScheduledRide {
  id: string;
  user_id: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  vehicle_type: string;
  scheduled_at: string;
  status: "scheduled" | "cancelled" | "completed";
  created_at: string;
}

export const useScheduledRides = () => {
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await api.get<ScheduledRide[]>("/scheduled-rides");
      if (error) throw new Error(error.message);
      setRides(data ?? []);
    } catch (e) {
      console.error("Failed to load scheduled rides:", e);
      setError(e instanceof Error ? e.message : "Failed to load scheduled rides");
      setRides([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const cancelRide = useCallback(
    async (rideId: string) => {
      try {
        const { error } = await api.patch(`/scheduled-rides/${rideId}/cancel`, {});
        if (error) throw new Error(error.message);
        await fetchRides();
        return true;
      } catch (e) {
        console.error("Failed to cancel scheduled ride:", e);
        return false;
      }
    },
    [fetchRides]
  );

  /** Convert scheduled ride to live ride request. Returns result with ride_request_id and driver, or null on error. */
  const startRide = useCallback(
    async (scheduledId: string, fareAmount: number, paymentMethodId?: string): Promise<{ rideRequestId: string; driver: unknown } | null> => {
      try {
        const body: { fare_amount: number; payment_method_id?: string } = { fare_amount: fareAmount };
        if (paymentMethodId) body.payment_method_id = paymentMethodId;
        const { data, error } = await api.post<{ ride_request_id?: string; id?: string; driver?: unknown }>(
          `/scheduled-rides/${scheduledId}/start-ride`,
          body
        );
        if (error) throw new Error(error.message);
        const rideRequestId = data?.ride_request_id ?? data?.id ?? "";
        if (!rideRequestId) throw new Error("Start ride failed");
        await fetchRides();
        return { rideRequestId, driver: data?.driver ?? null };
      } catch (e) {
        console.error("Failed to start scheduled ride:", e);
        return null;
      }
    },
    [fetchRides]
  );

  return { rides, isLoading, error, refetch: fetchRides, cancelRide, startRide };
};

