
'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { Student, Transaction } from '@/types';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Wallet, EyeOff, Settings, ShieldCheck, Save, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { changeStudentPinAction } from './actions';


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
    const { toast } = useToast();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Change PIN State
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [changingPin, setChangingPin] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

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
                    setError("Gagal memuat data.");
                } else if (data) {
                    const typedStudent = data as Student;
                    typedStudent.transactions = (typedStudent.transactions || []).sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                    setStudent(typedStudent);
                } else {
                    setError("Profil siswa tidak ditemukan.");
                }
            } else {
                setError("Sesi pengguna tidak ditemukan.");
            }
            setLoading(false);
        };
        fetchStudentData();
    }, [supabase]);

    const handleChangePin = async () => {
        if (newPin.length < 6) {
            toast({ title: "PIN Terlalu Pendek", description: "PIN harus minimal 6 digit.", variant: "destructive" });
            return;
        }
        if (newPin !== confirmPin) {
            toast({ title: "PIN Tidak Cocok", description: "Konfirmasi PIN tidak sesuai.", variant: "destructive" });
            return;
        }

        setChangingPin(true);
        const result = await changeStudentPinAction(newPin);
        setChangingPin(false);

        if (result.success) {
            toast({ title: "Berhasil", description: result.message });
            setDialogOpen(false);
            setNewPin('');
            setConfirmPin('');
        } else {
            toast({ title: "Gagal", description: result.message, variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full pt-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !student) {
        return <p className="text-center text-destructive bg-destructive/10 p-4 rounded-md">{error || "Terjadi kesalahan."}</p>
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
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Dashboard Tabungan</h1>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-full bg-white shadow-sm border-gray-100">
                            <Settings className="h-4 w-4 mr-2 text-gray-500" /> Pengaturan
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Pengaturan Akun</DialogTitle>
                            <DialogDescription>Gunakan fitur ini untuk memperbarui PIN keamanan Anda.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPin">PIN Baru (6 Digit)</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="newPin" 
                                        type="password" 
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="Masukkan PIN baru" 
                                        className="pl-10"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPin">Konfirmasi PIN Baru</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="confirmPin" 
                                        type="password" 
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="Ulangi PIN baru" 
                                        className="pl-10"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleChangePin} disabled={changingPin} className="w-full">
                                {changingPin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Simpan PIN Baru
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Balance Card */}
            <Card className="bg-gradient-to-br from-primary via-primary to-blue-700 text-primary-foreground shadow-xl border-none relative overflow-hidden h-[220px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute top-1/2 -right-16 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl pointer-events-none" />
                
                <CardContent className="p-6 relative z-10 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
                          Tabung<span className="opacity-60">.in</span>
                        </span>
                        <div className="h-px w-8 bg-white/20 mx-1" />
                        <p className="text-xs text-primary-foreground/80 font-bold tracking-widest uppercase">Halo, {student.name.split(' ')[0]}!</p>
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-primary-foreground/80 font-medium tracking-wide uppercase">Saldo Tabungan Anda</p>
                            <EyeOff className="h-3 w-3 opacity-60" />
                        </div>
                        <p className="text-4xl font-black tracking-tight mt-1 drop-shadow-sm">
                            {balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </p>
                        
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md">
                            <p className="text-[10px] font-black tracking-widest uppercase">Kelas {student.class}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
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
