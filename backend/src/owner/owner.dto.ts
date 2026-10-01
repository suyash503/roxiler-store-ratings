import { IsIn, IsOptional } from 'class-validator';
import { FilterText, ListQueryDto } from '../common/list-query.dto';

export const RATER_SORT_FIELDS = ['name', 'email', 'value', 'updatedAt'] as const;
export type RaterSortField = (typeof RATER_SORT_FIELDS)[number];

export class ListRatersQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(RATER_SORT_FIELDS)
  sortBy: RaterSortField = 'updatedAt';

  /** Matches the rater's name or email. */
  @FilterText()
  q?: string;
}

export class OwnedStore {
  id!: number;
  name!: string;
  email!: string;
  address!: string;
}

export class OwnerDashboard {
  store!: OwnedStore;
  /** Average of all ratings, 2 decimals; null when unrated. */
  averageRating!: number | null;
  ratingCount!: number;
  /** How many ratings of each star value, keys "1"–"5". */
  distribution!: Record<string, number>;
}

export class Rater {
  userId!: number;
  name!: string;
  email!: string;
  value!: number;
  /** When the rating was last submitted or changed. */
  updatedAt!: Date;
}

export class RaterPage {
  items!: Rater[];
  total!: number;
  page!: number;
  pageSize!: number;
}
