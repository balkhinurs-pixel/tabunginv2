import Image from 'next/image';

interface AppLogoProps {
  variant?: 'default' | 'light' | 'compact';
  className?: string;
}

export function AppLogo({ variant = 'default', className = '' }: AppLogoProps) {
  const isCompact = variant === 'compact';

  // The user will place a logo.png in the /public folder.
  return (
    <div className={className}>
      <Image
        src="/logo.png"
        alt="Tabungin Logo"
        width={isCompact ? 100 : 150}
        height={isCompact ? 25 : 30}
        className="object-contain"
        priority // Preload the logo as it's likely important for LCP
      />
    </div>
  );
}
