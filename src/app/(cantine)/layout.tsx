'use client';

import Header from '@/components/layout/Header';
import { 
  UtensilsCrossed, 
  History, 
  LayoutGrid, 
  LogOut 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

const CANTINE_NAV = [
    { title: 'Dashboard', icon: LayoutGrid, href: '/cantine/dashboard' },
    { title: 'History', icon: History, href: '/cantine/history' },
];

export default function CantineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 h-16 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-6">
            <h1 className="text-xl font-black tracking-tighter">
                Tabung<span className="text-primary">.in</span> <span className="text-xs opacity-50 uppercase tracking-widest font-bold">Kantin</span>
            </h1>
            <button onClick={handleLogout} className="text-rose-500 p-2 rounded-full hover:bg-rose-50">
                <LogOut className="h-5 w-5" />
            </button>
        </header>

        <main className="p-6 pb-32">
            {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 inset-x-0 h-20 bg-white border-t flex items-center justify-around px-8 z-50 sm:hidden">
            {CANTINE_NAV.map((item) => (
                <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        pathname === item.href ? "text-primary scale-110" : "text-gray-400"
                    )}
                >
                    <item.icon className="h-6 w-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.title}</span>
                </Link>
            ))}
            <Link 
                href="/cantine/payment"
                className="relative -top-6 h-16 w-16 bg-primary rounded-full shadow-xl flex items-center justify-center text-white border-4 border-white"
            >
                <ScanLine className="h-8 w-8" />
            </Link>
        </nav>
    </div>
  );
}