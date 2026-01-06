'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Ticket, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();

  // Sync auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr && !isAuthenticated) {
      const userData = JSON.parse(userStr);
      useAuthStore.getState().setAuth(userData, token);
    }
  }, [isAuthenticated]);

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-purple-600 transition-colors">
          <Ticket className="h-6 w-6" />
          Ticketing
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/tickets">
                <Button variant="ghost">My Tickets</Button>
              </Link>
              <Link href="/orders">
                <Button variant="ghost">My Orders</Button>
              </Link>
              <Link href="/scanner">
                <Button variant="ghost">Scanner</Button>
              </Link>
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
                <User className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">{user?.firstName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-purple-600 hover:bg-purple-700">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}