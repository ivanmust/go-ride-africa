import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared";

export interface IncomingRideRequest {
  id: string;
  user_id: string;
  driver_id: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  vehicle_type: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "timeout";
  created_at: string;
}

const POLL_INTERVAL_MS = 3000;

export const useIncomingRideRequests = () => {
  const [requests, setRequests] = useState<IncomingRideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncoming = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await api.get<IncomingRideRequest[]>("/ride-requests/driver/incoming");
      if (error) throw new Error(error.message);
      setRequests(data ?? []);
    } catch (e) {
      console.error("Failed to load incoming ride requests:", e);
      setError(e instanceof Error ? e.message : "Failed to load incoming ride requests");
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncoming();
    const interval = setInterval(fetchIncoming, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchIncoming]);

  return { requests, isLoading, error, refetch: fetchIncoming };
};

