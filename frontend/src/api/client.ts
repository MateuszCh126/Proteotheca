export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

type ApiErrorBody = {
  detail?: unknown;
  message?: unknown;
  error?: unknown;
};

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

function normalizeErrorMessage(body: ApiErrorBody | string | null, fallback: string): string {
  if (!body) return fallback;
  if (typeof body === 'string') return body || fallback;

  const candidate = body.detail ?? body.message ?? body.error;
  if (typeof candidate === 'string') return candidate;
  if (Array.isArray(candidate)) {
    return candidate
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') {
          return item.msg;
        }
        return null;
      })
      .filter(Boolean)
      .join(', ') || fallback;
  }

  return fallback;
}

async function parseError(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      return normalizeErrorMessage((await response.json()) as ApiErrorBody, fallback);
    }

    return normalizeErrorMessage(await response.text(), fallback);
  } catch {
    return fallback;
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...jsonHeaders,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
