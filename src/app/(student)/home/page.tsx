
'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { Student, Transaction } from '@/types';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';


const TransactionRow = ({ tx }: { tx: Transaction }) => {
    const isIncome = tx.type === 'Pemasukan';
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isIncome ? "bg-green-100 dark:bg-green-900/50" : "bg-red-100 dark:bg-red-900/50"
                )}>
                    {isIncome ? (
                        <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                </div>
                <div>
                    <p className="font-semibold text-foreground">{tx.description || tx.type}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(tx.created_at!), 'd MMM yyyy, HH:mm', { locale: id })}</p>
                </div>
            </div>
            <p className={cn(
                "font-bold text-lg",
                isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
                {isIncome ? '+' : '-'} {tx.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
            </p>
        </div>
    );
};

export default function StudentDashboardPage() {
    const supabase = createClient();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            setLoading(true);
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error: fetchError } = await supabase
                    .from('students')
                    .select('id, nis, name, class, transactions(*)')
                    .eq('id', user.id)
                    .single();
                
                if (fetchError) {
                    console.error("Error fetching student data:", fetchError);
                    setError("Gagal memuat data. Ini bisa terjadi jika kebijakan RLS (Row Level Security) di Supabase belum diatur.");
                } else if (data) {
                    const typedStudent = data as Student;
                    typedStudent.transactions = (typedStudent.transactions || []).sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                    setStudent(typedStudent);
                } else {
                    setError("Profil siswa tidak ditemukan.");
                }
            } else {
                setError("Sesi pengguna tidak ditemukan. Silakan login kembali.");
            }
            setLoading(false);
        };
        fetchStudentData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full pt-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !student) {
        return <p className="text-center text-destructive bg-destructive/10 p-4 rounded-md">{error || "Terjadi kesalahan yang tidak diketahui."}</p>
    }

    const { income, expense, balance } = (student.transactions || []).reduce(
        (acc, tx) => {
          if (tx.type === 'Pemasukan') acc.income += tx.amount;
          else acc.expense += tx.amount;
          acc.balance = acc.income - acc.expense;
          return acc;
        },
        { income: 0, expense: 0, balance: 0 }
    );

    return (
        <div className="space-y-6 pb-8">
            {/* Main Balance Card with Gradient and Motif */}
            <Card className="bg-gradient-to-br from-primary via-primary to-blue-700 text-primary-foreground shadow-xl border-none relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-8 w-24 h-24 bg-blue-300/20 rounded-full blur-xl pointer-events-none" />
                
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm text-primary-foreground/80 font-medium tracking-wide">Saldo Anda Saat Ini</p>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">
                        {balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                    </p>
                </CardContent>
            </Card>
            
            {/* Income and Expense Summary */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/50">
                            <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pemasukan</p>
                            <p className="font-bold text-green-600 dark:text-green-400">
                                {income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/50">
                            <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pengeluaran</p>
                            <p className="font-bold text-red-600 dark:text-red-400">
                                {expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">Riwayat Transaksi</CardTitle>
                </CardHeader>
                <CardContent className="px-2 divide-y">
                    {student.transactions.length > 0 ? (
                        student.transactions.slice(0, 10).map(tx => <TransactionRow key={tx.id} tx={tx} />)
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            Belum ada transaksi.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
