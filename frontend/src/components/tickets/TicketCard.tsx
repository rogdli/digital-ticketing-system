'use client';

import { useState } from 'react';
import { Ticket } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Ticket as TicketIcon, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import QRCode from 'react-qr-code';

interface TicketCardProps {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const [showQR, setShowQR] = useState(false);

  const getStatusColor = () => {
    switch (ticket.status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'SCANNED':
        return 'bg-blue-500';
      case 'CANCELLED':
        return 'bg-red-500';
      case 'EXPIRED':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusIcon = () => {
    switch (ticket.status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4" />;
      case 'SCANNED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      case 'EXPIRED':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-48 bg-gradient-to-br from-purple-500 to-indigo-600 relative">
          {ticket.event?.imageUrl ? (
            <img
              src={ticket.event.imageUrl}
              alt={ticket.event.title}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TicketIcon className="h-16 w-16 text-white opacity-50" />
            </div>
          )}
          <div className="absolute top-4 right-4">
            <Badge className={getStatusColor()}>
              <span className="flex items-center gap-1">
                {getStatusIcon()}
                {ticket.status}
              </span>
            </Badge>
          </div>
        </div>

        <CardHeader>
          <h3 className="font-bold text-xl line-clamp-2">{ticket.event?.title}</h3>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{ticket.event && formatDate(ticket.event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{ticket.event?.venue}</span>
          </div>
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500">Ticket Number</p>
            <p className="font-mono text-sm font-medium">{ticket.ticketNumber}</p>
          </div>
          {ticket.scannedAt && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Scanned</p>
              <p className="text-xs text-blue-800">
                {new Date(ticket.scannedAt).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={() => setShowQR(true)}
            disabled={ticket.status === 'CANCELLED' || ticket.status === 'EXPIRED'}
          >
            <TicketIcon className="mr-2 h-4 w-4" />
            View QR Code
          </Button>
        </CardFooter>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Ticket</DialogTitle>
            <DialogDescription>
              Show this QR code at the event entrance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-bold">{ticket.event?.title}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{ticket.event && formatDate(ticket.event.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{ticket.event?.venue}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex justify-center">
              <QRCode
                value={ticket.qrCode}
                size={256}
                level="H"
                className="max-w-full h-auto"
              />
            </div>

            {/* Ticket Info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">Ticket Number</p>
              <p className="font-mono text-sm font-medium">{ticket.ticketNumber}</p>
            </div>

            {ticket.status === 'SCANNED' && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-blue-900">Already Scanned</p>
                <p className="text-xs text-blue-700">
                  {new Date(ticket.scannedAt!).toLocaleString()}
                </p>
              </div>
            )}

            <p className="text-xs text-center text-gray-500">
              Keep this QR code safe. Do not share it with anyone.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}