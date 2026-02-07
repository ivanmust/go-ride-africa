import { useState, useEffect, useCallback, useRef } from "react";
import { useDriverAuth } from "@/apps/driver/auth/DriverAuthContext";
import { api } from "@/shared";

const DEFAULT_CENTER = { lat: -1.9441, lng: 30.0619 }; // Kigali

export const useDriverOnline = () => {
  const { user, session } = useDriverAuth();
  const [isOnline, setIsOnlineState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const isAuthenticated = Boolean(user && session);

  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!isAuthenticated || !user) return;
      const { error: locError } = await api.put("/user-locations/me", { latitude: lat, longitude: lng });
      if (locError) {
        console.error("Failed to update driver location:", locError);
      } else {
        setDriverLocation({ lat, lng });
      }
    },
    [user, isAuthenticated]
  );

  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation || !isAuthenticated || !user) return;
    // Clear any existing watcher
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // On error, fall back to Kigali center once
        updateLocation(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    watchIdRef.current = id;
  }, [isAuthenticated, updateLocation, user]);

  const stopLocationWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const setOnline = useCallback(
    async (online: boolean) => {
      if (!isAuthenticated || !user) return;
      setError(null);
      setIsToggling(true);
      try {
        const { error: availError } = await api.put("/driver-availability/me", { is_online: online });
        if (availError) throw new Error(availError.message);
        setIsOnlineState(online);
        if (online) {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
              () => updateLocation(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
              { enableHighAccuracy: true }
            );
            startLocationWatch();
          } else {
            await updateLocation(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
          }
        } else {
          stopLocationWatch();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update availability");
      } finally {
        setIsToggling(false);
      }
    },
    [user, isAuthenticated, updateLocation, startLocationWatch, stopLocationWatch]
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      const { data } = await api.get<{ is_online: boolean }>("/driver-availability/me");
      if (data) {
        setIsOnlineState(!!data.is_online);
      }
      setIsLoading(false);
      // If backend says the driver is already online, start watching location
      if (data?.is_online) {
        startLocationWatch();
      }
    };
    load();

    return () => {
      stopLocationWatch();
    };
  }, [user?.id, isAuthenticated, startLocationWatch, stopLocationWatch]);

  return { isOnline, setOnline, isLoading, isToggling, error, driverLocation, updateLocation };
};

