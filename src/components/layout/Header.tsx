
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import type { Student } from '@/types';
import { supabase } from '@/lib/supabase';


export default function Header() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
        setLoading(true);
        // This is a simplified calculation. For large datasets, 
        // a dedicated database function (RPC) would be more efficient.
        const { data, error } = await supabase.from('transactions').select('type, amount');

        if (error) {
            console.error("Failed to fetch total balance:", error);
        } else {
            const balance = data.reduce((acc, tx) => {
                return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
            }, 0);
            setTotalBalance(balance);
        }
        setLoading(false);
    }
    fetchBalance();

    const channel = supabase.channel('realtime-transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchBalance)
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }

  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6 md:hidden">
        {loading ? (
            <div className="h-7 w-32 rounded-md animate-pulse bg-gray-200" />
        ) : (
            <div className="font-bold text-lg">{totalBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</div>
        )}
      <div className='flex items-center gap-2'>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Image
                src="https://picsum.photos/36/36"
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden rounded-full"
                data-ai-hint="user avatar"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Pengaturan</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Dukungan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/login">Keluar</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
