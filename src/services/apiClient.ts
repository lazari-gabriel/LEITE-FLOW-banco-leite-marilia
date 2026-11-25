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
    super(
      payload.detail ||
        payload.title ||
        'Não foi possível concluir a solicitação. Tente novamente em instantes.'
    );
    this.name = 'ApiError';
    this.status = status;
    this.title = payload.title || 'Não foi possível concluir a solicitação';
    this.errors = payload.errors;
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

let accessTokenMemory: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let bootstrapRefreshPromise: Promise<{ accessToken: string; user: unknown } | null> | null = null;
let sessionExpiredHandler: (() => void) | null = null;
let sessionExpiredNotified = false;

export function setAccessToken(token: string | null): void {
  accessTokenMemory = token;
  if (token) {
    sessionExpiredNotified = false;
  }
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export function setOnSessionExpired(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export async function refreshSessionOnce<TUser>(): Promise<{
  accessToken: string;
  user: TUser;
} | null> {
  if (!bootstrapRefreshPromise) {
    bootstrapRefreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          accessTokenMemory = null;
          return null;
        }
        const data = (await res.json()) as { accessToken?: string; user?: unknown };
        if (!data.accessToken || !data.user) {
          accessTokenMemory = null;
          return null;
        }
        accessTokenMemory = data.accessToken;
        sessionExpiredNotified = false;
        return { accessToken: data.accessToken, user: data.user };
      } catch {
        accessTokenMemory = null;
        return null;
      } finally {
        // Mantém a promessa deduplicada durante o ciclo de remount do React StrictMode
        setTimeout(() => {
          bootstrapRefreshPromise = null;
        }, 100);
      }
    })();
  }

  return bootstrapRefreshPromise as Promise<{ accessToken: string; user: TUser } | null>;
}

function notifySessionExpiredOnce(): void {
  if (!sessionExpiredNotified && sessionExpiredHandler) {
    sessionExpiredNotified = true;
    sessionExpiredHandler();
  }
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
        if (accessTokenMemory) {
          sessionExpiredNotified = false;
        }
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
      if (retryResponse.status === 401) {
        accessTokenMemory = null;
        notifySessionExpiredOnce();
      }
      return handleResponse<T>(retryResponse);
    }

    accessTokenMemory = null;
    notifySessionExpiredOnce();
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
