import { Landmark } from 'lucide-react';

interface AppLogoProps {
  variant?: 'default' | 'light' | 'compact';
  className?: string;
}

export function AppLogo({ variant = 'default', className = '' }: AppLogoProps) {
  const isLight = variant === 'light';
  const isCompact = variant === 'compact';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Landmark className={`${
        isCompact ? 'h-5 w-5' : 'h-6 w-6'
      } ${
        isLight ? 'text-white' : 'text-primary'
      }`} />
      <h1 className={`${
        isCompact ? 'text-lg' : 'text-xl'
      } font-bold ${
        isLight ? 'text-white' : 'text-foreground'
      }`}>
        Tabungin
      </h1>
    </div>
  );
}
