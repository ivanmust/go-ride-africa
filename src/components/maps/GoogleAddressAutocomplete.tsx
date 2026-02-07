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

type AutocompleteResult = {
  id: string;
  placeName: string;
  address: string;
  suggestion: google.maps.places.AutocompleteSuggestion;
};

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
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const placesLibraryRef = useRef<google.maps.PlacesLibrary | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const latestRequestRef = useRef<number>(0);

  const createSessionToken = useCallback(() => {
    if (placesLibraryRef.current) {
      sessionTokenRef.current = new placesLibraryRef.current.AutocompleteSessionToken();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializePlacesLibrary = async () => {
      if (typeof google === "undefined" || !google.maps?.importLibrary) {
        return;
      }

      try {
        const placesLibrary = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
        if (!isMounted) return;

        placesLibraryRef.current = placesLibrary;
        createSessionToken();
      } catch (error) {
        console.error("Failed to load Google Places library:", error);
      }
    };

    initializePlacesLibrary();

    return () => {
      isMounted = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [createSessionToken]);

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

  const searchAddresses = useCallback(
    async (query: string) => {
      if (!placesLibraryRef.current || query.trim().length < 3) {
        setResults([]);
        setShowDropdown(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const requestId = Date.now();
      latestRequestRef.current = requestId;

      const kigaliOrigin: google.maps.LatLngLiteral = { lat: -1.9441, lng: 30.0619 };
      const kigaliRestriction: google.maps.places.LocationRestriction = {
        south: -2.2,
        west: 29.9,
        north: -1.7,
        east: 30.35,
      };

      try {
        if (!sessionTokenRef.current) {
          createSessionToken();
        }

        const { AutocompleteSuggestion } = placesLibraryRef.current;
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          origin: kigaliOrigin,
          includedRegionCodes: ["RW"],
          locationRestriction: kigaliRestriction,
          region: "rw",
          sessionToken: sessionTokenRef.current ?? undefined,
        });

        if (latestRequestRef.current !== requestId) {
          return;
        }

        const mappedResults: AutocompleteResult[] = response.suggestions
          .filter((suggestion) => suggestion.placePrediction?.placeId)
          .map((suggestion) => {
            const prediction = suggestion.placePrediction!;
            const mainText = prediction.mainText?.text ?? prediction.text?.text ?? "";
            const secondaryText = prediction.secondaryText?.text ?? "";
            const composedAddress =
              prediction.text?.text ??
              (secondaryText ? `${mainText}, ${secondaryText}` : mainText);

            return {
              id: prediction.placeId!,
              placeName: mainText || composedAddress,
              address: composedAddress,
              suggestion,
            };
          });

        setResults(mappedResults);
        setShowDropdown(mappedResults.length > 0);
      } catch (error) {
        console.error("Address search error:", error);
        if (latestRequestRef.current === requestId) {
          setResults([]);
          setShowDropdown(false);
        }
      } finally {
        if (latestRequestRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [createSessionToken]
  );

  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const handleSelect = useCallback(
    async (result: AutocompleteResult) => {
      const prediction = result.suggestion.placePrediction;
      if (!prediction) return;

      try {
        setIsLoading(true);

        const place = prediction.toPlace();
        const { place: placeDetails } = await place.fetchFields({
          fields: ["id", "displayName", "formattedAddress", "location"],
        });

        const location = placeDetails.location;
        if (!location) {
          console.warn("No location returned for place prediction", prediction.placeId);
          return;
        }

        const finalResult: AddressResult = {
          id: placeDetails.id ?? result.id,
          placeName: placeDetails.displayName ?? result.placeName,
          address: placeDetails.formattedAddress ?? result.address,
          lat: location.lat(),
          lng: location.lng(),
        };

        onChange(finalResult.address);
        onSelect(finalResult);
        setShowDropdown(false);
        setResults([]);
        createSessionToken();
      } catch (error) {
        console.error("Failed to fetch place details:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [createSessionToken, onChange, onSelect]
  );

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
              onClick={() => void handleSelect(result)}
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
