import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { Roles } from '../auth/auth.constants';
import type { AuthUser } from '../auth/auth.constants';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateStoreDto,
  ListStoresQueryDto,
  RateStoreDto,
  RatingResult,
  StorePage,
} from './stores.dto';
import { StoresService } from './stores.service';

@ApiTags('stores')
@ApiCookieAuth()
@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  /** Admin: add a store and assign it to a store owner. */
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateStoreDto) {
    return this.stores.create(dto);
  }

  /**
   * Admins see every store with its owner; normal users also get their own
   * rating (`myRating`). Search with `q` (name or address) or per-field filters.
   */
  @Roles(Role.ADMIN, Role.USER)
  @Get()
  list(@Query() query: ListStoresQueryDto, @CurrentUser() viewer: AuthUser): Promise<StorePage> {
    return this.stores.list(query, viewer);
  }

  /** Normal users: submit a 1–5 rating, or replace the one they gave before. */
  @Roles(Role.USER)
  @Put(':id/rating')
  rate(
    @Param('id', ParseIntPipe) storeId: number,
    @Body() dto: RateStoreDto,
    @CurrentUser() user: AuthUser,
  ): Promise<RatingResult> {
    return this.stores.rate(storeId, user.id, dto.value);
  }
}
