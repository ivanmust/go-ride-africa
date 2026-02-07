import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { DriverRouteEstimateDto } from './dto/driver-route-estimate.dto';
import { CreateRouteDto } from './dto/create-route.dto';

// For now, driverId is mocked; later, use auth guard + current user
const MOCK_DRIVER_ID = 'mock-driver-id';

@Controller('driver')
export class DriverRoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('route/estimate')
  estimate(@Body() dto: DriverRouteEstimateDto) {
    return this.routesService.estimateRoute(dto);
  }

  @Post('route/create')
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.createRoute(MOCK_DRIVER_ID, dto);
  }

  @Post('route/:id/publish')
  publish(@Param('id') id: string) {
    return this.routesService.publishRoute(MOCK_DRIVER_ID, id);
  }

  @Get('routes')
  list() {
    // simple list of all driver routes for the mock driver
    return this.routesService['prisma'].routeOffer.findMany({
      where: { driverId: MOCK_DRIVER_ID },
      orderBy: { createdAt: 'desc' },
    });
  }
}

