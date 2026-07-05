import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, Users, FileText, Settings, Scan, Banknote } from 'lucide-react';

interface NavItem {
  href: string;
  title: string;
  icon: LucideIcon;
  isCentral?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    title: 'Beranda',
    icon: LayoutGrid,
  },
  {
    href: '/profiles',
    title: 'Siswa',
    icon: Users,
  },
  {
    href: '/transactions',
    title: 'Scan',
    icon: Scan,
    isCentral: true,
  },
  {
    href: '/settlement',
    title: 'Keuangan',
    icon: Banknote,
  },
  {
    href: '/settings',
    title: 'Pengaturan',
    icon: Settings,
  },
];
