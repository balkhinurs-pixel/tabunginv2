
import Link from 'next/link';
import { ArrowLeft, PlusCircle, MinusCircle, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, colorClass }: { title: string, value: string, colorClass: string }) => (
    <Card className={`text-center shadow-md ${colorClass}`}>
        <CardContent className="p-4">
            <p className="text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </CardContent>
    </Card>
);

const ActionButton = ({ icon: Icon, label, variant = 'default' }: { icon: React.ElementType, label: string, variant?: 'default' | 'destructive' | 'secondary' | 'ghost' }) => {
    const colorClasses = {
        default: 'bg-green-500 hover:bg-green-600 text-white',
        destructive: 'bg-red-600 hover:bg-red-700 text-white',
        secondary: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200',
        ghost: 'bg-green-100 hover:bg-green-200 text-green-700'
    };
    return (
        <Button className={`w-full justify-start text-left h-12 text-base font-medium ${colorClasses[variant]}`}>
            <Icon className="mr-3 h-5 w-5" />
            {label}
        </Button>
    )
};

const TransactionHistoryItem = ({ date, type, description }: { date: string, type: 'Pemasukan' | 'Pengeluaran', description: string }) => (
  <div className="flex items-center justify-between border-b py-3 text-sm">
    <span className="text-muted-foreground">{date}</span>
    <Badge
      variant="outline"
      className={cn(
        type === 'Pemasukan'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-red-200 bg-red-50 text-red-700'
      )}
    >
      {type}
    </Badge>
    <span className="text-foreground">{description}</span>
  </div>
);

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch student data based on params.id
  const student = {
    nis: params.id,
    name: 'balkhi',
    class: '9a',
    income: 5500000,
    expense: 25000,
    balance: 5475000
  };

  const transactions = [
      { date: '10/6/2025', type: 'Pemasukan', description: 'harian' },
      { date: '10/6/2025', type: 'Pemasukan', description: 'bulanan' },
      { date: '10/6/2025', type: 'Pengeluaran', description: 'jajan' },
  ];

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
          </CardContent>
      </Card>
      
      <div className="space-y-3">
        <StatCard title="Total Pemasukan" value={student.income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-green-100/50 border-green-200 text-green-700" />
        <StatCard title="Total Pengeluaran" value={student.expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-red-100/50 border-red-200 text-red-700" />
        <StatCard title="Saldo Akhir" value={student.balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-blue-100/50 border-blue-200 text-blue-700" />
      </div>

      <div className="space-y-3 pt-4">
        <ActionButton icon={PlusCircle} label="Setor Tunai" />
        <ActionButton icon={MinusCircle} label="Tarik Tunai" variant="destructive" />
        <ActionButton icon={FileText} label="Cetak Laporan" variant="secondary" />
        <ActionButton icon={MessageCircle} label="Kirim WA" variant="ghost" />
      </div>

      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="text-xl">Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="mb-4 grid grid-cols-3 text-xs font-semibold text-muted-foreground">
                <span>TANGGAL</span>
                <span>JENIS</span>
                <span>KETERANGAN</span>
            </div>
            <div className="space-y-2">
                {transactions.map((tx, index) => (
                    <TransactionHistoryItem key={index} {...tx} />
                ))}
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
