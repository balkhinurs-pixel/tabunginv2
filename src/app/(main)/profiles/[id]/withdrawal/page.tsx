
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
import { useStudent } from '@/context/StudentContext';
import { useToast } from '@/hooks/use-toast';

export default function WithdrawalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { getStudentById, addTransaction } = useStudent();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const studentId = params.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    const student = getStudentById(studentId);

    if (!student) {
        toast({ title: 'Siswa tidak ditemukan', variant: 'destructive' });
        return;
    }
    
    const balance = student.transactions.reduce((acc, tx) => acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount), 0);

    if (!numericAmount || numericAmount <= 0) {
        toast({
            title: 'Jumlah Tidak Valid',
            description: 'Mohon masukkan jumlah yang valid.',
            variant: 'destructive',
        });
        return;
    }
    
    if (numericAmount > balance) {
        toast({
            title: 'Saldo Tidak Cukup',
            description: `Saldo akhir tidak mencukupi untuk penarikan ini. Saldo saat ini: ${balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`,
            variant: 'destructive',
        });
        return;
    }

    addTransaction(studentId, { amount: numericAmount, description }, 'Pengeluaran');
    
    toast({
        title: 'Transaksi Berhasil',
        description: `Penarikan sebesar ${numericAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} telah disimpan.`,
    });

    router.push(`/profiles/${studentId}`);
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
            <h1 className="text-2xl font-bold text-center">Form Input Pengeluaran</h1>
            
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
                      disabled
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
                  placeholder="Contoh: 20000" 
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
                  placeholder="Contoh: Jajan" 
                  className="pl-10" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white h-12">
              Simpan Transaksi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
