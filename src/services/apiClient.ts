export interface ApiErrorPayload {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  title: string;
  errors?: Record<string, string[]>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.detail || payload.title || `Erro HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.title = payload.title || 'Erro na requisição';
    this.errors = payload.errors;
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

let accessTokenMemory: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessTokenMemory = token;
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          accessTokenMemory = null;
          return null;
        }
        const data = (await res.json()) as { accessToken?: string };
        accessTokenMemory = data.accessToken ?? null;
        return accessTokenMemory;
      } catch {
        accessTokenMemory = null;
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuthRetry?: boolean } = {}
): Promise<T> {
  const { skipAuthRetry, headers, ...rest } = options;
  const reqHeaders = new Headers(headers);

  if (rest.body && !reqHeaders.has('Content-Type')) {
    reqHeaders.set('Content-Type', 'application/json');
  }
  if (accessTokenMemory) {
    reqHeaders.set('Authorization', `Bearer ${accessTokenMemory}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: reqHeaders,
    credentials: 'include',
  });

  if (response.status === 401 && !skipAuthRetry && !path.startsWith('/auth/')) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      reqHeaders.set('Authorization', `Bearer ${refreshed}`);
      const retryResponse = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: reqHeaders,
        credentials: 'include',
      });
      return handleResponse<T>(retryResponse);
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : { detail: await response.text() };

  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorPayload);
  }

  return body as T;
}
