
'use client';

import { useState, useEffect, useRef } from 'react';
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
import type { Student } from '@/types';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface WithdrawPageProps {
    params: {
        id: string;
    };
}

export default function WithdrawPage({ params }: WithdrawPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState(''); 
  const [description, setDescription] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const studentId = params.id;

  const inputRef = useRef<HTMLInputElement>(null);
  const [prevCursorDigits, setPrevCursorDigits] = useState<number | null>(null);

  useEffect(() => {
    if (inputRef.current && prevCursorDigits !== null) {
      const formatted = formatDisplayAmount(amount);
      let newPos = 0;
      let digitCount = 0;
      
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++;
        }
        newPos = i + 1;
        if (digitCount === prevCursorDigits) break;
      }
      
      inputRef.current.setSelectionRange(newPos, newPos);
    }
  }, [amount, prevCursorDigits]);

  useEffect(() => {
    const fetchStudentData = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast({ title: 'Anda tidak login', variant: 'destructive' });
            return;
        }

        const { data, error } = await supabase
            .from('students')
            .select(`*, transactions(*)`)
            .eq('id', studentId)
            .limit(1)
            .single();
        
        if (error) {
            toast({ title: 'Siswa tidak ditemukan', variant: 'destructive' });
        } else {
            setStudent(data as Student);
        }
    };

    fetchStudentData();
  }, [studentId, toast, supabase]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const value = input.value;
    const selectionStart = input.selectionStart || 0;

    const digitsBefore = value.slice(0, selectionStart).replace(/\D/g, '').length;

    let rawValue = value.replace(/\D/g, '');
    
    const isDeleting = (e.nativeEvent as any).inputType?.includes('delete');
    if (isDeleting && rawValue === amount && selectionStart > 0) {
        rawValue = rawValue.slice(0, Math.max(0, digitsBefore - 1)) + rawValue.slice(digitsBefore);
        setPrevCursorDigits(Math.max(0, digitsBefore - 1));
    } else {
        setPrevCursorDigits(digitsBefore);
    }

    setAmount(rawValue);
  };

  const formatDisplayAmount = (val: string) => {
    if (!val) return '';
    return new Intl.NumberFormat('id-ID').format(Number(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const numericAmount = Number(amount);
    
    if (!student) {
        toast({ title: 'Siswa tidak ditemukan', variant: 'destructive' });
        setLoading(false);
        return;
    }
    
    const balance = student.transactions.reduce((acc, tx) => acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount), 0);

    if (!numericAmount || numericAmount <= 0) {
        toast({
            title: 'Jumlah Tidak Valid',
            description: 'Mohon masukkan jumlah yang valid.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }
    
    if (numericAmount > balance) {
        toast({
            title: 'Saldo Tidak Cukup',
            description: `Saldo akhir tidak mencukupi untuk penarikan ini. Saldo saat ini: ${balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`,
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    const { error } = await supabase.from('transactions').insert({ 
        student_id: studentId, 
        user_id: user?.id,
        amount: numericAmount, 
        description,
        created_at: date?.toISOString(),
        type: 'Pengeluaran'
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
            description: `Penarikan sebesar ${numericAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} telah disimpan.`,
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
                  ref={inputRef}
                  type="text" 
                  inputMode="numeric"
                  placeholder="Contoh: 20.000" 
                  className="pl-8" 
                  value={formatDisplayAmount(amount)}
                  onChange={handleAmountChange}
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

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white h-12" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Transaksi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
