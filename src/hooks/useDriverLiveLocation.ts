import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared";

interface DriverLocationResponse {
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export interface DriverLiveLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

const POLL_INTERVAL_MS = 4000;

export const useDriverLiveLocation = (driverId: string | null | undefined) => {
  const [location, setLocation] = useState<DriverLiveLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!driverId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await api.get<DriverLocationResponse>(`/user-locations/${encodeURIComponent(driverId)}`);
      if (error) throw new Error(error.message);
      if (!data) {
        setLocation(null);
        return;
      }
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.warn("Received invalid driver location coordinates", data);
        setLocation(null);
        return;
      }
      setLocation({
        lat,
        lng,
        updatedAt: data.updated_at,
      });
    } catch (e) {
      console.error("Failed to fetch driver live location:", e);
      setError(e instanceof Error ? e.message : "Failed to load driver location");
    } finally {
      setIsLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (!driverId) {
      setLocation(null);
      return;
    }
    fetchLocation();
    const interval = setInterval(fetchLocation, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [driverId, fetchLocation]);

  return { location, isLoading, error, refetch: fetchLocation };
};

