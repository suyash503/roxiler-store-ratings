import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { Roles } from '../auth/auth.constants';
import type { AuthUser } from '../auth/auth.constants';
import { CurrentUser } from '../auth/current-user.decorator';
import { ListRatersQueryDto, OwnerDashboard, RaterPage } from './owner.dto';
import { OwnerService } from './owner.service';

@ApiTags('store owner')
@ApiCookieAuth()
@Roles(Role.STORE_OWNER)
@Controller('owner')
export class OwnerController {
  constructor(private readonly owner: OwnerService) {}

  /** The owner's store with its average rating and star breakdown. 404 if no store is assigned yet. */
  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser): Promise<OwnerDashboard> {
    return this.owner.dashboard(user.id);
  }

  /** Users who rated the owner's store. */
  @Get('ratings')
  raters(@CurrentUser() user: AuthUser, @Query() query: ListRatersQueryDto): Promise<RaterPage> {
    return this.owner.raters(user.id, query);
  }
}
