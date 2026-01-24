import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressResult {
  id: string;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  variant?: "pickup" | "destination";
  showCurrentLocation?: boolean;
  onCurrentLocation?: () => void;
  isLocating?: boolean;
  className?: string;
}

export const GoogleAddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Enter address",
  variant = "pickup",
  showCurrentLocation = false,
  onCurrentLocation,
  isLocating = false,
  className,
}: GoogleAddressAutocompleteProps) => {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services
  useEffect(() => {
    if (typeof google !== "undefined" && google.maps && google.maps.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required by the API)
      const dummyDiv = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddresses = useCallback(async (query: string) => {
    if (!autocompleteService.current || query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Kigali, Rwanda coordinates for biasing
      const kigaliLocation = new google.maps.LatLng(-1.9441, 30.0619);

      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          location: kigaliLocation,
          radius: 50000, // 50km radius around Kigali
          componentRestrictions: { country: "rw" },
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const mappedResults: AddressResult[] = predictions.map((prediction) => ({
              id: prediction.place_id,
              placeName: prediction.structured_formatting.main_text,
              address: prediction.description,
              lat: 0, // Will be fetched when selected
              lng: 0,
            }));
            setResults(mappedResults);
            setShowDropdown(mappedResults.length > 0);
          } else {
            setResults([]);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Address search error:", error);
      setResults([]);
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const handleSelect = (result: AddressResult) => {
    if (!placesService.current) return;

    // Get place details to retrieve coordinates
    placesService.current.getDetails(
      {
        placeId: result.id,
        fields: ["geometry"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const fullResult: AddressResult = {
            ...result,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          onChange(result.address);
          onSelect(fullResult);
          setShowDropdown(false);
          setResults([]);
        }
      }
    );
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <div
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3",
            variant === "pickup" ? "bg-primary rounded-full" : "bg-accent rounded-sm"
          )}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          className={cn(
            "w-full pl-10 py-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
            showCurrentLocation ? "pr-12" : "pr-4"
          )}
        />
        {isLoading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}
        {showCurrentLocation && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-background rounded-lg transition-colors"
            onClick={onCurrentLocation}
            disabled={isLocating}
          >
            <Crosshair className={cn("w-5 h-5 text-primary", isLocating && "animate-pulse")} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full flex items-start gap-3 p-3 hover:bg-secondary transition-colors text-left"
            >
              <div className="mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{result.placeName}</div>
                <div className="text-sm text-muted-foreground truncate">{result.address}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && !isLoading && results.length === 0 && value.length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 p-4 text-center animate-fade-in">
          <p className="text-muted-foreground text-sm">No addresses found</p>
        </div>
      )}
    </div>
  );
};
