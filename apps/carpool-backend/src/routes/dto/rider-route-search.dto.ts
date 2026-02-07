import { IsDateString, IsInt, IsPositive, IsString } from 'class-validator';

export class RiderRouteSearchDto {
  @IsString()
  pickupStationId!: string;

  @IsString()
  dropoffStationId!: string;

  @IsDateString()
  desiredTime!: string;

  @IsInt()
  @IsPositive()
  seats!: number;
}

