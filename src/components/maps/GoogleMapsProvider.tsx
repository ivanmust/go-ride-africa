import { LoadScript } from "@react-google-maps/api";
import { ReactNode } from "react";

const GOOGLE_MAPS_API_KEY = "AIzaSyDYv8vuhD6Yvs_jKpeSFVaxj8XsWFAaaLY";

const libraries: ("places" | "geometry" | "drawing")[] = ["places", "geometry"];

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  return (
    <LoadScript 
      googleMapsApiKey={GOOGLE_MAPS_API_KEY} 
      libraries={libraries}
      loadingElement={
        <div className="flex items-center justify-center h-full bg-secondary">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading maps...</p>
          </div>
        </div>
      }
    >
      {children}
    </LoadScript>
  );
};

export { GOOGLE_MAPS_API_KEY };
