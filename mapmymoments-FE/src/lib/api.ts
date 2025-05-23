// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function apiFetch(input: RequestInfo, init: RequestInit = {}, tryRefresh = true): Promise<Response> {
  let url = typeof input === 'string' && !input.startsWith('http') ? `${API_BASE_URL}${input}` : input;
  let access_token = localStorage.getItem('access_token');
  const headers = new Headers(init.headers || {});
  if (access_token) {
    headers.set('Authorization', `Bearer ${access_token}`);
  }
  let res = await fetch(url, { ...init, headers });
  if (res.status === 401 && tryRefresh) {
    // Try to refresh token
    const refresh_token = localStorage.getItem('refresh_token');
    if (refresh_token) {
      const refreshRes = await fetch(`${API_BASE_URL}/user/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token })
      });
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.access_token) {
        localStorage.setItem('access_token', refreshData.access_token);
        localStorage.setItem('refresh_token', refreshData.refresh_token);
        // Retry original request with new token
        headers.set('Authorization', `Bearer ${refreshData.access_token}`);
        res = await fetch(url, { ...init, headers });
      } else {
        // Refresh failed, clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }
  return res;
}
