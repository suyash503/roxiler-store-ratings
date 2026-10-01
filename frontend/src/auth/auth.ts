import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type { User } from '../lib/types';
import type { LoginInput, SignupInput } from '../lib/validation';

export const ME_KEY = ['me'] as const;

/** The logged-in user, or null. Lives in the React Query cache under ME_KEY. */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api.get<User>('/auth/me');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: Infinity,
    retry: false,
  });
}

/** Returns the current user; only call inside routes guarded by RequireAuth. */
export function useCurrentUser(): User {
  const { data } = useMe();
  if (!data) throw new Error('useCurrentUser used outside an authenticated route');
  return data;
}

function useStartSession() {
  const queryClient = useQueryClient();
  return (user: User) => {
    // Drop anything cached for a previous user before switching.
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME_KEY[0] });
    queryClient.setQueryData(ME_KEY, user);
  };
}

export function useLogin() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<User>('/auth/login', input),
    onSuccess: startSession,
  });
}

export function useSignup() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (input: SignupInput) => api.post<User>('/auth/signup', input),
    onSuccess: startSession,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
    },
  });
}
