import api from '@/lib/axios';
import { Event, Order, Ticket, AuthResponse } from '@/types';

// Auth
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
};

// Events
export const eventsApi = {
  getPublished: (page = 1, limit = 10) =>
    api.get<{ data: Event[]; meta: any }>('/events/published', {
      params: { page, limit },
    }),

  getOne: (id: string) => api.get<Event>(`/events/${id}`),
};

// Orders
export const ordersApi = {
  create: (data: { eventId: string; quantity: number }) =>
    api.post<Order>('/orders', data),

  getMyOrders: (page = 1, limit = 10) =>
    api.get<{ data: Order[]; meta: any }>('/orders/my-orders', {
      params: { page, limit },
    }),

  getOne: (id: string) => api.get<Order>(`/orders/${id}`),

  cancel: (id: string) => api.delete(`/orders/${id}`),
};

// Payments
export const paymentsApi = {
  createPreference: (orderId: string) =>
    api.post<{
      preferenceId: string;
      initPoint: string;
      sandboxInitPoint: string;
      orderId: string;
      orderNumber: string;
    }>('/payments/create-preference', { orderId }),

  getStatus: (orderId: string) => api.get(`/payments/${orderId}`),
};

// Tickets
export const ticketsApi = {
  getMyTickets: () => api.get<Ticket[]>('/tickets/my-tickets'),

  getOne: (id: string) => api.get<Ticket>(`/tickets/${id}`),

  validate: (qrCode: string) =>
    api.post<{
      valid: boolean;
      message: string;
      ticket: Ticket;
      scannedAt?: string;
      scannedBy?: string;
    }>('/tickets/validate', { qrCode }),

  preview: (qrCode: string) => api.post<Ticket>('/tickets/preview', { qrCode }),
};