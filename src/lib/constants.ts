import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ArrowLeftRight, Users, FileText } from 'lucide-react';

interface NavItem {
  href: string;
  title: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/transactions',
    title: 'Transactions',
    icon: ArrowLeftRight,
  },
  {
    href: '/profiles',
    title: 'Profiles',
    icon: Users,
  },
  {
    href: '/reports',
    title: 'Reports',
    icon: FileText,
  },
];
