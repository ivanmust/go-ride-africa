import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GeometryService } from '../geometry/geometry.service';
import { BookingService } from './booking.service';
import { RiderBookingsController } from './rider-bookings.controller';
import { DriverBookingsController } from './driver-bookings.controller';

@Module({
  imports: [PrismaModule],
  providers: [BookingService, GeometryService],
  controllers: [RiderBookingsController, DriverBookingsController],
})
export class BookingModule {}

