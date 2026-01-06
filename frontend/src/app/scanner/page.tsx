'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ticketsApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ScanLine, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Calendar,
  MapPin,
  User,
  Ticket as TicketIcon
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ValidationResult {
  valid: boolean;
  message: string;
  ticket?: any;
  scannedAt?: string;
  scannedBy?: string;
}

export default function ScannerPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [qrCode, setQrCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrCode.trim()) {
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      const response = await ticketsApi.validate(qrCode);
      setResult(response.data);
      
      // Clear input and focus for next scan
      setQrCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: any) {
      setResult({
        valid: false,
        message: err.response?.data?.message || 'Invalid QR code',
      });
      setQrCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setScanning(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setQrCode('');
    inputRef.current?.focus();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the scanner</p>
          <Button onClick={() => router.push('/auth/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScanLine className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ticket Scanner</h1>
          <p className="text-gray-300">Scan QR codes to validate event tickets</p>
        </div>

        {/* Scanner Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Scan Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <Label htmlFor="qrCode">QR Code Data</Label>
                <Input
                  ref={inputRef}
                  id="qrCode"
                  type="text"
                  placeholder="Paste or scan QR code here..."
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  disabled={scanning}
                  autoFocus
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the QR code content or use a barcode scanner
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={scanning || !qrCode.trim()}
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-2 h-4 w-4" />
                      Validate Ticket
                    </>
                  )}
                </Button>
                {result && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Validation Result */}
        {result && (
          <Card className={`${
            result.valid 
              ? 'border-green-500 bg-green-50' 
              : 'border-red-500 bg-red-50'
          } border-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-300`}>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                {result.valid ? (
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600 mx-auto mb-3" />
                )}
                <h3 className={`text-2xl font-bold mb-2 ${
                  result.valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.valid ? 'Valid Ticket ✓' : 'Invalid Ticket'}
                </h3>
                <p className={`text-lg ${
                  result.valid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
              </div>

              {result.ticket && (
                <>
                  <Separator className="my-4" />
                  
                  {/* Event Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-lg mb-3">Event Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <TicketIcon className="h-5 w-5 text-gray-600 mt-0.5" />
                          <div>
                            <p className="font-semibold">{result.ticket.event?.title}</p>
                            <p className="text-sm text-gray-600">{result.ticket.event?.venue}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-600" />
                          <p className="text-sm">{formatDate(result.ticket.event?.date)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-600" />
                          <p className="text-sm">{result.ticket.event?.address}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Ticket Details */}
                    <div>
                      <h4 className="font-bold text-lg mb-3">Ticket Information</h4>
                      <div className="bg-white p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ticket Number:</span>
                          <span className="font-mono font-medium">{result.ticket.ticketNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={result.ticket.status === 'SCANNED' ? 'default' : 'secondary'}>
                            {result.ticket.status}
                          </Badge>
                        </div>
                        {result.ticket.order?.user && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Attendee:</span>
                            <span className="font-medium">
                              {result.ticket.order.user.firstName} {result.ticket.order.user.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scan Info */}
                    {result.scannedAt && (
                      <>
                        <Separator />
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <h4 className="font-bold text-sm text-blue-900 mb-2">Previous Scan</h4>
                          <div className="space-y-1 text-sm text-blue-800">
                            <p>Scanned at: {new Date(result.scannedAt).toLocaleString()}</p>
                            {result.scannedBy && <p>Scanned by: {result.scannedBy}</p>}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!result && (
          <Card className="bg-slate-800 text-white border-slate-700">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                How to use
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Open a ticket and copy its QR code data</li>
                <li>• Paste it in the input field above</li>
                <li>• Click "Validate Ticket" to check authenticity</li>
                <li>• Green = Valid entry | Red = Invalid/Already used</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}