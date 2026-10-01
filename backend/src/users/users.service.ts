import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { Role } from '../generated/prisma/enums';
import { containsText, Page } from '../common/list-query.dto';
import { uniqueViolation } from '../common/prisma-errors';
import { roundRating } from '../common/rating';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { CreateUserDto, ListUsersQueryDto, PublicUser, publicUserSelect, UserDetail } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const passwordHash = await this.passwords.hash(dto.password);
    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          address: dto.address,
          role: dto.role,
          passwordHash,
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (uniqueViolation(error)) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async list(query: ListUsersQueryDto): Promise<Page<PublicUser>> {
    const where: Prisma.UserWhereInput = {
      name: containsText(query.name),
      email: containsText(query.email),
      address: containsText(query.address),
      role: query.withoutStore ? Role.STORE_OWNER : query.role,
      store: query.withoutStore ? { is: null } : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: publicUserSelect,
        // id breaks ties so paging is stable when many rows share a value.
        orderBy: [{ [query.sortBy]: query.order }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: number): Promise<UserDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...publicUserSelect, store: { select: { id: true, name: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const { store, ...rest } = user;
    if (user.role !== Role.STORE_OWNER) return rest;
    if (!store) return { ...rest, store: null };

    const stats = await this.prisma.rating.aggregate({
      where: { storeId: store.id },
      _avg: { value: true },
      _count: { _all: true },
    });
    return {
      ...rest,
      store: {
        ...store,
        averageRating: roundRating(stats._avg.value),
        ratingCount: stats._count._all,
      },
    };
  }
}
