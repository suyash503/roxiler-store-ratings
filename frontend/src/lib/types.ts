export type Role = 'ADMIN' | 'USER' | 'STORE_OWNER';
export type SortOrder = 'asc' | 'desc';

export interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  role: Role;
  createdAt?: string;
}

export interface UserDetail extends User {
  /** Store owners only; null when no store is assigned yet. */
  store?: { id: number; name: string; averageRating: number | null; ratingCount: number } | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Store {
  id: number;
  name: string;
  email: string;
  address: string;
  averageRating: number | null;
  ratingCount: number;
  /** Normal users only. */
  myRating?: number | null;
  /** Admins only. */
  owner?: { id: number; name: string };
  createdAt: string;
}

export interface Stats {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}

export interface RatingResult {
  storeId: number;
  myRating: number;
  averageRating: number | null;
  ratingCount: number;
}

export interface OwnerDashboard {
  store: { id: number; name: string; email: string; address: string };
  averageRating: number | null;
  ratingCount: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface Rater {
  userId: number;
  name: string;
  email: string;
  value: number;
  updatedAt: string;
}
