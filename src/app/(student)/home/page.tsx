
'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { Student } from '@/types';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import TransactionList from '@/app/(main)/profiles/[id]/_components/TransactionList';

const StatCard = ({ title, value, colorClass }: { title: string, value: string, colorClass: string }) => (
    <Card className={`text-center shadow-md ${colorClass}`}>
        <CardContent className="p-4">
            <p className="text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </CardContent>
    </Card>
);

export default function StudentDashboardPage() {
    const supabase = createClient();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('students')
                    .select('*, transactions(*)')
                    .eq('id', user.id)
                    .single();
                
                if (data && !error) {
                    data.transactions = data.transactions.sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                    setStudent(data as Student);
                } else if (error) {
                    console.error("Error fetching student data:", error);
                }
            }
            setLoading(false);
        };
        fetchStudentData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4">Memuat data...</p>
            </div>
        )
    }

    if (!student) {
        return <p className="text-center text-destructive">Gagal memuat data siswa. Silakan coba login kembali.</p>
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
            <h1 className="text-2xl font-bold text-center">Dashboard Siswa</h1>

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

            <TransactionList initialTransactions={student.transactions} isStudentView={true} />
        </div>
    );
}
