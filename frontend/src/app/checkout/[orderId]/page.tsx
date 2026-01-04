'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi, paymentsApi } from '@/services/api';
import { Order } from '@/types';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Ticket, Clock, CheckCircle, XCircle, Loader2, CreditCard } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [params.orderId]);

  const loadOrder = async () => {
    try {
      const response = await ordersApi.getOne(params.orderId as string);
      setOrder(response.data);

      // If order already paid, redirect to tickets
      if (response.data.status === 'PAID') {
        router.push('/tickets');
      }
    } catch (error) {
      console.error('Failed to load order', error);
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    setProcessingPayment(true);
    setError('');

    try {
      const response = await paymentsApi.createPreference(order.id);

      // Open MercadoPago checkout in new tab
      window.open(response.data.sandboxInitPoint, '_blank');

      // Show instructions
      alert(
        'MercadoPago checkout opened in a new tab.\n\n' +
        'Test Card:\n' +
        'Card Number: 5031 7557 3453 0604\n' +
        'CVV: 123\n' +
        'Expiry: Any future date\n' +
        'Name: Any name\n\n' +
        'After payment, close the tab and return here.'
      );

      // Poll for payment status
      startPolling();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await ordersApi.getOne(params.orderId as string);
        if (response.data.status === 'PAID') {
          clearInterval(interval);
          router.push('/tickets');
        }
      } catch (error) {
        console.error('Polling error', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await ordersApi.cancel(order.id);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist</p>
          <Button onClick={() => router.push('/')}>Back to Events</Button>
        </div>
      </div>
    );
  }

  // Check if order expired
  const isExpired = order.expiresAt && new Date(order.expiresAt) < new Date();
  const timeLeft = order.expiresAt 
    ? Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000 / 60))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase to get your tickets</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Status</CardTitle>
                  <Badge variant={order.status === 'PENDING' ? 'secondary' : 'default'}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Number</span>
                    <span className="font-mono font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  {!isExpired && timeLeft > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900">Complete payment soon</p>
                        <p className="text-sm text-amber-700">
                          Order expires in {timeLeft} minutes
                        </p>
                      </div>
                    </div>
                  )}
                  {isExpired && (
                    <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Order Expired</p>
                        <p className="text-sm text-red-700">
                          This order has expired. Please create a new one.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            {order.event && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-xl mb-2">{order.event.title}</h3>
                      <p className="text-gray-600">{order.event.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{formatDate(order.event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{order.event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Ticket className="h-4 w-4" />
                        <span className="text-sm">{order.quantity} ticket(s)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Card */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Price</span>
                    <span>{order.event && formatPrice(order.event.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity</span>
                    <span>× {order.quantity}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-2xl text-purple-600">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {order.status === 'PENDING' && !isExpired && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePayment}
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay with MercadoPago
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCancelOrder}
                    >
                      Cancel Order
                    </Button>
                  </>
                )}

                {isExpired && (
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/events/${order.eventId}`)}
                  >
                    Create New Order
                  </Button>
                )}

                <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
                  <p>✓ Secure payment via MercadoPago</p>
                  <p>✓ Instant ticket delivery</p>
                  <p>✓ Tickets sent to your email</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}