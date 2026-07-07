
'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { Student, Transaction } from '@/types';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Wallet, EyeOff, Settings, ShieldCheck, Save, KeyRound, Ban } from 'lucide-react';
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
import { changeStudentPinAction, updateDailyLimitAction } from './actions';
import { Separator } from '@/components/ui/separator';


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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{format(parseISO(tx.created_at!), 'd MMM yyyy, HH:mm', { locale: id })}</p>
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
    
    // Settings State
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [dailyLimit, setDailyLimit] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        const fetchStudentData = async () => {
            setLoading(true);
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error: fetchError } = await supabase
                    .from('students')
                    .select('id, nis, name, class, daily_limit, transactions(*)')
                    .eq('id', user.id)
                    .single();
                
                if (fetchError) {
                    console.error("Error fetching student data:", fetchError);
                    setError("Gagal memuat data.");
                } else if (data) {
                    const typedStudent = data as Student;
                    typedStudent.transactions = (typedStudent.transactions || []).sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                    setStudent(typedStudent);
                    setDailyLimit(typedStudent.daily_limit?.toString() || '');
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

    const handleSaveChanges = async () => {
        setSaving(true);
        
        // 1. Handle PIN Change if filled
        if (newPin) {
            if (newPin.length < 6) {
                toast({ title: "PIN Terlalu Pendek", description: "PIN harus minimal 6 digit.", variant: "destructive" });
                setSaving(false);
                return;
            }
            if (newPin !== confirmPin) {
                toast({ title: "PIN Tidak Cocok", description: "Konfirmasi PIN tidak sesuai.", variant: "destructive" });
                setSaving(false);
                return;
            }
            const pinRes = await changeStudentPinAction(newPin);
            if (!pinRes.success) {
                toast({ title: "Gagal Ganti PIN", description: pinRes.message, variant: "destructive" });
                setSaving(false);
                return;
            }
        }

        // 2. Handle Daily Limit Change
        const limitVal = dailyLimit ? parseInt(dailyLimit) : null;
        const limitRes = await updateDailyLimitAction(limitVal);
        
        setSaving(false);

        if (limitRes.success) {
            toast({ title: "Pengaturan Disimpan", description: "Profil keamanan Anda telah diperbarui." });
            setDialogOpen(false);
            setNewPin('');
            setConfirmPin('');
            if (student) setStudent({ ...student, daily_limit: limitVal });
        } else {
            toast({ title: "Gagal", description: limitRes.message, variant: "destructive" });
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

    // Calculate today's spending
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todaySpending = (student.transactions || [])
        .filter(tx => tx.type === 'Pengeluaran' && new Date(tx.created_at!) >= todayStart)
        .reduce((sum, tx) => sum + tx.amount, 0);

    return (
        <div className="space-y-6 pb-20 max-w-md mx-auto">
            <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tight text-gray-900">Halo, {student.name.split(' ')[0]}</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selamat Datang Kembali</p>
                </div>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-full bg-white shadow-sm border-gray-100 h-10 w-10">
                            <Settings className="h-5 w-5 text-gray-400" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase tracking-tight">Pengaturan Keamanan</DialogTitle>
                            <DialogDescription className="text-xs">Atur limit harian dan PIN keamanan akun Anda.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="dailyLimit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Batas Pengeluaran Harian (Rp)</Label>
                                <div className="relative">
                                    <Ban className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="dailyLimit" 
                                        type="text" 
                                        inputMode="numeric"
                                        placeholder="Misal: 20000 (Kosongkan jika tidak dibatasi)" 
                                        className="pl-10 h-12 rounded-xl font-bold"
                                        value={dailyLimit}
                                        onChange={(e) => setDailyLimit(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                                <p className="text-[9px] text-muted-foreground italic px-1">Limit ini berlaku untuk Tarik Tunai dan Belanja Kantin.</p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="newPin" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reset PIN Baru (Opsional)</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="newPin" 
                                        type="password" 
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="Masukkan 6 digit PIN baru" 
                                        className="pl-10 h-12 rounded-xl"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPin" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Konfirmasi PIN Baru</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="confirmPin" 
                                        type="password" 
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="Ulangi PIN baru" 
                                        className="pl-10 h-12 rounded-xl"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveChanges} disabled={saving} className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20">
                                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                SIMPAN PERUBAHAN
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Balance Card */}
            <Card className="bg-gradient-to-br from-primary via-primary to-blue-700 text-primary-foreground shadow-2xl border-none relative overflow-hidden h-[240px] rounded-[2.5rem]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute top-1/2 -right-16 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl pointer-events-none" />
                
                <CardContent className="p-8 relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
                          Tabung<span className="opacity-60">.in</span>
                        </span>
                        <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/20">
                            <p className="text-[10px] font-black tracking-widest uppercase">Kelas {student.class}</p>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] text-primary-foreground/70 font-black uppercase tracking-[0.2em]">Saldo Tabungan</p>
                            <div className="h-px flex-1 bg-white/20" />
                        </div>
                        <p className="text-4xl font-black tracking-tighter drop-shadow-lg">
                            {balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </p>
                        
                        <div className="mt-6 flex items-center justify-between bg-black/10 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <Ban className="h-3.5 w-3.5 text-white/50" />
                                <p className="text-[9px] font-black uppercase tracking-widest">Limit Harian:</p>
                            </div>
                            <p className="text-[10px] font-black">
                                {student.daily_limit ? `${formatCurrency(todaySpending)} / ${formatCurrency(student.daily_limit)}` : 'TIDAK DIBATASI'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-sm rounded-3xl bg-emerald-50/50 border border-emerald-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
                            <ArrowUpCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-black tracking-widest text-emerald-700/60">Pemasukan</p>
                            <p className="font-black text-emerald-600 text-sm">
                                {income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-3xl bg-rose-50/50 border border-rose-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
                            <ArrowDownCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-black tracking-widest text-rose-700/60">Pengeluaran</p>
                            <p className="font-black text-rose-600 text-sm">
                                {expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Riwayat Terakhir</CardTitle>
                    <Wallet className="h-4 w-4 text-gray-200" />
                </CardHeader>
                <CardContent className="px-4 divide-y divide-gray-50">
                    {student.transactions.length > 0 ? (
                        student.transactions.slice(0, 10).map(tx => <TransactionRow key={tx.id} tx={tx} />)
                    ) : (
                        <div className="text-center py-20 text-gray-300">
                            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                                <Wallet className="h-5 w-5 opacity-20" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Belum ada transaksi</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

