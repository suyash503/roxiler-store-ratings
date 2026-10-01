import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional } from 'class-validator';
import { Role } from '../generated/prisma/enums';
import { FilterText, ListQueryDto } from '../common/list-query.dto';
import { IsValidAddress, IsValidEmail, IsValidName, IsValidPassword } from '../common/validation';

export class CreateUserDto {
  /** 20–60 characters */
  @IsValidName()
  name!: string;

  @IsValidEmail()
  email!: string;

  /** 8–16 characters with at least one uppercase letter and one special character */
  @IsValidPassword()
  password!: string;

  /** Up to 400 characters */
  @IsValidAddress()
  address!: string;

  @IsEnum(Role, { message: `Role must be one of ${Object.values(Role).join(', ')}` })
  role!: Role;
}

export const USER_SORT_FIELDS = ['name', 'email', 'address', 'role', 'createdAt'] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export class ListUsersQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sortBy: UserSortField = 'name';

  @FilterText()
  name?: string;

  @FilterText()
  email?: string;

  @FilterText()
  address?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  /** Only store owners who don't have a store yet (for the "add store" owner picker). */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  withoutStore?: boolean;
}

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  address: true,
  role: true,
  createdAt: true,
} as const;

export class PublicUser {
  id!: number;
  name!: string;
  email!: string;
  address!: string;
  role!: Role;
  createdAt!: Date;
}

export class StoreSummary {
  id!: number;
  name!: string;
  /** Average of all ratings, 2 decimals; null when unrated. */
  averageRating!: number | null;
  ratingCount!: number;
}

export class UserDetail extends PublicUser {
  /** Present for store owners who have a store. */
  store?: StoreSummary | null;
}

export class UserPage {
  items!: PublicUser[];
  total!: number;
  page!: number;
  pageSize!: number;
}
