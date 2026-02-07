import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';

@Controller('driver/booking')
export class DriverBookingsController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  list(@Query('routeOfferId') routeOfferId: string) {
    return this.bookingService.listForRoute(routeOfferId);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.bookingService.acceptBooking(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.bookingService.rejectBooking(id);
  }

  @Post(':id/board')
  board(@Param('id') id: string, @Body('pinCode') pinCode: string) {
    return this.bookingService.boardBooking(id, pinCode);
  }

  @Post(':id/drop')
  drop(@Param('id') id: string) {
    return this.bookingService.dropBooking(id);
  }
}

