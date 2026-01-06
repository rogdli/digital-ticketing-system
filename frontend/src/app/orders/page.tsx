'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { Order } from '@/types';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingBag, 
  Calendar, 
  MapPin, 
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Ticket
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadOrders();
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      const response = await ordersApi.getMyOrders(1, 20);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'CANCELLED':
        return 'bg-red-500';
      case 'EXPIRED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-purple-600" />
            My Orders
          </h1>
          <p className="text-gray-600">View your order history and track purchases</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't made any purchases. Start by browsing events!
              </p>
              <Button onClick={() => router.push('/')}>Browse Events</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 mb-2">
                        Order #{order.orderNumber.slice(-8).toUpperCase()}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white w-fit`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Event Info */}
                  {order.event && (
                    <div className="mb-6">
                      <div className="flex gap-4">
                        {/* Event Image */}
                        <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg overflow-hidden">
                          {order.event.imageUrl ? (
                            <img
                              src={order.event.imageUrl}
                              alt={order.event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Ticket className="h-10 w-10 text-white opacity-50" />
                            </div>
                          )}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">{order.event.title}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{order.event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ticket className="h-4 w-4" />
                              <span>{order.quantity} ticket(s)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Order Summary */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Payment Info */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Details
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ticket Price:</span>
                          <span>{order.event && formatPrice(order.event.price)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span>× {order.quantity}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-purple-600 text-lg">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>
                        {order.payment && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500">
                              Payment Status:{' '}
                              <span className="font-medium text-gray-700">
                                {order.payment.status}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Status */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Order Timeline
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Order Created</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {order.status === 'PAID' && (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Payment Confirmed</p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {order.status === 'PENDING' && (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                              <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Awaiting Payment</p>
                              <p className="text-xs text-gray-500">
                                Expires: {order.expiresAt && new Date(order.expiresAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {(order.status === 'CANCELLED' || order.status === 'EXPIRED') && (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Order {order.status}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50 p-4 flex gap-2">
                  {order.status === 'PENDING' && (
                    <Link href={`/checkout/${order.id}`} className="flex-1">
                      <Button className="w-full" variant="default">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Complete Payment
                      </Button>
                    </Link>
                  )}
                  {order.status === 'PAID' && (
                    <Link href="/tickets" className="flex-1">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Ticket className="mr-2 h-4 w-4" />
                        View Tickets
                      </Button>
                    </Link>
                  )}
                  <Link href={`/events/${order.eventId}`}>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View Event
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}