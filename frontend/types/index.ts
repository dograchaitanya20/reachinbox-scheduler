export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export type EmailStatus = 'scheduled' | 'sending' | 'sent' | 'failed';

export interface Email {
  id: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  error: string | null;
  senderId: string;
  seq: number;
  updatedAt: string;
  sender?: {
    user: string;
  };
}

export interface Counts {
  scheduled: number;
  sent: number;
}

export interface Sender {
  id: string;
  user: string;
}

export interface SchedulePayload {
  subject: string;
  body: string;
  leads: string[];
  startTime: string;
  delaySec?: number;
  hourlyLimit?: number;
  senderId?: string;
}

export interface ScheduleResponse {
  scheduled: number;
  firstAt: string;
  lastAt: string;
}

export interface SlackStatus {
  connected: boolean;
}
