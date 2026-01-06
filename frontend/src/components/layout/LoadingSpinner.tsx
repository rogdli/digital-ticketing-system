import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}