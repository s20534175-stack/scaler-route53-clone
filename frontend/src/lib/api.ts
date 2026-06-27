const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('r53_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return {} as T;

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    me: () => request<User>('/api/auth/me'),
  },
  zones: {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request<ZoneListResponse>(`/api/zones/?${q}`);
    },
    get: (zoneId: string) => request<Zone>(`/api/zones/${zoneId}`),
    create: (data: { name: string; comment?: string; type?: string }) =>
      request<Zone>('/api/zones/', { method: 'POST', body: JSON.stringify(data) }),
    update: (zoneId: string, data: { comment?: string; type?: string }) =>
      request<Zone>(`/api/zones/${zoneId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (zoneId: string) =>
      request(`/api/zones/${zoneId}`, { method: 'DELETE' }),
  },
  records: {
    list: (zoneId: string, params?: { search?: string; type_filter?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.type_filter) q.set('type_filter', params.type_filter);
      if (params?.page) q.set('page', String(params.page));
      return request<RecordListResponse>(`/api/zones/${zoneId}/records?${q}`);
    },
    create: (zoneId: string, data: RecordCreateData) =>
      request<DNSRecord>(`/api/zones/${zoneId}/records`, { method: 'POST', body: JSON.stringify(data) }),
    update: (zoneId: string, recordId: string, data: Partial<RecordCreateData>) =>
      request<DNSRecord>(`/api/zones/${zoneId}/records/${recordId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (zoneId: string, recordId: string) =>
      request(`/api/zones/${zoneId}/records/${recordId}`, { method: 'DELETE' }),
  },
};

export interface User { id: number; name: string; email: string; }
export interface Zone {
  id: number; zone_id: string; name: string; comment: string;
  type: string; record_count: number; created_at: string; updated_at: string;
}
export interface ZoneListResponse { zones: Zone[]; total: number; page: number; limit: number; pages: number; }
export interface DNSRecord {
  id: number; record_id: string; zone_id: string; name: string;
  type: string; value: string; ttl: number; routing_policy: string;
  comment: string; created_at: string; updated_at: string;
}
export interface RecordListResponse { records: DNSRecord[]; total: number; page: number; limit: number; pages: number; }
export interface RecordCreateData { name: string; type: string; value: string; ttl?: number; routing_policy?: string; comment?: string; }
