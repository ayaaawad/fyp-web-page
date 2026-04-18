const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

type RequestOptions = {
  token?: string;
};

export async function apiPost<TResponse>(
  endpoint: string,
  payload: unknown,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await tryParseJson(response);
    throw new Error(
      getErrorMessage(errorBody) ?? `Request failed with ${response.status}`,
    );
  }

  return (await response.json()) as TResponse;
}

export async function apiGet<TResponse>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await tryParseJson(response);
    throw new Error(
      getErrorMessage(errorBody) ?? `Request failed with ${response.status}`,
    );
  }

  return (await response.json()) as TResponse;
}

export async function apiPut<TResponse>(
  endpoint: string,
  payload: unknown,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await tryParseJson(response);
    throw new Error(
      getErrorMessage(errorBody) ?? `Request failed with ${response.status}`,
    );
  }

  return (await response.json()) as TResponse;
}

export async function apiDelete<TResponse>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await tryParseJson(response);
    throw new Error(
      getErrorMessage(errorBody) ?? `Request failed with ${response.status}`,
    );
  }

  return (await response.json()) as TResponse;
}

async function tryParseJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = (payload as { message?: unknown }).message;

  if (typeof candidate === 'string') {
    return candidate;
  }

  if (Array.isArray(candidate) && candidate.length > 0) {
    return String(candidate[0]);
  }

  return null;
}
