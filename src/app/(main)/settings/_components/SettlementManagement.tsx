'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Banknote, 
  Loader2, 
  Store,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Printer
} from 'lucide-react';
import { getMerchantSettlementStatsAction, settleMerchantTransactionsAction, getUnsettledTransactionDetailsAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function SettlementManagement() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getMerchantSettlementStatsAction();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch settlement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePrintReceipt = async (merchantId: string, merchantName: string, amount: number) => {
    setPrintingId(merchantId);
    try {
        const details = await getUnsettledTransactionDetailsAction(merchantId);
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('BUKTI SERAH TERIMA OMZET KANTIN', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, pageWidth / 2, 27, { align: 'center' });
        doc.line(14, 32, pageWidth - 14, 32);

        // Merchant Info
        doc.setFontSize(11);
        doc.text(`Nama Outlet: ${merchantName}`, 14, 42);
        doc.text(`Status: BELUM DIBAYARKAN (MENUNGGU PENCAIRAN)`, 14, 48);

        // Table
        autoTable(doc, {
            startY: 55,
            head: [['TANGGAL', 'NIS', 'NAMA SISWA', 'KELAS', 'NOMINAL (RP)']],
            body: details.map((tx: any) => [
                format(new Date(tx.created_at), 'dd/MM/yy HH:mm'),
                tx.students?.nis,
                tx.students?.name,
                tx.students?.class,
                { content: tx.amount.toLocaleString('id-ID'), styles: { halign: 'right' } }
            ]),
            foot: [
                [{ content: 'TOTAL YANG HARUS DIBAYARKAN', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } }, 
                 { content: amount.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right' } }]
            ],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            footStyles: { fillColor: [241, 245, 249] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 20;

        // Signatures
        doc.text('Pihak Sekolah (Guru)', 40, finalY, { align: 'center' });
        doc.text('____________________', 40, finalY + 25, { align: 'center' });
        
        doc.text('Pengelola Kantin', pageWidth - 40, finalY, { align: 'center' });
        doc.text('____________________', pageWidth - 40, finalY + 25, { align: 'center' });

        doc.save(`settlement-${merchantName.toLowerCase()}-${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast({ title: "PDF Berhasil Dibuat" });
    } catch (error) {
        toast({ title: "Gagal membuat PDF", variant: "destructive" });
    } finally {
        setPrintingId(null);
    }
  };

  const handleSettle = async (merchantId: string) => {
    setProcessingId(merchantId);
    const result = await settleMerchantTransactionsAction(merchantId);
    setProcessingId(null);

    if (result.success) {
      toast({ title: "Settlement Berhasil", description: "Status omzet telah diperbarui menjadi Terbayar." });
      fetchStats();
    } else {
      toast({ title: "Gagal Proses", description: result.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <Info className="h-4 w-4 text-blue-700" />
        <AlertDescription className="text-xs">
            Halaman ini menampilkan total penjualan kantin yang <strong>uang fisiknya masih ada di tangan Anda (Guru)</strong>. Tekan tombol cairkan setelah Anda memberikan uang tunai kepada pengelola kantin.
        </AlertDescription>
      </Alert>

      {stats.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {stats.map((item) => (
            <Card key={item.merchantId} className="border-none shadow-sm bg-gray-50/50 rounded-2xl overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                    <Store className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-gray-900">{item.merchantName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Omzet Belum Cair</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <p className="font-black text-xl text-primary">
                    {item.unsettledAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </p>
                  
                  <div className="flex gap-2">
                    {item.unsettledAmount > 0 && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 rounded-full text-[10px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => handlePrintReceipt(item.merchantId, item.merchantName, item.unsettledAmount)}
                            disabled={printingId === item.merchantId}
                        >
                            {printingId === item.merchantId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="mr-1 h-3 w-3" />} CETAK RINCIAN
                        </Button>
                    )}

                    {item.unsettledAmount > 0 ? (
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" className="h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold">
                            <Banknote className="mr-1 h-3 w-3" /> CAIRKAN
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <div className="flex items-center gap-2 text-emerald-600 mb-2">
                                <CheckCircle2 className="h-6 w-6" />
                                <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription>
                                Apakah Anda sudah menyerahkan uang tunai sebesar <strong>{item.unsettledAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</strong> kepada <strong>{item.merchantName}</strong>? 
                                <br/><br/>
                                Status omzet di dashboard kantin akan kembali ke nol setelah konfirmasi ini.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Belum</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleSettle(item.merchantId)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                Ya, Sudah Saya Bayar
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Lunas
                        </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-[2rem] border-gray-100">
          <Banknote className="h-10 w-10 mx-auto text-gray-200 mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Belum ada data transaksi kantin untuk diproses.</p>
        </div>
      )}
    </div>
  );
}
