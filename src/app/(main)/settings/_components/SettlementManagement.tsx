
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Banknote, 
  Loader2, 
  Store,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { getMerchantSettlementStatsAction, settleMerchantTransactionsAction } from '../actions';
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

export default function SettlementManagement() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
                  
                  {item.unsettledAmount > 0 ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold">
                          <Banknote className="mr-1 h-3 w-3" /> SERAH TERIMA UANG
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
