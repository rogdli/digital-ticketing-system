'use client';

import { useEffect, useState } from 'react';
import { eventsApi } from '@/services/api';
import { Event } from '@/types';
import Navbar from '@/components/layout/Navbar';
import EventCard from '@/components/events/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Calendar, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsApi.getPublished(1, 20);
      setEvents(response.data.data);
    } catch (error) {
      console.error('Failed to load events', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Digital Ticketing Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Events
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8">
              Secure tickets, instant delivery, seamless entry
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search events by name or venue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">{events.length}</p>
            <p className="text-gray-600">Active Events</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">100%</p>
            <p className="text-gray-600">Secure Tickets</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">Instant</p>
            <p className="text-gray-600">Delivery</p>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <main className="container mx-auto px-4 pb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {searchTerm ? `Search Results (${filteredEvents.length})` : 'Upcoming Events'}
          </h2>
          <p className="text-gray-600">
            {searchTerm ? `Showing results for "${searchTerm}"` : 'Browse and book tickets for amazing events'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[450px] rounded-xl" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">
              {searchTerm ? 'No events found' : 'No events available'}
            </p>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try a different search term' : 'Check back soon for new events'}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')} variant="outline">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 Ticketing System. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-2">Secure digital ticketing & access control</p>
        </div>
      </footer>
    </div>
  );
}