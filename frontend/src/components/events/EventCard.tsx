'use client';

import Link from 'next/link';
import { Event } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Ticket, TrendingUp } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const soldPercentage = ((event.totalTickets - event.availableTickets) / event.totalTickets) * 100;
  const isHot = soldPercentage > 70;

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="h-48 bg-gradient-to-br from-purple-400 to-indigo-600 relative overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket className="h-16 w-16 text-white opacity-50 group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Hot Badge */}
        {isHot && event.availableTickets > 0 && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-500 text-white animate-pulse">
              <TrendingUp className="h-3 w-3 mr-1" />
              Selling Fast
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {event.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 text-purple-600" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {event.availableTickets < event.totalTickets && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Tickets sold</span>
              <span>{soldPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${soldPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-purple-600">{formatPrice(event.price)}</p>
            <p className="text-xs text-gray-500">
              {event.availableTickets} of {event.totalTickets} left
            </p>
          </div>
          {event.availableTickets > 0 ? (
            <Badge variant="secondary" className="bg-green-100 text-green-700">Available</Badge>
          ) : (
            <Badge variant="destructive">Sold Out</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Link href={`/events/${event.id}`} className="w-full">
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" 
            disabled={event.availableTickets === 0}
          >
            {event.availableTickets > 0 ? 'View Details' : 'Sold Out'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}