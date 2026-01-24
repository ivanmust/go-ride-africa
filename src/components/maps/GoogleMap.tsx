import { useCallback, useRef, useState, useEffect } from "react";
import { GoogleMap as GoogleMapComponent, Marker, DirectionsRenderer } from "@react-google-maps/api";

interface GoogleMapProps {
  pickup?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  driverLocation?: { lat: number; lng: number } | null;
  showRoute?: boolean;
  className?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Default center: Kigali, Rwanda
const defaultCenter = {
  lat: -1.9441,
  lng: 30.0619,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

export const GoogleMap = ({
  pickup,
  destination,
  driverLocation,
  showRoute = false,
  className = "",
  onMapClick,
}: GoogleMapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onMapClick && e.latLng) {
        onMapClick({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
      }
    },
    [onMapClick]
  );

  // Fit bounds when markers change
  useEffect(() => {
    if (!mapRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    if (pickup) {
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      hasMarkers = true;
    }

    if (destination) {
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      hasMarkers = true;
    }

    if (driverLocation) {
      bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
      hasMarkers = true;
    }

    if (hasMarkers) {
      if (pickup && !destination && !driverLocation) {
        // Only pickup - center and zoom
        mapRef.current.setCenter({ lat: pickup.lat, lng: pickup.lng });
        mapRef.current.setZoom(15);
      } else {
        // Multiple markers - fit bounds
        mapRef.current.fitBounds(bounds, {
          top: 100,
          bottom: 100,
          left: 50,
          right: 50,
        });
      }
    }
  }, [pickup, destination, driverLocation]);

  // Draw route between pickup and destination
  useEffect(() => {
    if (!pickup || !destination || !showRoute) {
      setDirections(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          console.error("Directions request failed:", status);
          setDirections(null);
        }
      }
    );
  }, [pickup, destination, showRoute]);

  return (
    <div className={`relative ${className}`}>
      <GoogleMapComponent
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleClick}
        options={mapOptions}
      >
        {/* Pickup Marker */}
        {pickup && (
          <Marker
            position={{ lat: pickup.lat, lng: pickup.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#22c55e",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
            title="Pickup Location"
          />
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            position={{ lat: destination.lat, lng: destination.lng }}
            icon={{
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 8,
              fillColor: "#f59e0b",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              rotation: 180,
            }}
            title="Destination"
          />
        )}

        {/* Driver Marker */}
        {driverLocation && (
          <Marker
            position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
            icon={{
              url: "data:image/svg+xml," + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                  <rect x="5" y="5" width="30" height="30" rx="8" fill="#1a1a1a" stroke="white" stroke-width="2"/>
                  <path d="M14 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm12 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-12-8l1.5-4.5h9L26 16H14z" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20),
            }}
            title="Driver"
          />
        )}

        {/* Route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#22c55e",
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
      </GoogleMapComponent>
    </div>
  );
};
