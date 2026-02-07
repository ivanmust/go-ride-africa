import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOtp(): string {
    return (100000 + Math.floor(Math.random() * 900000)).toString();
  }

  async requestOtp({ phone }: RequestOtpDto) {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.oTP.upsert({
      where: { phone },
      update: { code: otp, expiresAt },
      create: { phone, code: otp, expiresAt },
    });

    // In development, return OTP in response
    return { success: true, otp };
  }

  async verifyOtp({ phone, otp }: VerifyOtpDto) {
    const record = await this.prisma.oTP.findUnique({ where: { phone } });
    if (!record || record.code !== otp || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, role: UserRole.RIDER },
      });
      await this.prisma.riderProfile.create({ data: { userId: user.id } });
    }

    const token = jwt.sign(
      { sub: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' },
    );

    return { token, user };
  }
}

