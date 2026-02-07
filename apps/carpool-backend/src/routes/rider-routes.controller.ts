import { Body, Controller, Post } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RiderRouteSearchDto } from './dto/rider-route-search.dto';

@Controller('rider')
export class RiderRoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('route/search')
  search(@Body() dto: RiderRouteSearchDto) {
    return this.routesService.searchRouteOffers(dto);
  }
}

