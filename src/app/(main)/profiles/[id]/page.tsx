
'use client';

import Link from 'next/link';
import { ArrowLeft, PlusCircle, MinusCircle, FileText, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
  } from '@/components/ui/dialog';
import type { Student, Transaction } from '@/data/students';
import { initialStudents } from '@/data/students';


const StatCard = ({ title, value, colorClass }: { title: string, value: string, colorClass: string }) => (
    <Card className={`text-center shadow-md ${colorClass}`}>
        <CardContent className="p-4">
            <p className="text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </CardContent>
    </Card>
);

const ActionButton = ({ icon: Icon, label, variant = 'default', href }: { icon: React.ElementType, label: string, variant?: 'default' | 'destructive' | 'secondary' | 'ghost', href?: string }) => {
    const colorClasses = {
        default: 'bg-green-500 hover:bg-green-600 text-white',
        destructive: 'bg-red-600 hover:bg-red-700 text-white',
        secondary: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200',
        ghost: 'bg-green-100 hover:bg-green-200 text-green-700'
    };
    
    const content = (
        <Button className={`w-full justify-start text-left h-12 text-base font-medium ${colorClasses[variant]}`}>
            <Icon className="mr-3 h-5 w-5" />
            {label}
        </Button>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
};

const DeleteTransactionDialog = ({ transactionId, description, onDelete }: { transactionId: string, description: string, onDelete: (id: string) => void }) => {
    const { toast } = useToast();

    const handleDelete = () => {
        onDelete(transactionId);
        toast({
            title: 'Transaksi Dihapus',
            description: `Transaksi "${description}" telah dihapus.`,
            variant: 'destructive',
        });
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus Transaksi?</DialogTitle>
                    <DialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Yakin ingin menghapus transaksi "{description}"?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Batal</Button></DialogClose>
                    <DialogClose asChild><Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = typeof params.id === 'string' ? params.id : '';
  
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    // In a real scenario, you'd fetch from Supabase here.
    // For now, we'll find the student in our dummy data.
    const fetchedStudent = initialStudents.find(s => s.id === studentId);
    setStudent(fetchedStudent || null);
  }, [studentId]);

  const handleDeleteTransaction = (transactionId: string) => {
    // This will later be a Supabase delete call
    if (student) {
        const updatedTransactions = student.transactions.filter(tx => tx.id !== transactionId);
        setStudent({ ...student, transactions: updatedTransactions });
    }
  };

  if (!student) {
    return (
      <div className="text-center">
        <p>Memuat data siswa...</p>
        <Button asChild variant="link">
          <Link href="/profiles">Kembali ke Daftar Siswa</Link>
        </Button>
      </div>
    );
  }

  const { income, expense, balance } = student.transactions.reduce(
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
          </CardContent>
      </Card>
      
      <div className="space-y-3">
        <StatCard title="Total Pemasukan" value={income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-green-100/50 border-green-200 text-green-700" />
        <StatCard title="Total Pengeluaran" value={expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-red-100/50 border-red-200 text-red-700" />
        <StatCard title="Saldo Akhir" value={balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-blue-100/50 border-blue-200 text-blue-700" />
      </div>

      <div className="space-y-3 pt-4">
        <ActionButton icon={PlusCircle} label="Setor Tunai" href={`/profiles/${studentId}/deposit`} />
        <ActionButton icon={MinusCircle} label="Tarik Tunai" variant="destructive" href={`/profiles/${studentId}/withdrawal`} />
        <ActionButton icon={FileText} label="Cetak Laporan" variant="secondary" />
        <ActionButton icon={MessageCircle} label="Kirim WA" variant="ghost" />
      </div>

      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="text-xl">Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-x-auto">
                <Table className="whitespace-nowrap">
                    <TableHeader>
                        <TableRow>
                            <TableHead>TANGGAL</TableHead>
                            <TableHead>JENIS</TableHead>
                            <TableHead>KETERANGAN</TableHead>
                            <TableHead className="text-right">JUMLAH</TableHead>
                            <TableHead className="text-center">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {student.transactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Belum ada transaksi.
                                </TableCell>
                            </TableRow>
                        )}
                        {student.transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{tx.date}</TableCell>
                                <TableCell className={cn(tx.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600')}>{tx.type}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className={cn("text-right font-medium", tx.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600')}>
                                    {tx.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                                </TableCell>
                                <TableCell className="text-center">
                                    <DeleteTransactionDialog 
                                        transactionId={tx.id}
                                        description={tx.description}
                                        onDelete={handleDeleteTransaction}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
