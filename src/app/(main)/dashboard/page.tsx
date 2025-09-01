
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, QrCode, FileText, ShieldCheck, Search, ArrowRight, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { parseISO, format } from 'date-fns';
import type { Student, Transaction } from '@/types';
import { supabase } from '@/lib/supabase';


const ActionButton = ({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href?: string }) => {
  const content = (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-secondary hover:bg-primary/10 border-0">
        <Icon className="h-6 w-6 text-primary" />
      </Button>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};


const BackpackIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 7h16" />
        <path d="M8 5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
        <path d="M9.5 12.5h2" />
        <path d="M12.5 15.5h-2a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h2" />
        <path d="M10.5 15.5v-3" />
    </svg>
)

export default function DashboardPage() {
  const [nis, setNis] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          nis,
          name,
          class,
          transactions (
            id,
            type,
            amount
          )
        `);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          students (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (studentsError || transactionsError) {
        toast({
          title: 'Gagal memuat data',
          description: studentsError?.message || transactionsError?.message,
          variant: 'destructive',
        });
      } else {
        setStudents(studentsData as Student[]);
        setTransactions(transactionsData as Transaction[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [toast]);

  const totalBalance = useMemo(() => {
    if (loading || !students) return 0;
    return students.reduce((total, student) => {
      const studentBalance = student.transactions.reduce((acc, tx) => {
        return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
      }, 0);
      return total + studentBalance;
    }, 0);
  }, [students, loading]);

  const recentTransactions = useMemo(() => {
    return transactions.map(tx => ({
        id: tx.id,
        date: format(parseISO(tx.created_at!), 'dd/MM/yy'),
        type: tx.type,
        amount: tx.amount,
        studentId: tx.student_id,
        studentName: tx.students.name,
    }));
  }, [transactions]);
  
  const handleSearch = async () => {
    if (!nis) {
      toast({
        title: 'NIS Kosong',
        description: 'Silakan masukkan NIS siswa untuk mencari.',
        variant: 'destructive',
      });
      return;
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('id')
      .eq('nis', nis)
      .single();

    if (student && !error) {
      router.push(`/profiles/${student.id}`);
    } else {
      toast({
        title: 'Siswa Tidak Ditemukan',
        description: `Tidak ada siswa dengan NIS "${nis}".`,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-primary text-primary-foreground shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-2 rounded-lg">
                <BackpackIcon className="h-6 w-6 text-white"/>
            </div>
            <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90">TRIAL</Badge>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-80">Total Saldo Semua Siswa</span>
              <EyeOff className="h-4 w-4 opacity-80" />
            </div>
            {loading ? (
                <div className="h-[36px] w-48 mt-1 rounded-md animate-pulse bg-white/20" />
            ) : (
                <p className="text-4xl font-bold tracking-tight">
                {totalBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </p>
            )}
            <p className="text-xs opacity-80 mt-1">Kuota Siswa Digunakan: {students.length} / 5</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-sm">Cari Siswa (via NIS)</p>
          <div className="flex gap-2">
            <Input 
              placeholder="Masukkan NIS siswa..." 
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" /> Cari
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex justify-around">
            <ActionButton icon={Users} label="Data Siswa" href="/profiles" />
            <ActionButton icon={QrCode} label="Cetak Kartu" href="/print-cards"/>
            <ActionButton icon={FileText} label="Laporan" href="/reports"/>
            <ActionButton icon={ShieldCheck} label="Aktivasi" href="/activation" />
        </CardContent>
      </Card>

      <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Transaksi Terkini</h3>
                <Button variant="link" className="text-primary h-auto p-0" asChild>
                    <Link href="/reports">
                      Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </div>
            {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Memuat transaksi...</div>
            ) : recentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SISWA</TableHead>
                                <TableHead>JENIS</TableHead>
                                <TableHead className="text-right">JUMLAH</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <Link href={`/profiles/${tx.studentId}`} className="hover:underline">
                                            <div className="font-medium">{tx.studentName}</div>
                                            <div className="text-xs text-muted-foreground">{tx.date}</div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tx.type === 'Pemasukan' ? 'default' : 'destructive'} className={cn(tx.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                            {tx.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={cn("text-right font-medium", tx.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600')}>
                                        {tx.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">Belum ada transaksi terbaru.</p>
                </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
