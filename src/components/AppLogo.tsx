import { Landmark } from 'lucide-react';

export function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <Landmark className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-bold text-foreground">Tabungin</h1>
    </div>
  );
}
