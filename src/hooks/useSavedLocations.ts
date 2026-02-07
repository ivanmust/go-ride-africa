import { useState, useEffect } from "react";
import { usePassengerAuth } from "@/apps/passenger/auth/PassengerAuthContext";
import { api } from "@/shared";
import { toast } from "sonner";

export interface SavedLocation {
  id: string;
  name: string;
  address: string;
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export const useSavedLocations = () => {
  const { user } = usePassengerAuth();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocations = async () => {
    if (!user) {
      setLocations([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await api.get<SavedLocation[]>("/saved-locations");
      if (error) throw new Error(error.message);
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching saved locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchLocations identity would cause extra runs
  }, [user]);

  const saveLocation = async (location: {
    name: string;
    address: string;
    label?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!user) {
      toast.error("Please sign in to save locations");
      return null;
    }

    try {
      const { data, error } = await api.post<SavedLocation>("/saved-locations", {
        name: location.name,
        address: location.address,
        label: location.label || null,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("No data");
      setLocations((prev) => [data, ...prev]);
      toast.success(`${location.name} saved successfully`);
      return data;
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
      return null;
    }
  };

  const updateLocation = async (id: string, updates: Partial<SavedLocation>) => {
    if (!user) return false;

    try {
      const { error } = await api.patch(`/saved-locations/${id}`, updates);
      if (error) throw new Error(error.message);
      setLocations((prev) =>
        prev.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc))
      );
      toast.success("Location updated");
      return true;
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
      return false;
    }
  };

  const deleteLocation = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await api.delete(`/saved-locations/${id}`);
      if (error) throw new Error(error.message);
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      toast.success("Location deleted");
      return true;
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
      return false;
    }
  };

  const getLocationIcon = (label: string | null) => {
    switch (label?.toLowerCase()) {
      case "home":
        return "🏠";
      case "work":
        return "🏢";
      case "gym":
        return "🏋️";
      case "school":
        return "🎓";
      default:
        return "📍";
    }
  };

  return {
    locations,
    isLoading,
    saveLocation,
    updateLocation,
    deleteLocation,
    getLocationIcon,
    refetch: fetchLocations,
  };
};
