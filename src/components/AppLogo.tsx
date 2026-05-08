
import Image from 'next/image';

interface AppLogoProps {
  variant?: 'default' | 'light' | 'compact';
  className?: string;
}

export function AppLogo({ variant = 'default', className = '' }: AppLogoProps) {
  const isCompact = variant === 'compact';

  // Menggunakan logo192.png sesuai instruksi user untuk konsistensi aset PWA
  return (
    <div className={className}>
      <Image
        src="/logo192.png"
        alt="Tabungin Logo"
        width={isCompact ? 100 : 150}
        height={isCompact ? 30 : 40}
        className="object-contain"
        priority
      />
    </div>
  );
}
