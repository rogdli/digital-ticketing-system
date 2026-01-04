'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi, ordersApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { Event } from '@/types';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Ticket as TicketIcon, Clock, Loader2, AlertCircle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvent();
  }, [params.id]);

  const loadEvent = async () => {
    try {
      const response = await eventsApi.getOne(params.id as string);
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to load event', error);
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!event) return;

    if (quantity > event.availableTickets) {
      alert('Not enough tickets available');
      return;
    }

    setPurchasing(true);
    setError('');

    try {
      const response = await ordersApi.create({
        eventId: event.id,
        quantity,
      });

      // Redirect to checkout
      router.push(`/checkout/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist</p>
          <Button onClick={() => router.push('/')}>Back to Events</Button>
        </div>
      </div>
    );
  }

  const totalPrice = Number(event.price) * quantity;
  const isSoldOut = event.availableTickets === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-purple-600 to-indigo-700">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TicketIcon className="h-32 w-32 text-white opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
          <Badge className="mb-4" variant={isSoldOut ? 'destructive' : 'secondary'}>
            {isSoldOut ? 'Sold Out' : `${event.availableTickets} tickets left`}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{event.title}</h1>
          <p className="text-xl text-white/90">{event.venue}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">About this event</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{event.description}</p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Date & Time</p>
                      <p className="text-gray-600">{formatDate(event.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-gray-600">{event.venue}</p>
                      <p className="text-gray-500 text-sm">{event.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <TicketIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Ticket Price</p>
                      <p className="text-2xl font-bold text-purple-600">{formatPrice(event.price)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Purchase Card */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Get Tickets</h3>
                  <p className="text-gray-600">Select quantity and proceed to checkout</p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                    {error}
                  </div>
                )}

                {!isSoldOut && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={Math.min(event.availableTickets, 10)}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum {Math.min(event.availableTickets, 10)} tickets per order
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Ticket Price</span>
                        <span className="font-medium">{formatPrice(event.price)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Quantity</span>
                        <span className="font-medium">× {quantity}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-bold">Total</span>
                          <span className="font-bold text-xl text-purple-600">
                            {formatPrice(totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={purchasing || isSoldOut}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isSoldOut ? (
                    'Sold Out'
                  ) : (
                    'Continue to Checkout'
                  )}
                </Button>

                {!isAuthenticated && (
                  <p className="text-xs text-center text-gray-500 mt-4">
                    You'll need to sign in to purchase tickets
                  </p>
                )}

                <div className="mt-6 pt-6 border-t space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Instant ticket delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TicketIcon className="h-4 w-4" />
                    <span>Mobile tickets available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}