import { Prisma } from '../generated/prisma/client';

/**
 * If `error` is a unique-constraint violation, returns what identifies the
 * constraint (index name such as "stores_email_key", or column names);
 * otherwise undefined. Lets services turn a race-proof DB constraint into a
 * precise 409 instead of checking first and hoping.
 */
export function uniqueViolation(error: unknown): string[] | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return undefined;
  }
  // Driver adapters (used here) report the index; the classic engine reports `target`.
  const meta = error.meta as
    | {
        target?: string | string[];
        driverAdapterError?: { cause?: { constraint?: { index?: string; fields?: string[] } } };
      }
    | undefined;
  const constraint = meta?.driverAdapterError?.cause?.constraint;
  const target = typeof meta?.target === 'string' ? [meta.target] : (meta?.target ?? []);
  return [...(constraint?.index ? [constraint.index] : []), ...(constraint?.fields ?? []), ...target];
}

/** True if the violated unique constraint involves `column`. */
export function violates(identifiers: string[] | undefined, column: string): boolean {
  return identifiers?.some((id) => id.includes(column)) ?? false;
}
