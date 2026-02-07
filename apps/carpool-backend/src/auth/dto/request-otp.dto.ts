import { IsString, MinLength } from 'class-validator';

export class RequestOtpDto {
  // Accept any non-empty phone string; backend doesn't enforce format strictly
  @IsString()
  @MinLength(5)
  phone!: string;
}

