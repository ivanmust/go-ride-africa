import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Loader2 } from "lucide-react";

interface MapboxMapProps {
  pickup?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  driverLocation?: { lat: number; lng: number } | null;
  showRoute?: boolean;
  className?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export const MapboxMap = ({
  pickup,
  destination,
  driverLocation,
  showRoute = false,
  className = "",
  onMapClick,
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const pickupMarker = useRef<mapboxgl.Marker | null>(null);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { token, loading, error } = useMapboxToken();

  // Default center: Kigali, Rwanda
  const defaultCenter: [number, number] = [30.0619, -1.9441];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: defaultCenter,
      zoom: 13,
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    // Handle map clicks
    if (onMapClick) {
      map.current.on("click", (e) => {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token, onMapClick]);

  // Update pickup marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (pickupMarker.current) {
      pickupMarker.current.remove();
      pickupMarker.current = null;
    }

    if (pickup) {
      const el = document.createElement("div");
      el.className = "pickup-marker";
      el.innerHTML = `
        <div class="relative">
          <div class="absolute -inset-3 bg-green-500/30 rounded-full animate-ping"></div>
          <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4"/>
            </svg>
          </div>
        </div>
      `;

      pickupMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([pickup.lng, pickup.lat])
        .addTo(map.current);

      map.current.flyTo({
        center: [pickup.lng, pickup.lat],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [pickup, mapLoaded]);

  // Update destination marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }

    if (destination) {
      const el = document.createElement("div");
      el.className = "destination-marker";
      el.innerHTML = `
        <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4 12h3v8h10v-8h3L12 2z"/>
          </svg>
        </div>
      `;

      destinationMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map.current);
    }

    // Fit bounds if both markers exist
    if (pickup && destination && map.current) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend([pickup.lng, pickup.lat])
        .extend([destination.lng, destination.lat]);

      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 50, right: 50 },
        duration: 1000,
      });
    }
  }, [destination, pickup, mapLoaded]);

  // Update driver marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (driverMarker.current) {
      driverMarker.current.remove();
      driverMarker.current = null;
    }

    if (driverLocation) {
      const el = document.createElement("div");
      el.className = "driver-marker";
      el.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-xl border-2 border-white transform -rotate-45">
            <svg class="w-5 h-5 text-white transform rotate-45" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(map.current);
    }
  }, [driverLocation, mapLoaded]);

  // Draw route between pickup and destination
  useEffect(() => {
    if (!map.current || !mapLoaded || !pickup || !destination || !showRoute || !token) return;

    const drawRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${token}`
        );
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const route = data.routes[0].geometry;

          // Remove existing route layer
          if (map.current?.getSource("route")) {
            map.current.removeLayer("route");
            map.current.removeSource("route");
          }

          // Add new route
          map.current?.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: route,
            },
          });

          map.current?.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#22c55e",
              "line-width": 5,
              "line-opacity": 0.75,
            },
          });
        }
      } catch (err) {
        console.error("Error fetching route:", err);
      }
    };

    drawRoute();
  }, [pickup, destination, showRoute, mapLoaded, token]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-secondary ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-secondary ${className}`}>
        <div className="text-center p-4">
          <p className="text-destructive mb-2">Failed to load map</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
