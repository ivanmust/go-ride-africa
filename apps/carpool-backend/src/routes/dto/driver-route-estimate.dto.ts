import { IsDateString, IsInt, IsPositive } from 'class-validator';

export class DriverRouteEstimateDto {
  @IsPositive()
  @IsInt()
  startStationId!: number | string;

  @IsPositive()
  @IsInt()
  endStationId!: number | string;

  @IsDateString()
  departureTime!: string;

  @IsInt()
  flexMinutes!: number;

  @IsInt()
  capacityTotal!: number;
}

