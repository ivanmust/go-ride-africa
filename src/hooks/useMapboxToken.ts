import { useState, useEffect } from "react";
import { api } from "@/shared";

export const useMapboxToken = () => {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, err } = await api.get<{ token: string }>("/mapbox/token");
        if (err) throw new Error(err.message);
        if (data?.token) setTokenState(data.token);
        else setError("No token returned");
      } catch (err) {
        console.error("Error fetching Mapbox token:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch token");
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  return { token, loading, error };
};
