'use client';

import Link from 'next/link';
import { Event } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-gradient-to-br from-purple-400 to-indigo-600 relative">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket className="h-16 w-16 text-white opacity-50" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-xl mb-2 line-clamp-1">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{event.venue}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{formatPrice(event.price)}</p>
            <p className="text-xs text-gray-500">
              {event.availableTickets} tickets left
            </p>
          </div>
          {event.availableTickets > 0 ? (
            <Badge variant="secondary">Available</Badge>
          ) : (
            <Badge variant="destructive">Sold Out</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link href={`/events/${event.id}`} className="w-full">
          <Button className="w-full" disabled={event.availableTickets === 0}>
            {event.availableTickets > 0 ? 'View Details' : 'Sold Out'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}