import { IsString, Length, MinLength } from 'class-validator';

export class VerifyOtpDto {
  // Accept any non-empty phone string; format can be validated later if needed
  @IsString()
  @MinLength(5)
  phone!: string;

  @Length(4, 6)
  otp!: string;
}

