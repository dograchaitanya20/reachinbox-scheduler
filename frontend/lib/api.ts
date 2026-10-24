import type {
  User,
  Email,
  Counts,
  Sender,
  SchedulePayload,
  ScheduleResponse,
  SlackStatus,
} from '@/types';

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: string }).error)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}

export const api = {
  getMe(): Promise<User> {
    return request<User>('/api/me');
  },

  logout(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  getEmails(status?: 'sent'): Promise<Email[]> {
    const query = status ? `?status=${status}` : '';
    return request<Email[]>(`/api/emails${query}`);
  },

  getEmail(id: string): Promise<Email> {
    return request<Email>(`/api/emails/${encodeURIComponent(id)}`);
  },

  getCounts(): Promise<Counts> {
    return request<Counts>('/api/counts');
  },

  getSenders(): Promise<Sender[]> {
    return request<Sender[]>('/api/senders');
  },

  searchEmails(q: string): Promise<Email[]> {
    return request<Email[]>(`/api/search?q=${encodeURIComponent(q)}`);
  },

  scheduleEmails(payload: SchedulePayload): Promise<ScheduleResponse> {
    return request<ScheduleResponse>('/api/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getSlackStatus(): Promise<SlackStatus> {
    return request<SlackStatus>('/api/slack/status');
  },

  disconnectSlack(): Promise<void> {
    return request<void>('/api/slack', { method: 'DELETE' });
  },
};

export { ApiError };
