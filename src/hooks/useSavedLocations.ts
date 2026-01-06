import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocations = async () => {
    if (!user) {
      setLocations([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching saved locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
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
      const { data, error } = await supabase
        .from("saved_locations")
        .insert({
          user_id: user.id,
          name: location.name,
          address: location.address,
          label: location.label || null,
          latitude: location.latitude || null,
          longitude: location.longitude || null,
        })
        .select()
        .single();

      if (error) throw error;
      
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
      const { error } = await supabase
        .from("saved_locations")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

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
      const { error } = await supabase
        .from("saved_locations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

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
