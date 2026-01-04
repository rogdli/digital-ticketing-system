export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'OPERATOR';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  venue: string;
  address: string;
  date: string;
  totalTickets: number;
  availableTickets: number;
  price: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  eventId: string;
  quantity: number;
  totalAmount: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  event?: Event;
  payment?: Payment;
}

export interface Payment {
  id: string;
  orderId: string;
  mpPaymentId?: string;
  mpPreferenceId?: string;
  amount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  orderId: string;
  eventId: string;
  qrCode: string;
  status: 'PENDING' | 'ACTIVE' | 'SCANNED' | 'CANCELLED' | 'EXPIRED';
  scannedAt?: string;
  scannedBy?: string;
  createdAt: string;
  event?: Event;
  order?: Order;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}