const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(data?.message || 'An API error occurred');
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(response.status, errorData);
  }

  // Not all endpoints return JSON (e.g. 204 No Content)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const api = {
  get: (url: string) => fetchWithAuth(url, { method: 'GET' }),
  post: (url: string, body?: any) => fetchWithAuth(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (url: string, body?: any) => fetchWithAuth(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (url: string) => fetchWithAuth(url, { method: 'DELETE' }),
};
