import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { Role } from '../generated/prisma/enums';
import { AuthUser } from '../auth/auth.constants';
import { likeContains, Page } from '../common/list-query.dto';
import { uniqueViolation, violates } from '../common/prisma-errors';
import { roundRating } from '../common/rating';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStoreDto,
  ListStoresQueryDto,
  RatingResult,
  StoreListItem,
  StoreSortField,
} from './stores.dto';

/** Whitelisted ORDER BY expressions; user input never reaches the SQL text. */
const SORT_SQL: Record<StoreSortField, Prisma.Sql> = {
  name: Prisma.sql`s.name`,
  email: Prisma.sql`s.email`,
  address: Prisma.sql`s.address`,
  averageRating: Prisma.sql`stats.average`,
  ratingCount: Prisma.sql`COALESCE(stats.count, 0)`,
  myRating: Prisma.sql`mine.value`,
  createdAt: Prisma.sql`s.created_at`,
};

interface StoreRow {
  id: number;
  name: string;
  email: string;
  address: string;
  createdAt: Date;
  averageRating: number | null;
  ratingCount: number;
  myRating: number | null;
  ownerId: number;
  ownerName: string;
}

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStoreDto) {
    const owner = await this.prisma.user.findUnique({
      where: { id: dto.ownerId },
      select: { role: true, store: { select: { id: true } } },
    });
    if (!owner) throw new BadRequestException('The selected owner does not exist');
    if (owner.role !== Role.STORE_OWNER) {
      throw new BadRequestException('The selected user is not a store owner');
    }
    if (owner.store) throw new ConflictException('This owner already has a store');

    try {
      return await this.prisma.store.create({
        data: dto,
        select: { id: true, name: true, email: true, address: true, ownerId: true, createdAt: true },
      });
    } catch (error) {
      const violated = uniqueViolation(error);
      if (violates(violated, 'email')) {
        throw new ConflictException('A store with this email already exists');
      }
      // Two admins assigning the same owner at once: the unique index decides.
      if (violates(violated, 'owner')) throw new ConflictException('This owner already has a store');
      throw error;
    }
  }

  async list(query: ListStoresQueryDto, viewer: AuthUser): Promise<Page<StoreListItem>> {
    const conditions: Prisma.Sql[] = [];
    if (query.q) {
      const pattern = likeContains(query.q);
      conditions.push(Prisma.sql`(s.name ILIKE ${pattern} OR s.address ILIKE ${pattern})`);
    }
    if (query.name) conditions.push(Prisma.sql`s.name ILIKE ${likeContains(query.name)}`);
    if (query.email) conditions.push(Prisma.sql`s.email ILIKE ${likeContains(query.email)}`);
    if (query.address) conditions.push(Prisma.sql`s.address ILIKE ${likeContains(query.address)}`);
    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const direction = query.order === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
    const offset = (query.page - 1) * query.pageSize;

    const [rows, [{ total }]] = await Promise.all([
      this.prisma.$queryRaw<StoreRow[]>`
        SELECT s.id, s.name, s.email, s.address, s.created_at AS "createdAt",
               stats.average AS "averageRating",
               COALESCE(stats.count, 0)::int AS "ratingCount",
               mine.value::int AS "myRating",
               o.id AS "ownerId", o.name AS "ownerName"
        FROM stores s
        JOIN users o ON o.id = s.owner_id
        LEFT JOIN (
          SELECT store_id, AVG(value)::float8 AS average, COUNT(*)::int AS count
          FROM ratings
          GROUP BY store_id
        ) stats ON stats.store_id = s.id
        LEFT JOIN ratings mine ON mine.store_id = s.id AND mine.user_id = ${viewer.id}
        ${where}
        ORDER BY ${SORT_SQL[query.sortBy]} ${direction} NULLS LAST, s.id ASC
        LIMIT ${query.pageSize} OFFSET ${offset}`,
      this.prisma.$queryRaw<[{ total: number }]>`
        SELECT COUNT(*)::int AS total FROM stores s ${where}`,
    ]);

    const isAdmin = viewer.role === Role.ADMIN;
    const items = rows.map(({ ownerId, ownerName, myRating, ...row }) => ({
      ...row,
      averageRating: roundRating(row.averageRating),
      ...(isAdmin ? { owner: { id: ownerId, name: ownerName } } : { myRating }),
    }));
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  /** Submit or change the viewer's rating. One statement, so double-clicks can't create two rows. */
  async rate(storeId: number, userId: number, value: number): Promise<RatingResult> {
    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
    if (!store) throw new NotFoundException('Store not found');

    await this.prisma.$executeRaw`
      INSERT INTO ratings (user_id, store_id, value, updated_at)
      VALUES (${userId}, ${storeId}, ${value}, now())
      ON CONFLICT (user_id, store_id)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;

    const stats = await this.prisma.rating.aggregate({
      where: { storeId },
      _avg: { value: true },
      _count: { _all: true },
    });
    return {
      storeId,
      myRating: value,
      averageRating: roundRating(stats._avg.value),
      ratingCount: stats._count._all,
    };
  }
}
