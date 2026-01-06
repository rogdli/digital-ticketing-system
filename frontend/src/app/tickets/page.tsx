'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketsApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { Ticket } from '@/types';
import Navbar from '@/components/layout/Navbar';
import TicketCard from '@/components/tickets/TicketCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Ticket as TicketIcon, AlertCircle } from 'lucide-react';

export default function MyTicketsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadTickets();
  }, [isAuthenticated]);

  const loadTickets = async () => {
    try {
      const response = await ticketsApi.getMyTickets();
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to load tickets', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
          <p className="text-gray-600">View and manage your event tickets</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[400px]" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <TicketIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No tickets yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't purchased any tickets. Browse events and get your tickets!
            </p>
            <Button onClick={() => router.push('/')}>Browse Events</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}