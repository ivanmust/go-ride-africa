import { useState, useEffect, useCallback, useRef } from "react";

interface DriverTrackingOptions {
  pickupCoords: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
  isActive: boolean;
  phase: "to_pickup" | "to_destination" | "idle";
}

interface DriverTrackingState {
  driverLocation: { lat: number; lng: number } | null;
  routePoints: { lat: number; lng: number }[];
  currentPointIndex: number;
  eta: number; // in minutes
  distanceRemaining: number; // in km
  isMoving: boolean;
}

const AVERAGE_SPEED_KMH = 30; // Average city driving speed
const UPDATE_INTERVAL_MS = 1500; // Update every 1.5 seconds

// Calculate distance between two points using Haversine formula
const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Generate intermediate points along a route for smoother animation
const generateRoutePoints = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numPoints: number = 20
): { lat: number; lng: number }[] => {
  const points: { lat: number; lng: number }[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    // Add some natural curve variation
    const latVariation = Math.sin(fraction * Math.PI) * 0.001 * (Math.random() - 0.5);
    const lngVariation = Math.sin(fraction * Math.PI) * 0.001 * (Math.random() - 0.5);
    
    points.push({
      lat: start.lat + (end.lat - start.lat) * fraction + latVariation,
      lng: start.lng + (end.lng - start.lng) * fraction + lngVariation,
    });
  }
  
  return points;
};

export const useDriverTracking = ({
  pickupCoords,
  destinationCoords,
  isActive,
  phase,
}: DriverTrackingOptions) => {
  const [state, setState] = useState<DriverTrackingState>({
    driverLocation: null,
    routePoints: [],
    currentPointIndex: 0,
    eta: 0,
    distanceRemaining: 0,
    isMoving: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(phase);
  
  // Update phase ref
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Initialize driver location and route when phase changes
  useEffect(() => {
    if (!isActive || phase === "idle") {
      setState((prev) => ({ ...prev, isMoving: false }));
      return;
    }

    let startPoint: { lat: number; lng: number } | null = null;
    let endPoint: { lat: number; lng: number } | null = null;

    if (phase === "to_pickup" && pickupCoords) {
      // Driver starts from a random nearby location
      startPoint = {
        lat: pickupCoords.lat + (Math.random() - 0.5) * 0.015,
        lng: pickupCoords.lng + (Math.random() - 0.5) * 0.015,
      };
      endPoint = pickupCoords;
    } else if (phase === "to_destination" && pickupCoords && destinationCoords) {
      startPoint = pickupCoords;
      endPoint = destinationCoords;
    }

    if (startPoint && endPoint) {
      const distance = calculateDistance(startPoint, endPoint);
      const numPoints = Math.max(15, Math.floor(distance * 10)); // More points for longer distances
      const routePoints = generateRoutePoints(startPoint, endPoint, numPoints);
      
      setState({
        driverLocation: startPoint,
        routePoints,
        currentPointIndex: 0,
        eta: Math.ceil((distance / AVERAGE_SPEED_KMH) * 60),
        distanceRemaining: distance,
        isMoving: true,
      });
    }
  }, [isActive, phase, pickupCoords, destinationCoords]);

  // Animate driver movement
  useEffect(() => {
    if (!state.isMoving || state.routePoints.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.currentPointIndex >= prev.routePoints.length - 1) {
          // Reached destination
          return {
            ...prev,
            driverLocation: prev.routePoints[prev.routePoints.length - 1],
            isMoving: false,
            eta: 0,
            distanceRemaining: 0,
          };
        }

        const nextIndex = prev.currentPointIndex + 1;
        const nextPoint = prev.routePoints[nextIndex];
        const endPoint = prev.routePoints[prev.routePoints.length - 1];
        const distanceRemaining = calculateDistance(nextPoint, endPoint);
        const eta = Math.max(1, Math.ceil((distanceRemaining / AVERAGE_SPEED_KMH) * 60));

        return {
          ...prev,
          driverLocation: nextPoint,
          currentPointIndex: nextIndex,
          eta,
          distanceRemaining,
        };
      });
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isMoving, state.routePoints.length]);

  const resetTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({
      driverLocation: null,
      routePoints: [],
      currentPointIndex: 0,
      eta: 0,
      distanceRemaining: 0,
      isMoving: false,
    });
  }, []);

  const hasArrived = state.routePoints.length > 0 && 
    state.currentPointIndex >= state.routePoints.length - 1 &&
    !state.isMoving;

  return {
    driverLocation: state.driverLocation,
    eta: state.eta,
    distanceRemaining: Math.round(state.distanceRemaining * 10) / 10,
    isMoving: state.isMoving,
    hasArrived,
    progress: state.routePoints.length > 0 
      ? (state.currentPointIndex / (state.routePoints.length - 1)) * 100 
      : 0,
    resetTracking,
  };
};
