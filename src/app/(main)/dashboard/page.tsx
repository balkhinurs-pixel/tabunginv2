
import { Suspense } from 'react';
import Link from 'next/link';
import { Users, QrCode, FileText, ShieldCheck, Search, ArrowRight, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { parseISO, format } from 'date-fns';
import type { Student, Transaction, Profile } from '@/types';
import { createClient } from '@/lib/utils/supabase/server';
import SearchStudent from './_components/SearchStudent';

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

async function DashboardData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // This should be handled by middleware, but as a safeguard.
    return <p>User not found.</p>;
  }
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, plan')
    .eq('id', user.id)
    .maybeSingle();
  
  if (profileError || !profileData) {
      // This case should rarely happen now because the middleware redirects
      // to /welcome if the profile isn't fully set up.
      return <p className="text-destructive text-center p-4">Gagal memuat data: Profil pengguna tidak ditemukan. Coba segarkan halaman.</p>;
  }


  const [
    { data: studentsData, error: studentsError },
    { data: transactionsData, error: transactionsError },
  ] = await Promise.all([
    supabase.from('students').select(`id, nis, name, class, transactions (id, type, amount)`).eq('user_id', user.id),
    supabase.from('transactions').select(`*, students (id, name)`).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ]);

  if (studentsError || transactionsError) {
    const errorMessage = studentsError?.message || transactionsError?.message || 'Terjadi kesalahan tidak diketahui.';
    return <p className="text-destructive">Gagal memuat data: {errorMessage}</p>;
  }

  const students = studentsData as Student[];
  const transactions = transactionsData as Transaction[];
  const profile = profileData as Profile;
  
  const totalBalance = students.reduce((total, student) => {
    const studentBalance = student.transactions.reduce((acc, tx) => {
      return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
    }, 0);
    return total + studentBalance;
  }, 0);

  const studentQuota = profile.plan === 'PRO' ? 40 : 5;

  const recentTransactions = transactions.map(tx => ({
      id: tx.id,
      date: format(parseISO(tx.created_at!), 'dd/MM/yy'),
      type: tx.type,
      amount: tx.amount,
      studentId: tx.student_id,
      studentName: tx.students!.name,
  }));

  return (
    <>
       <Card className="bg-primary text-primary-foreground shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-2 rounded-lg">
                <BackpackIcon className="h-6 w-6 text-white"/>
            </div>
            {profile.plan === 'TRIAL' ? (
              <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90">TRIAL</Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-400 text-green-900 hover:bg-green-400/90">PRO</Badge>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-80">Total Saldo Semua Siswa</span>
              <EyeOff className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-4xl font-bold tracking-tight">
              {totalBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs opacity-80 mt-1">Kuota Siswa Digunakan: {students.length} / {studentQuota}</p>
          </div>
        </CardContent>
      </Card>

      <SearchStudent />
      
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
            {recentTransactions.length > 0 ? (
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
    </>
  );
}

function DashboardLoading() {
  return (
    <>
      <Card className="bg-primary text-primary-foreground shadow-lg">
        <CardContent className="p-6">
          <div className="h-[125px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-3">
           <div className="h-[76px] w-full" />
        </CardContent>
      </Card>
       <Card>
        <CardContent className="p-4 flex justify-around">
            <div className="h-[76px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-8 text-muted-foreground text-sm">Memuat transaksi...</div>
        </CardContent>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}
