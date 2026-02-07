import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GeometryService } from '../geometry/geometry.service';
import { RoutesService } from './routes.service';
import { DriverRoutesController } from './driver-routes.controller';
import { RiderRoutesController } from './rider-routes.controller';

@Module({
  imports: [PrismaModule],
  providers: [RoutesService, GeometryService],
  controllers: [DriverRoutesController, RiderRoutesController],
})
export class RoutesModule {}

