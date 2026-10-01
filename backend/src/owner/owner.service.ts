import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { containsText, Page } from '../common/list-query.dto';
import { roundRating } from '../common/rating';
import { PrismaService } from '../prisma/prisma.service';
import { ListRatersQueryDto, OwnerDashboard, Rater, RaterSortField } from './owner.dto';

const RATER_ORDER: Record<RaterSortField, (order: Prisma.SortOrder) => Prisma.RatingOrderByWithRelationInput> = {
  name: (order) => ({ user: { name: order } }),
  email: (order) => ({ user: { email: order } }),
  value: (order) => ({ value: order }),
  updatedAt: (order) => ({ updatedAt: order }),
};

@Injectable()
export class OwnerService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(ownerId: number): Promise<OwnerDashboard> {
    const store = await this.findStore(ownerId);
    const [stats, groups] = await Promise.all([
      this.prisma.rating.aggregate({
        where: { storeId: store.id },
        _avg: { value: true },
        _count: { _all: true },
      }),
      this.prisma.rating.groupBy({
        by: ['value'],
        where: { storeId: store.id },
        _count: { _all: true },
      }),
    ]);

    const distribution: Record<string, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const group of groups) distribution[group.value] = group._count._all;

    return {
      store,
      averageRating: roundRating(stats._avg.value),
      ratingCount: stats._count._all,
      distribution,
    };
  }

  async raters(ownerId: number, query: ListRatersQueryDto): Promise<Page<Rater>> {
    const store = await this.findStore(ownerId);
    const where: Prisma.RatingWhereInput = {
      storeId: store.id,
      user: query.q
        ? { OR: [{ name: containsText(query.q) }, { email: containsText(query.q) }] }
        : undefined,
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.rating.findMany({
        where,
        select: { value: true, updatedAt: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: [RATER_ORDER[query.sortBy](query.order), { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.rating.count({ where }),
    ]);

    const items = rows.map(({ user, value, updatedAt }) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      value,
      updatedAt,
    }));
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  private async findStore(ownerId: number) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId },
      select: { id: true, name: true, email: true, address: true },
    });
    if (!store) throw new NotFoundException('No store is assigned to your account yet');
    return store;
  }
}
