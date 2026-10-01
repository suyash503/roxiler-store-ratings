import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { Roles } from '../auth/auth.constants';
import { CreateUserDto, ListUsersQueryDto, PublicUser, UserDetail, UserPage } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('users (admin)')
@ApiCookieAuth()
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Add a user of any role (normal user, admin or store owner). */
  @Post()
  create(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.users.create(dto);
  }

  /** List users with filters, sorting and paging. */
  @Get()
  list(@Query() query: ListUsersQueryDto): Promise<UserPage> {
    return this.users.list(query);
  }

  /** One user's details; store owners include their store's rating. */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDetail> {
    return this.users.findOne(id);
  }
}
