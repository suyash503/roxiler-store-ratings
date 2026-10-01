/** Error from the API, with Nest's message(s) normalised to a list. */
export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? 'Something went wrong');
    this.status = status;
    this.messages = messages;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

/** Builds "?a=1&b=x", skipping empty values. */
export function toQueryString(query: Query = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, ['Could not reach the server. Check your connection and try again.']);
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const raw = (data as { message?: unknown } | null)?.message;
    const messages = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [response.statusText];
    if (response.status === 429) messages.splice(0, messages.length, 'Too many attempts. Please wait a minute and try again.');
    throw new ApiError(response.status, messages);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', `${path}${toQueryString(query)}`),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
};
