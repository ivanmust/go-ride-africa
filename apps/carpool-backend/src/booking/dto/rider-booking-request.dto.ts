import { IsInt, IsPositive, IsString } from 'class-validator';

export class RiderBookingRequestDto {
  @IsString()
  riderId!: string; // from /auth/verify-otp response

  @IsString()
  routeOfferId!: string;

  @IsString()
  pickupStationId!: string;

  @IsString()
  dropoffStationId!: string;

  @IsInt()
  @IsPositive()
  seats!: number;

  @IsString()
  currency!: string;
}

