import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, Users, FileText, Settings, Scan } from 'lucide-react';

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
    href: '/reports',
    title: 'Laporan',
    icon: FileText,
  },
  {
    href: '/settings',
    title: 'Pengaturan',
    icon: Settings,
  },
];
