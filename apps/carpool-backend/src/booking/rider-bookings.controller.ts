import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { RiderBookingRequestDto } from './dto/rider-booking-request.dto';

@Controller('rider/booking')
export class RiderBookingsController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('request')
  request(@Body() dto: RiderBookingRequestDto) {
    return this.bookingService.requestBooking(dto);
  }

  @Get()
  list(@Query('riderId') riderId: string) {
    return this.bookingService.listForRider(riderId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Query('riderId') riderId: string) {
    return this.bookingService.getBookingForRider(riderId, id);
  }
}

