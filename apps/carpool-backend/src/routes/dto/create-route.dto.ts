import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { PickupMode } from '@prisma/client';

export class CreateRouteDto {
  @IsPositive()
  @IsInt()
  startStationId!: number | string;

  @IsPositive()
  @IsInt()
  endStationId!: number | string;

  @IsDateString()
  departureTime!: string;

  @IsInt()
  @Min(0)
  flexMinutes!: number;

  @IsInt()
  @IsPositive()
  capacityTotal!: number;

  @IsInt()
  @Min(0)
  maxDetourMinutes!: number;

  @IsEnum(PickupMode)
  @IsOptional()
  pickupMode?: PickupMode;
}

