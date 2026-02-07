import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('stations')
export class StationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query('city') city?: string) {
    const where: any = { active: true };
    if (city) where.city = city;
    return this.prisma.station.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  @Get('nearest')
  async nearest(
    @Query('lat') latStr: string,
    @Query('lng') lngStr: string,
    @Query('city') city?: string,
  ) {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('Invalid lat/lng');
    }

    const where: Prisma.StationWhereInput = { active: true };
    if (city) where.city = city;

    const stations = await this.prisma.station.findMany({ where });
    if (!stations.length) {
      throw new BadRequestException('No stations found');
    }

    // simple nearest by haversine distance
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const lat1 = toRad(lat);
    const lng1 = toRad(lng);

    let best = stations[0];
    let bestDist = Number.POSITIVE_INFINITY;

    for (const s of stations) {
      const dLat = toRad(s.lat - lat);
      const dLng = toRad(s.lng - lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(toRad(s.lat)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }

    return { station: best, distanceMeters: bestDist };
  }
}

