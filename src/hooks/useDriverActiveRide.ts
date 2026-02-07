import { useState, useEffect, useCallback } from "react";
import { useDriverAuth } from "@/apps/driver/auth/DriverAuthContext";
import { api } from "@/shared";

export interface DriverActiveRide {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  fareAmount: number;
  distanceKm: number | null;
  passengerName: string | null;
  passengerPhone: string | null;
  passengerId: string;
}

const POLL_ACTIVE_RIDE_MS = 4000;

type RideHistoryRow = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  fare_amount: number;
  distance_km: number | null;
  user_id: string;
  driver_id?: string;
  status?: string;
};

export const useDriverActiveRide = () => {
  const { user } = useDriverAuth();
  const [ride, setRide] = useState<DriverActiveRide | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveRide = useCallback(async () => {
    if (!user) return;

    const { data: list, error } = await api.get<RideHistoryRow[]>("/ride-history");
    if (error || !list) {
      setRide(null);
      setIsLoading(false);
      return;
    }
    const inProgress = list.filter((r) => r.driver_id === user.id && r.status === "in_progress");
    const data = inProgress[0];
    if (!data) {
      setRide(null);
      setIsLoading(false);
      return;
    }
    const passengerId = data.user_id;
    let passengerName: string | null = null;
    let passengerPhone: string | null = null;
    const { data: profile } = await api.get<{ full_name: string | null; phone: string | null }>(`/profiles/${passengerId}`);
    if (profile?.full_name) passengerName = profile.full_name;
    if (profile?.phone) passengerPhone = profile.phone;

    setRide({
      id: data.id,
      pickupAddress: data.pickup_address,
      dropoffAddress: data.dropoff_address,
      pickupLat: data.pickup_lat ?? null,
      pickupLng: data.pickup_lng ?? null,
      dropoffLat: data.dropoff_lat ?? null,
      dropoffLng: data.dropoff_lng ?? null,
      fareAmount: Number(data.fare_amount),
      distanceKm: data.distance_km != null ? Number(data.distance_km) : null,
      passengerName,
      passengerPhone,
      passengerId,
    });
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRide(null);
      setIsLoading(false);
      return;
    }
    fetchActiveRide();
    const interval = setInterval(fetchActiveRide, POLL_ACTIVE_RIDE_MS);
    return () => clearInterval(interval);
  }, [user?.id, fetchActiveRide]);

  const completeRide = async () => {
    if (!ride) return;
    const { error } = await api.patch(`/ride-history/${ride.id}`, { status: "completed", completed_at: new Date().toISOString() });
    if (error) console.error("Failed to complete ride:", error);
    else setRide(null);
  };

  const cancelRide = async () => {
    if (!ride) return;
    const { error } = await api.patch(`/ride-history/${ride.id}`, { status: "cancelled" });
    if (error) console.error("Failed to cancel ride:", error);
    else setRide(null);
  };

  return { ride, isLoading, refetch: fetchActiveRide, completeRide, cancelRide };
};
