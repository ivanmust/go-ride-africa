import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, RouteOffer, Station } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RiderBookingRequestDto } from './dto/rider-booking-request.dto';
import { GeometryService } from '../geometry/geometry.service';

const ROUTE_SPEED_MPS = 12; // ~43 km/h
const BASE_CENTS = 500;
const PER_KM_CENTS = 100;
const PER_MIN_CENTS = 10;
const CARPOOL_MULTIPLIER = 0.85;

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geometry: GeometryService,
  ) {}

  private computeSegmentAndPrice(params: {
    offer: RouteOffer;
    pickupStation: Station;
    dropoffStation: Station;
  }) {
    const { offer, pickupStation, dropoffStation } = params;

    const points = JSON.parse(offer.polyline) as { lat: number; lng: number }[];
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

    if (pickupProj.posMeters >= dropoffProj.posMeters) {
      throw new BadRequestException(
        'Pickup must be before dropoff along the route',
      );
    }

    const segmentMeters = dropoffProj.posMeters - pickupProj.posMeters;
    const segmentSeconds = segmentMeters / ROUTE_SPEED_MPS;
    const distanceKm = segmentMeters / 1000;
    const durationMinutes = segmentSeconds / 60;

    let fareCents =
      BASE_CENTS +
      PER_KM_CENTS * distanceKm +
      PER_MIN_CENTS * durationMinutes;

    fareCents = Math.round(fareCents * CARPOOL_MULTIPLIER);
    fareCents = Math.round(fareCents);

    return {
      pickupPosMeters: pickupProj.posMeters,
      dropoffPosMeters: dropoffProj.posMeters,
      priceCents: fareCents,
    };
  }

  async requestBooking(dto: RiderBookingRequestDto) {
    const { riderId, routeOfferId, pickupStationId, dropoffStationId, seats } =
      dto;

    const [offer, pickupStation, dropoffStation, rider] =
      await this.prisma.$transaction([
        this.prisma.routeOffer.findUnique({ where: { id: routeOfferId } }),
        this.prisma.station.findUnique({ where: { id: pickupStationId } }),
        this.prisma.station.findUnique({ where: { id: dropoffStationId } }),
        this.prisma.riderProfile.findUnique({ where: { userId: riderId } }),
      ]);

    if (!offer) throw new NotFoundException('Route offer not found');
    if (!pickupStation || !dropoffStation) {
      throw new BadRequestException('Invalid station(s)');
    }
    if (!rider) {
      throw new BadRequestException('Rider profile not found');
    }
    if (offer.capacityAvailable < seats) {
      throw new BadRequestException('Not enough seats available');
    }

    const { pickupPosMeters, dropoffPosMeters, priceCents } =
      this.computeSegmentAndPrice({
        offer,
        pickupStation,
        dropoffStation,
      });

    const pinCode = (1000 + Math.floor(Math.random() * 9000)).toString();

    const booking = await this.prisma.booking.create({
      data: {
        routeOfferId,
        riderId,
        seatsRequested: seats,
        pickupStationId,
        dropoffStationId,
        pickupPosMeters,
        dropoffPosMeters,
        status: BookingStatus.REQUESTED,
        priceCents: priceCents,
        currency: dto.currency,
        pinCode,
      },
    });

    return booking;
  }

  async listForRider(riderId: string) {
    return this.prisma.booking.findMany({
      where: { riderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingForRider(riderId: string, id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.riderId !== riderId) {
      throw new NotFoundException();
    }
    return booking;
  }

  async listForRoute(routeOfferId: string) {
    return this.prisma.booking.findMany({
      where: { routeOfferId },
      orderBy: { pickupPosMeters: 'asc' },
    });
  }

  async acceptBooking(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking) throw new NotFoundException();
      if (booking.status !== BookingStatus.REQUESTED) {
        throw new BadRequestException('Booking is not in REQUESTED state');
      }

      const offer = await tx.routeOffer.findUnique({
        where: { id: booking.routeOfferId },
      });
      if (!offer) throw new NotFoundException('Route offer not found');
      if (offer.capacityAvailable < booking.seatsRequested) {
        throw new BadRequestException('Not enough capacity');
      }

      const updatedOffer = await tx.routeOffer.update({
        where: { id: offer.id },
        data: {
          capacityAvailable: {
            decrement: booking.seatsRequested,
          },
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status: BookingStatus.ACCEPTED },
      });

      return { booking: updatedBooking, routeOffer: updatedOffer };
    });
  }

  async rejectBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException();
    if (
      booking.status !== BookingStatus.REQUESTED &&
      booking.status !== BookingStatus.OFFERED
    ) {
      throw new BadRequestException('Cannot reject booking in this state');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.REJECTED },
    });
  }

  async boardBooking(id: string, pinCode: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException();
    if (booking.status !== BookingStatus.ACCEPTED) {
      throw new BadRequestException('Booking is not accepted');
    }
    if (booking.pinCode !== pinCode) {
      throw new BadRequestException('Invalid PIN code');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.BOARDED },
    });
  }

  async dropBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException();
    if (booking.status !== BookingStatus.BOARDED) {
      throw new BadRequestException('Booking is not boarded');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.DROPPED },
    });
  }
}

