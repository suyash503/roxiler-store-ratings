import { SetMetadata } from '@nestjs/common';
import { Role } from '../generated/prisma/enums';

export const ACCESS_TOKEN_COOKIE = 'access_token';

export const IS_PUBLIC_KEY = 'isPublic';
/** Opts a route out of the global auth guard. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restricts a route (or controller) to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export interface JwtPayload {
  sub: number;
  /** User.tokenVersion at issue time; a password change invalidates older tokens. */
  tv: number;
}

/** What guards attach to `request.user`. Loaded from the DB, so role changes apply at once. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  address: string;
  role: Role;
}
