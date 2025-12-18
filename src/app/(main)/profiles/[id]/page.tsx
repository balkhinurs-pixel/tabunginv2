
import Link from 'next/link';
import { ArrowLeft, PlusCircle, MinusCircle, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/types';
import { createClient } from '@/lib/utils/supabase/server';
import { parseISO, format } from 'date-fns';
import { id } from 'date-fns/locale';
import PrintReportButton from './_components/PrintReportButton';
import SendWAButton from './_components/SendWAButton';
import TransactionList from './_components/TransactionList';

interface StudentProfilePageProps {
    params: {
        id: string;
    };
}

const StatCard = ({ title, value, colorClass, loading }: { title: string, value: string, colorClass: string, loading?: boolean }) => (
    <Card className={`text-center shadow-md ${colorClass}`}>
        <CardContent className="p-4">
            <p className="text-sm">{title}</p>
            {loading ? (
                 <div className="h-8 w-32 mt-1 mx-auto rounded-md animate-pulse bg-gray-300/50" />
            ): (
                <p className="text-2xl font-bold">{value}</p>
            )}
        </CardContent>
    </Card>
);

const ActionButton = ({ icon: Icon, label, variant = 'default', href, onClick }: { icon: React.ElementType, label: string, variant?: 'default' | 'destructive', href?: string, onClick?: () => void }) => {
    const colorClasses = {
        default: 'bg-green-500 hover:bg-green-600 text-white',
        destructive: 'bg-red-600 hover:bg-red-700 text-white',
    };
    
    const content = (
        <Button onClick={onClick} variant={variant} className={`w-full justify-center text-left h-12 text-base font-medium ${colorClasses[variant]}`}>
            <Icon className="mr-3 h-5 w-5" />
            {label}
        </Button>
    );

    if (href) {
        return <Link href={href} className="w-full">{content}</Link>;
    }

    return content;
};


export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const studentId = params.id;
  const supabase = createClient();
  
  const { data: studentData, error } = await supabase
    .from('students')
    .select('*, transactions (*)')
    .eq('id', studentId)
    .limit(1)
    .single();

  if (error || !studentData) {
    return (
      <div className="text-center">
        <p className='text-destructive font-semibold'>Siswa tidak ditemukan atau gagal memuat data.</p>
        <Button asChild variant="link">
          <Link href="/profiles">Kembali ke Daftar Siswa</Link>
        </Button>
      </div>
    );
  }

  const student = studentData as Student;
  student.transactions = student.transactions.sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());


  const { income, expense, balance } = (student?.transactions || []).reduce(
    (acc, tx) => {
      if (tx.type === 'Pemasukan') {
        acc.income += tx.amount;
      } else {
        acc.expense += tx.amount;
      }
      acc.balance = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );
  
  return (
    <div className="space-y-6 pb-8">
      <Button variant="ghost" asChild className="pl-0">
        <Link href="/profiles">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Data Siswa
        </Link>
      </Button>

      <h1 className="text-2xl font-bold text-center">Profil Siswa</h1>

      <Card className="shadow-lg">
          <CardContent className="p-4">
            <p className="text-xl font-bold">{student.name}</p>
            <p className="text-muted-foreground">NIS: {student.nis}</p>
            <p className="text-muted-foreground">Kelas: {student.class}</p>
             {student.whatsapp_number && <p className="text-muted-foreground text-sm">WA: {student.whatsapp_number}</p>}
          </CardContent>
      </Card>
      
      <div className="space-y-3">
        <StatCard loading={false} title="Total Pemasukan" value={income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-green-100/50 border-green-200 text-green-700" />
        <StatCard loading={false} title="Total Pengeluaran" value={expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-red-100/50 border-red-200 text-red-700" />
        <StatCard loading={false} title="Saldo Akhir" value={balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-blue-100/50 border-blue-200 text-blue-700" />
      </div>

      <div className="space-y-3 pt-4">
        <div className="grid grid-cols-2 gap-3">
            <ActionButton icon={PlusCircle} label="Setor" href={`/profiles/${studentId}/deposit`} />
            <ActionButton icon={MinusCircle} label="Tarik" variant="destructive" href={`/profiles/${studentId}/withdrawal`} />
        </div>
        <PrintReportButton student={student} />
        <SendWAButton student={student} income={income} expense={expense} balance={balance} />
      </div>

      <TransactionList initialTransactions={student.transactions} />
    </div>
  );
}
