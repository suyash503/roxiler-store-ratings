import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { Roles } from '../auth/auth.constants';
import { PrismaService } from '../prisma/prisma.service';

export class PlatformStats {
  totalUsers!: number;
  totalStores!: number;
  totalRatings!: number;
}

@ApiTags('users (admin)')
@ApiCookieAuth()
@Roles(Role.ADMIN)
@Controller('stats')
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin dashboard totals. */
  @Get()
  async get(): Promise<PlatformStats> {
    const [totalUsers, totalStores, totalRatings] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.store.count(),
      this.prisma.rating.count(),
    ]);
    return { totalUsers, totalStores, totalRatings };
  }
}
