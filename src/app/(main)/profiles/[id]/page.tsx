
'use client';

import Link from 'next/link';
import { ArrowLeft, PlusCircle, MinusCircle, FileText, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
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
import type { Student, Transaction } from '@/types';
import { supabase } from '@/lib/supabase';
import { parseISO, format } from 'date-fns';

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

    const handleDelete = async () => {
        const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
        
        if (error) {
             toast({
                title: 'Gagal Menghapus Transaksi',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            onDelete(transactionId);
            toast({
                title: 'Transaksi Dihapus',
                description: `Transaksi "${description}" telah dihapus.`,
            });
        }
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
                    <Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = typeof params.id === 'string' ? params.id : '';
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!studentId) return;

    const fetchStudent = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                transactions (
                    *
                )
            `)
            .eq('id', studentId)
            .single();

        if (error) {
            console.error(error);
            toast({ title: "Error", description: "Gagal mengambil data siswa.", variant: "destructive" });
            setStudent(null);
        } else {
            const studentData = data as Student;
            studentData.transactions = studentData.transactions.sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
            setStudent(studentData);
        }
        setLoading(false);
    };

    fetchStudent();
  }, [studentId, toast]);

  const handleDeleteTransaction = (transactionId: string) => {
    if (student) {
        const updatedTransactions = student.transactions.filter(tx => tx.id !== transactionId);
        setStudent({ ...student, transactions: updatedTransactions });
    }
  };

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
  
  if (loading) {
    return (
      <div className="text-center">
        <p>Memuat data siswa...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center">
        <p className='text-destructive font-semibold'>Siswa tidak ditemukan.</p>
        <Button asChild variant="link">
          <Link href="/profiles">Kembali ke Daftar Siswa</Link>
        </Button>
      </div>
    );
  }

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
        <StatCard loading={loading} title="Total Pemasukan" value={income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-green-100/50 border-green-200 text-green-700" />
        <StatCard loading={loading} title="Total Pengeluaran" value={expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-red-100/50 border-red-200 text-red-700" />
        <StatCard loading={loading} title="Saldo Akhir" value={balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} colorClass="bg-blue-100/50 border-blue-200 text-blue-700" />
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
                                <TableCell>{format(parseISO(tx.created_at!), 'dd/MM/yy')}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.type === 'Pemasukan' ? 'default' : 'destructive'} className={cn(tx.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                        {tx.type}
                                    </Badge>
                                </TableCell>
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
