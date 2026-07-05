
'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  TrendingUp, 
  ArrowLeft,
  Calendar,
  ChevronRight,
  Download,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CantineHistoryPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('school_name').eq('id', user.id).single();
        setMerchantName(profile?.school_name || user.email?.split('@')[0].toUpperCase() || 'KANTIN');

        const { data } = await supabase
            .from('transactions')
            .select(`
                *, 
                students (
                    name, 
                    class, 
                    nis
                )
            `)
            .eq('user_id', user.id)
            .eq('category', 'BELANJA_KANTIN')
            .order('created_at', { ascending: false });

        if (data) setTransactions(data);
        setLoading(false);
    };
    fetchHistory();
  }, [supabase]);

  const handlePrintReport = () => {
    if (transactions.length === 0) return;
    setPrinting(true);
    
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN PENJUALAN MERCHANT', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Outlet: ${merchantName}`, 14, 30);
        doc.text(`Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 35);

        const totalOmzet = transactions.reduce((acc, curr) => acc + curr.amount, 0);
        const totalUnsettled = transactions.filter(tx => !tx.is_settled).reduce((acc, curr) => acc + curr.amount, 0);

        autoTable(doc, {
            startY: 45,
            head: [['TANGGAL', 'NAMA SISWA', 'KELAS', 'STATUS', 'NOMINAL (RP)']],
            body: transactions.map(tx => [
                format(new Date(tx.created_at), 'dd/MM/yy HH:mm'),
                tx.students?.name || 'Siswa',
                tx.students?.class || '-',
                tx.is_settled ? 'LUNAS' : 'BELUM CAIR',
                { content: tx.amount.toLocaleString('id-ID'), styles: { halign: 'right' } }
            ]),
            foot: [
                [{ content: 'RINGKASAN TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } }, 
                 { content: totalOmzet.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right' } }],
                [{ content: 'TOTAL BELUM CAIR (PIUTANG)', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', textColor: [180, 0, 0] } }, 
                 { content: totalUnsettled.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right', textColor: [180, 0, 0] } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [249, 115, 22] }
        });

        doc.save(`laporan-penjualan-${merchantName.toLowerCase()}.pdf`);
        toast({ title: "Laporan PDF Berhasil Diunduh" });
    } catch (error) {
        toast({ title: "Gagal membuat laporan", variant: "destructive" });
    } finally {
        setPrinting(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.students?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.students?.nis?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-50" asChild>
                <Link href="/cantine/outlet"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h2 className="text-xl font-black tracking-tight">Riwayat Penjualan</h2>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-orange-200 text-orange-600 font-bold text-xs h-9"
            onClick={handlePrintReport}
            disabled={loading || transactions.length === 0 || printing}
        >
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />} CETAK PDF
        </Button>
      </div>

      <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Cari nama siswa atau NIS..." 
            className="pl-11 h-14 rounded-[1.5rem] border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 transition-all text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="space-y-4">
        {loading ? (
            <div className="py-20 text-center animate-pulse space-y-4">
                <div className="h-20 w-full bg-gray-50 rounded-[2rem]" />
                <div className="h-20 w-full bg-gray-50 rounded-[2rem]" />
                <div className="h-20 w-full bg-gray-50 rounded-[2rem]" />
            </div>
        ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
                <Card key={tx.id} className="border-none shadow-sm rounded-[2rem] overflow-hidden group active:scale-[0.98] transition-all bg-white border border-gray-50">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <TrendingUp className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div className="flex flex-col">
                                <p className="font-black text-gray-900 leading-tight">
                                    {tx.students?.name || 'Siswa (Butuh Izin SQL)'}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(tx.created_at), 'dd MMM yyyy • HH:mm', { locale: id })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-emerald-600 text-lg">
                                +{tx.amount.toLocaleString('id-ID')}
                            </p>
                            <p className={cn(
                                "text-[8px] font-black uppercase tracking-[0.2em]",
                                tx.is_settled ? "text-blue-500" : "text-amber-500"
                            )}>
                                {tx.is_settled ? 'Lunas' : 'Belum Cair'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))
        ) : (
            <div className="py-24 text-center text-muted-foreground space-y-4 border-2 border-dashed border-gray-100 rounded-[3rem]">
                <History className="h-14 w-14 mx-auto opacity-10" />
                <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-gray-300">Kosong</p>
                    <p className="text-xs font-medium text-gray-400">Belum ada transaksi yang ditemukan.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
