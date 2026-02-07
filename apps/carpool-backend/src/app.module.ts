import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StationsModule } from './stations/stations.module';
import { RoutesModule } from './routes/routes.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StationsModule,
    RoutesModule,
    BookingModule,
  ],
})
export class AppModule {}

