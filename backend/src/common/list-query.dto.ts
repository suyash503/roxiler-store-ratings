import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export type SortOrder = 'asc' | 'desc';

/** Paging and sort direction shared by every table. Each list adds its own `sortBy` and filters. */
export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: SortOrder = 'asc';
}

/** Optional text filter: trimmed, blank treated as absent. */
export const FilterText = () => (target: object, key: string) => {
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })(target, key);
  IsOptional()(target, key);
  IsString()(target, key);
  MaxLength(100)(target, key);
};

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Escapes LIKE wildcards so a search for "50%" or "_" matches literally. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Pattern for raw `ILIKE` queries. */
export function likeContains(text: string): string {
  return `%${escapeLike(text)}%`;
}

/**
 * Prisma `contains` filter, case-insensitive. Prisma does not escape LIKE
 * wildcards itself, so without this "_" would match every row.
 */
export function containsText(text: string | undefined) {
  return text ? { contains: escapeLike(text), mode: 'insensitive' as const } : undefined;
}
