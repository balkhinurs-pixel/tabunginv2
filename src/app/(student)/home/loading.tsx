
import { Loader2 } from 'lucide-react';

export default function StudentLoading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center space-y-4">
      <div className="relative">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-primary/20"></div>
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Menyiapkan dashboard Anda...</p>
    </div>
  );
}
