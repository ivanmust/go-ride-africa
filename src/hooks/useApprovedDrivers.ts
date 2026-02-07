import { useState, useEffect } from "react";
import { api } from "@/shared";

export interface ApprovedDriverLocation {
  driverId: string;
  fullName: string | null;
  avatarUrl: string | null;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export const useApprovedDrivers = (options?: { enabled?: boolean }) => {
  const enabled = options?.enabled !== false;
  const [drivers, setDrivers] = useState<ApprovedDriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDrivers([]);
      setIsLoading(false);
      return;
    }
    const fetchApprovedDrivers = async () => {
      setError(null);
      try {
        const { data: rows, error: apiErr } = await api.get<ApprovedDriverLocation[]>("/driver-availability/online-drivers");
        if (apiErr) throw new Error(apiErr.message);
        const normalized =
          (rows || [])
            .map((row) => {
              const lat = Number(row.latitude);
              const lng = Number(row.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                console.warn("Skipping driver with invalid coordinates", row);
                return null;
              }
              return { ...row, latitude: lat, longitude: lng };
            })
            .filter((d): d is ApprovedDriverLocation => d !== null);
        setDrivers(normalized);
      } catch (e) {
        console.error("Error fetching approved drivers:", e);
        setError(e instanceof Error ? e.message : "Failed to load drivers");
        setDrivers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApprovedDrivers();
  }, [enabled]);

  return { drivers, isLoading, error };
};
