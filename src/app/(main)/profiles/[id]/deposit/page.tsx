
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, BookOpen, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AddDepositPageProps {
    params: {
        id: string;
    };
}

export default function AddDepositPage({ params }: AddDepositPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState(''); 
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const studentId = params.id;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hanya ambil angka murni agar stabil di mobile
    const rawValue = e.target.value.replace(/\D/g, '');
    setAmount(rawValue);
  };

  const formatCurrency = (val: string) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    
    if (!numericAmount || numericAmount <= 0) {
        toast({
            title: 'Jumlah Tidak Valid',
            description: 'Mohon masukkan jumlah yang valid.',
            variant: 'destructive',
        });
        return;
    }

    if (!date) {
        toast({
            title: 'Tanggal Tidak Valid',
            description: 'Mohon pilih tanggal transaksi.',
            variant: 'destructive',
        });
        return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('transactions')
      .insert({ 
        student_id: studentId,
        user_id: user?.id,
        amount: numericAmount, 
        description,
        created_at: date.toISOString(),
        type: 'Pemasukan'
    });
    
    setLoading(false);

    if (error) {
        toast({
            title: 'Gagal Menyimpan Transaksi',
            description: error.message,
            variant: 'destructive',
        });
    } else {
        toast({
            title: 'Transaksi Berhasil',
            description: `Setoran sebesar ${formatCurrency(amount)} telah disimpan.`,
        });
        router.push(`/profiles/${studentId}`);
        router.refresh(); 
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="pl-0">
        <Link href={`/profiles/${studentId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Profil
        </Link>
      </Button>

      <Card className="border-none shadow-xl overflow-hidden">
        <div className="bg-green-500 p-4 text-white text-center">
            <Banknote className="h-10 w-10 mx-auto mb-2 opacity-80" />
            <h1 className="text-xl font-bold">Input Setoran Siswa</h1>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Tanggal Transaksi</Label>
               <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 border-gray-200",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={id}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-3">
              <Label htmlFor="amount" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Jumlah Setoran</Label>
              
              {/* Live Preview di atas input agar lebih mudah dikontrol secara visual */}
              <div className={cn(
                  "p-3 rounded-xl border text-center transition-all duration-300",
                  amount ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100 opacity-50"
              )}>
                  <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Konfirmasi Nominal</p>
                  <p className="text-2xl font-black text-green-600 truncate">
                      {formatCurrency(amount)}
                  </p>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground font-bold">Rp</span>
                <Input 
                  id="amount" 
                  type="text" 
                  inputMode="numeric"
                  placeholder="Masukkan saldo... (Contoh: 50000)" 
                  className="pl-10 h-14 text-xl font-bold border-gray-200 focus:ring-green-500" 
                  value={amount}
                  onChange={handleAmountChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Keterangan / Catatan</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="description" 
                  placeholder="Contoh: Tabungan mingguan" 
                  className="pl-10 h-12 border-gray-200" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white h-14 text-lg font-bold shadow-lg shadow-green-200" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Banknote className="mr-2 h-5 w-5" />}
              Simpan Setoran
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
