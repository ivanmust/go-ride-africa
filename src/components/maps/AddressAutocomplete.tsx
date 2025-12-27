import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMapboxToken } from "@/hooks/useMapboxToken";

interface AddressResult {
  id: string;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
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

export const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Enter address",
  variant = "pickup",
  showCurrentLocation = false,
  onCurrentLocation,
  isLocating = false,
  className,
}: AddressAutocompleteProps) => {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { token } = useMapboxToken();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // Search for addresses using Mapbox Geocoding API
  const searchAddresses = async (query: string) => {
    if (!token || query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Center search around Kigali, Rwanda
      const proximity = "30.0619,-1.9441";
      const country = "rw"; // Rwanda
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${token}&` +
        `proximity=${proximity}&` +
        `country=${country}&` +
        `types=address,poi,place,locality,neighborhood&` +
        `limit=5`
      );

      if (!response.ok) throw new Error("Geocoding failed");

      const data = await response.json();
      
      const mappedResults: AddressResult[] = data.features.map((feature: any) => ({
        id: feature.id,
        placeName: feature.text,
        address: feature.place_name,
        lat: feature.center[1],
        lng: feature.center[0],
      }));

      setResults(mappedResults);
      setShowDropdown(mappedResults.length > 0);
    } catch (error) {
      console.error("Address search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
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
    onChange(result.address);
    onSelect(result);
    setShowDropdown(false);
    setResults([]);
  };

  const handleFocus = () => {
    setIsFocused(true);
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
          onBlur={() => setIsFocused(false)}
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
