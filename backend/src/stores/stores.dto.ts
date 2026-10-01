import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { FilterText, ListQueryDto } from '../common/list-query.dto';
import { IsValidAddress, IsValidEmail, IsValidName } from '../common/validation';

export class CreateStoreDto {
  /** 20–60 characters (the brief's Name rule applies to every form) */
  @IsValidName()
  name!: string;

  @IsValidEmail()
  email!: string;

  /** Up to 400 characters */
  @IsValidAddress()
  address!: string;

  /** A STORE_OWNER user who doesn't own a store yet */
  @Type(() => Number)
  @IsInt({ message: 'Choose a store owner' })
  @Min(1, { message: 'Choose a store owner' })
  ownerId!: number;
}

export const STORE_SORT_FIELDS = [
  'name',
  'email',
  'address',
  'averageRating',
  'ratingCount',
  'myRating',
  'createdAt',
] as const;
export type StoreSortField = (typeof STORE_SORT_FIELDS)[number];

export class ListStoresQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(STORE_SORT_FIELDS)
  sortBy: StoreSortField = 'name';

  /** Matches name OR address (the normal user's search box). */
  @FilterText()
  q?: string;

  @FilterText()
  name?: string;

  @FilterText()
  email?: string;

  @FilterText()
  address?: string;
}

export class RateStoreDto {
  /** Whole stars, 1–5 */
  @IsInt({ message: 'Rating must be a whole number from 1 to 5' })
  @Min(1, { message: 'Rating must be a whole number from 1 to 5' })
  @Max(5, { message: 'Rating must be a whole number from 1 to 5' })
  value!: number;
}

export class StoreOwnerRef {
  id!: number;
  name!: string;
}

export class StoreListItem {
  id!: number;
  name!: string;
  email!: string;
  address!: string;
  /** Average of all ratings, 2 decimals; null when unrated. */
  averageRating!: number | null;
  ratingCount!: number;
  /** The viewer's own rating (normal users only); null if they haven't rated. */
  myRating?: number | null;
  /** Admins only. */
  owner?: StoreOwnerRef;
  createdAt!: Date;
}

export class StorePage {
  items!: StoreListItem[];
  total!: number;
  page!: number;
  pageSize!: number;
}

export class RatingResult {
  storeId!: number;
  myRating!: number;
  averageRating!: number | null;
  ratingCount!: number;
}
