import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryService } from '../geometry/geometry.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { DriverRouteEstimateDto } from './dto/driver-route-estimate.dto';
import { RiderRouteSearchDto } from './dto/rider-route-search.dto';
import { RouteOfferStatus } from '@prisma/client';

const STATION_TOLERANCE_METERS = 300;

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geometry: GeometryService,
  ) {}

  async estimateRoute(dto: DriverRouteEstimateDto) {
    const start = await this.prisma.station.findUnique({
      where: { id: String(dto.startStationId) },
    });
    const end = await this.prisma.station.findUnique({
      where: { id: String(dto.endStationId) },
    });
    if (!start || !end) {
      throw new NotFoundException('Station not found');
    }

    const { points, distanceMeters, durationSeconds } =
      this.geometry.buildStraightLinePolyline(
        { lat: start.lat, lng: start.lng },
        { lat: end.lat, lng: end.lng },
      );

    return {
      distanceMeters,
      durationSeconds,
      polylinePoints: points,
    };
  }

  async createRoute(driverId: string, dto: CreateRouteDto) {
    const start = await this.prisma.station.findUnique({
      where: { id: String(dto.startStationId) },
    });
    const end = await this.prisma.station.findUnique({
      where: { id: String(dto.endStationId) },
    });
    if (!start || !end) {
      throw new NotFoundException('Station not found');
    }

    const { points, distanceMeters, durationSeconds } =
      this.geometry.buildStraightLinePolyline(
        { lat: start.lat, lng: start.lng },
        { lat: end.lat, lng: end.lng },
      );

    const route = await this.prisma.routeOffer.create({
      data: {
        driverId,
        startStationId: start.id,
        endStationId: end.id,
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        polyline: JSON.stringify(points),
        polylineSimplified: points as any,
        departureTime: new Date(dto.departureTime),
        flexMinutes: dto.flexMinutes,
        capacityTotal: dto.capacityTotal,
        capacityAvailable: dto.capacityTotal,
        maxDetourMinutes: dto.maxDetourMinutes,
        pickupMode: dto.pickupMode ?? 'STATIONS',
        status: RouteOfferStatus.DRAFT,
      },
    });

    return { route, distanceMeters, durationSeconds };
  }

  async publishRoute(driverId: string, id: string) {
    const offer = await this.prisma.routeOffer.findUnique({ where: { id } });
    if (!offer || offer.driverId !== driverId) {
      throw new NotFoundException();
    }
    return this.prisma.routeOffer.update({
      where: { id },
      data: { status: RouteOfferStatus.PUBLISHED },
    });
  }

  async searchRouteOffers(dto: RiderRouteSearchDto) {
    const pickupStation = await this.prisma.station.findUnique({
      where: { id: dto.pickupStationId },
    });
    const dropoffStation = await this.prisma.station.findUnique({
      where: { id: dto.dropoffStationId },
    });
    if (!pickupStation || !dropoffStation) {
      throw new NotFoundException('Station not found');
    }

    const desiredTime = new Date(dto.desiredTime);
    const windowStart = new Date(desiredTime.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(desiredTime.getTime() + 60 * 60 * 1000);

    const candidates = await this.prisma.routeOffer.findMany({
      where: {
        status: RouteOfferStatus.PUBLISHED,
        capacityAvailable: { gte: dto.seats },
        departureTime: { gte: windowStart, lte: windowEnd },
      },
      include: { driver: { include: { user: true } } },
    });

    const results: any[] = [];

    for (const offer of candidates) {
      let points: { lat: number; lng: number }[];
      try {
        points = JSON.parse(offer.polyline);
      } catch {
        continue;
      }
      const cum = this.geometry.computeCumulativeDistances(points);

      const pickupProj = this.geometry.projectPointToPolyline(
        { lat: pickupStation.lat, lng: pickupStation.lng },
        points,
        cum,
      );
      const dropoffProj = this.geometry.projectPointToPolyline(
        { lat: dropoffStation.lat, lng: dropoffStation.lng },
        points,
        cum,
      );

      if (
        pickupProj.distanceMeters > STATION_TOLERANCE_METERS ||
        dropoffProj.distanceMeters > STATION_TOLERANCE_METERS
      ) {
        continue;
      }
      if (pickupProj.posMeters >= dropoffProj.posMeters) {
        continue;
      }

      const timeDiffMs = Math.abs(
        offer.departureTime.getTime() - desiredTime.getTime(),
      );
      const timeDiffMinutes = timeDiffMs / (60 * 1000);
      if (timeDiffMinutes > offer.flexMinutes) {
        continue;
      }

      results.push({
        offer,
        pickupProj,
        dropoffProj,
      });
    }

    return results;
  }
}

