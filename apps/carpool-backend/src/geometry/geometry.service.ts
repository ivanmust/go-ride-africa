import { Injectable } from '@nestjs/common';

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6371000;

@Injectable()
export class GeometryService {
  haversineMeters(a: LatLng, b: LatLng): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h =
      sinDLat * sinDLat +
      Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  computeCumulativeDistances(points: LatLng[]): number[] {
    const cum: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      const d = this.haversineMeters(points[i - 1], points[i]);
      cum.push(cum[i - 1] + d);
    }
    return cum;
  }

  projectPointToPolyline(
    point: LatLng,
    points: LatLng[],
    cumMeters?: number[],
  ): { closestLatLng: LatLng; posMeters: number; distanceMeters: number } {
    if (points.length < 2) {
      const only = points[0] ?? point;
      return {
        closestLatLng: only,
        posMeters: 0,
        distanceMeters: this.haversineMeters(point, only),
      };
    }

    const cum = cumMeters ?? this.computeCumulativeDistances(points);
    let best: { closestLatLng: LatLng; posMeters: number; distanceMeters: number } | null =
      null;

    const toRad = (v: number) => (v * Math.PI) / 180;

    const pLat = toRad(point.lat);
    const pLng = toRad(point.lng);

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];

      const aLat = toRad(a.lat);
      const aLng = toRad(a.lng);
      const bLat = toRad(b.lat);
      const bLng = toRad(b.lng);

      const vx = bLat - aLat;
      const vy = bLng - aLng;
      const wx = pLat - aLat;
      const wy = pLng - aLng;

      const c1 = vx * wx + vy * wy;
      const c2 = vx * vx + vy * vy;
      let t = c2 > 0 ? c1 / c2 : 0;
      t = Math.max(0, Math.min(1, t));

      const projLat = a.lat + (b.lat - a.lat) * t;
      const projLng = a.lng + (b.lng - a.lng) * t;
      const proj: LatLng = { lat: projLat, lng: projLng };

      const distanceMeters = this.haversineMeters(point, proj);
      const segLength = this.haversineMeters(a, b);
      const posMeters = cum[i] + segLength * t;

      if (!best || distanceMeters < best.distanceMeters) {
        best = { closestLatLng: proj, posMeters, distanceMeters };
      }
    }

    return best!;
  }

  /**
   * Simple straight-line polyline between two points.
   * This avoids external OSRM dependency for now.
   */
  buildStraightLinePolyline(
    start: LatLng,
    end: LatLng,
    segments = 16,
  ): { points: LatLng[]; distanceMeters: number; durationSeconds: number } {
    const points: LatLng[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
      });
    }
    const distanceMeters = this.haversineMeters(start, end) * 1.3; // road factor
    const avgSpeedKmh = 30;
    const durationSeconds = (distanceMeters / 1000 / avgSpeedKmh) * 3600;
    return { points, distanceMeters, durationSeconds };
  }
}

