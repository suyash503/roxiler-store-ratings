/** Averages are returned with 2 decimals; null means "no ratings yet", never 0. */
export function roundRating(value: number | null | undefined): number | null {
  return value == null ? null : Math.round(value * 100) / 100;
}
