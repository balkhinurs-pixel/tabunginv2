
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, BookOpen } from 'lucide-react';
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
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
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
            description: `Setoran sebesar ${numericAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} telah disimpan.`,
        });
        router.push(`/profiles/${studentId}`);
        router.refresh(); // Refresh server-side data
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

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="text-2xl font-bold text-center">Form Input Pemasukan</h1>
            
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
               <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
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

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">Rp</span>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="Contoh: 50000" 
                  className="pl-8" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Keterangan</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="description" 
                  placeholder="Contoh: Setoran mingguan" 
                  className="pl-10" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white h-12" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Transaksi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
