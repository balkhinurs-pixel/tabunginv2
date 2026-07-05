'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Filter,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';

export default function CantineHistoryPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('transactions')
            .select(`*, students(name, class, nis)`)
            .eq('user_id', user.id)
            .eq('category', 'BELANJA_KANTIN')
            .order('created_at', { ascending: false });

        if (data) setTransactions(data);
        setLoading(false);
    };
    fetchHistory();
  }, [supabase]);

  const filteredTransactions = transactions.filter(tx => 
    tx.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.students?.nis.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/cantine/dashboard"><ArrowLeft /></Link>
        </Button>
        <h2 className="text-xl font-black tracking-tight">Riwayat Penjualan</h2>
      </div>

      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Cari nama siswa atau NIS..." 
            className="pl-10 h-12 rounded-2xl border-gray-100 bg-gray-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="space-y-4">
        {loading ? (
            <div className="py-20 text-center animate-pulse">
                <p className="text-sm text-muted-foreground font-bold">Memuat data...</p>
            </div>
        ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
                <Card key={tx.id} className="border-none shadow-sm rounded-3xl overflow-hidden group active:scale-[0.98] transition-all">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <TrendingUp className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-black text-gray-900">{tx.students?.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    <span>{format(new Date(tx.created_at), 'dd MMM yyyy • HH:mm', { locale: id })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-emerald-600 text-lg">
                                +{tx.amount.toLocaleString('id-ID')}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Berhasil</p>
                        </div>
                    </CardContent>
                </Card>
            ))
        ) : (
            <div className="py-20 text-center text-muted-foreground space-y-4">
                <History className="h-12 w-12 mx-auto opacity-10" />
                <p className="text-sm font-medium">Tidak ada riwayat transaksi yang ditemukan.</p>
            </div>
        )}
      </div>
    </div>
  );
}
