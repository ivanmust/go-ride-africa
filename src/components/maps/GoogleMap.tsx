import { useCallback, useRef, useState, useEffect } from "react";
import { GoogleMap as GoogleMapComponent, DirectionsRenderer } from "@react-google-maps/api";

export interface NearbyDriverMarker {
  driverId: string;
  latitude: number;
  longitude: number;
}

interface GoogleMapProps {
  pickup?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  driverLocation?: { lat: number; lng: number } | null;
  /** Approved drivers to show on map (only authorized drivers) */
  nearbyDrivers?: NearbyDriverMarker[];
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

// Use Map ID from env so Advanced Markers are fully enabled
const MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || undefined;

const mapOptions: google.maps.MapOptions = {
  ...(MAP_ID && { mapId: MAP_ID }),
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

type AdvancedMarker = google.maps.marker.AdvancedMarkerElement;

export const GoogleMap = ({
  pickup,
  destination,
  driverLocation,
  nearbyDrivers = [],
  showRoute = false,
  className = "",
  onMapClick,
}: GoogleMapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const pickupMarkerRef = useRef<AdvancedMarker | null>(null);
  const destinationMarkerRef = useRef<AdvancedMarker | null>(null);
  const driverMarkerRef = useRef<AdvancedMarker | null>(null);
  const nearbyMarkersRef = useRef<Map<string, AdvancedMarker>>(new Map());

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    const clearMarker = (m: AdvancedMarker | null) => {
      if (!m) return;
      m.map = null;
    };
    clearMarker(pickupMarkerRef.current);
    pickupMarkerRef.current = null;
    clearMarker(destinationMarkerRef.current);
    destinationMarkerRef.current = null;
    clearMarker(driverMarkerRef.current);
    driverMarkerRef.current = null;
    nearbyMarkersRef.current.forEach(clearMarker);
    nearbyMarkersRef.current.clear();
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

  // Advanced markers (always use AdvancedMarkerElement; avoids google.maps.Marker deprecation)
  type MarkerOptions = { pin: google.maps.marker.PinElementOptions; label: { text: string; color: string } };
  const updateMarker = useCallback(
    (markerRef: React.MutableRefObject<AdvancedMarker | null>, position: { lat: number; lng: number } | null, options: MarkerOptions) => {
      if (!mapRef.current) return;

      if (!position) {
        const m = markerRef.current;
        if (m) {
          m.map = null;
          markerRef.current = null;
        }
        return;
      }

      const lat = Number(position.lat);
      const lng = Number(position.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.warn("Skipping marker with invalid position", position);
        return;
      }

      if (!google.maps?.marker?.AdvancedMarkerElement) {
        console.warn("AdvancedMarkerElement not available on google.maps.marker");
        return;
      }

      const markerLib = google.maps.marker;
      const pin = new markerLib.PinElement(options.pin);
      const adv = markerRef.current as AdvancedMarker | null;
      if (!adv) {
        markerRef.current = new markerLib.AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat, lng },
          content: pin,
        });
      } else {
        adv.position = { lat, lng };
        adv.content = pin;
        adv.map = mapRef.current;
      }
    },
    []
  );

  const pickupOpts: MarkerOptions = { pin: { background: "#22c55e", glyphColor: "#ffffff", borderColor: "#166534", scale: 1.2 }, label: { text: "P", color: "white" } };
  const destOpts: MarkerOptions = { pin: { background: "#f97316", glyphColor: "#ffffff", borderColor: "#ffffff", scale: 1.1 }, label: { text: "D", color: "white" } };
  const driverOpts: MarkerOptions = { pin: { glyphText: "🚗", glyphColor: "#ffffff", background: "#0f172a", borderColor: "#f0fdfa", scale: 1.2 }, label: { text: "C", color: "white" } };

  useEffect(() => {
    if (!mapRef.current) return;

    updateMarker(pickupMarkerRef, pickup ?? null, pickupOpts);
    updateMarker(destinationMarkerRef, destination ?? null, destOpts);
    updateMarker(driverMarkerRef, driverLocation ?? null, driverOpts);
  }, [pickup, destination, driverLocation, updateMarker]);

  useEffect(() => {
    if (!mapRef.current) return;

    const markers = nearbyMarkersRef.current;
    const activeIds = new Set<string>();

    if (!google.maps?.marker?.AdvancedMarkerElement) {
      console.warn("AdvancedMarkerElement not available on google.maps.marker");
      return;
    }

    const markerLib = google.maps.marker;
    nearbyDrivers.forEach((driver) => {
      if (typeof driver.latitude !== "number" || typeof driver.longitude !== "number") return;
      const driverPosition = { lat: driver.latitude, lng: driver.longitude };
      activeIds.add(driver.driverId);
      const pin = new markerLib.PinElement({ background: "#16a34a", glyphColor: "#ffffff", borderColor: "#14532d", scale: 0.9 });
      let marker = markers.get(driver.driverId) as AdvancedMarker | undefined;
      if (!marker) {
        marker = new markerLib.AdvancedMarkerElement({ map: mapRef.current!, position: driverPosition, content: pin });
        markers.set(driver.driverId, marker);
      } else {
        marker.position = driverPosition;
        marker.content = pin;
        marker.map = mapRef.current;
      }
    });

    markers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.map = null;
        markers.delete(id);
      }
    });
  }, [nearbyDrivers]);

  // Fit bounds when markers change
  useEffect(() => {
    if (!mapRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    const extendIfValid = (coords?: { lat: number; lng: number } | null) => {
      if (!coords) return;
      const lat = Number(coords.lat);
      const lng = Number(coords.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      bounds.extend({ lat, lng });
      hasMarkers = true;
    };

    const extendDriverIfValid = (driver: NearbyDriverMarker) => {
      const lat = Number(driver.latitude);
      const lng = Number(driver.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      bounds.extend({ lat, lng });
      hasMarkers = true;
    };

    extendIfValid(pickup ?? null);
    extendIfValid(destination ?? null);
    extendIfValid(driverLocation ?? null);

    nearbyDrivers.forEach(extendDriverIfValid);

    if (hasMarkers) {
      if (pickup && !destination && !driverLocation && nearbyDrivers.length === 0) {
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
  }, [pickup, destination, driverLocation, nearbyDrivers]);

  // Draw route between pickup and destination
  useEffect(() => {
    if (!pickup || !destination || !showRoute) {
      setDirections(null);
      return;
    }

    const pickupLat = Number(pickup.lat);
    const pickupLng = Number(pickup.lng);
    const destLat = Number(destination.lat);
    const destLng = Number(destination.lng);

    if (
      !Number.isFinite(pickupLat) ||
      !Number.isFinite(pickupLng) ||
      !Number.isFinite(destLat) ||
      !Number.isFinite(destLng)
    ) {
      console.warn("Skipping route due to invalid coordinates", { pickup, destination });
      setDirections(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: pickupLat, lng: pickupLng },
        destination: { lat: destLat, lng: destLng },
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
    <div className={`${className || 'relative'}`} style={{ minHeight: className?.includes('absolute') ? undefined : '400px' }}>
      <GoogleMapComponent
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleClick}
        options={mapOptions}
      >
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
