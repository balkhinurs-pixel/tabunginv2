
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Loader2, School, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { AuthUser } from '@supabase/supabase-js';
import { AppLogo } from '@/components/AppLogo';
import { cn } from '@/lib/utils';

export default function WelcomePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'CANTINE'>('ADMIN');

  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
        } else {
            router.push('/login');
        }
    }
    fetchUser();
  }, [supabase, router]);

  const handleSaveSettings = async () => {
    if (!user) return;
    
    if (role === 'ADMIN' && !schoolName) {
        toast({ title: "Nama Sekolah Wajib Diisi", variant: 'destructive' });
        return;
    }
    if (!schoolCode) {
        toast({ title: "Kode Sekolah Wajib Diisi", variant: 'destructive' });
        return;
    }

    setSaving(true);
    const sanitizedCode = schoolCode.toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (role === 'CANTINE') {
        const { data: schoolCheck } = await supabase
            .from('profiles')
            .select('school_name')
            .eq('school_code', sanitizedCode)
            .eq('role', 'ADMIN')
            .maybeSingle();
        
        if (!schoolCheck) {
            toast({ 
                title: "Sekolah Tidak Ditemukan", 
                description: "Pastikan kode sekolah yang Anda masukkan sudah didaftarkan oleh Guru.", 
                variant: 'destructive' 
            });
            setSaving(false);
            return;
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            school_name: role === 'ADMIN' ? schoolName : 'Outlet Kantin',
            school_code: sanitizedCode,
            role: role
        })
        .eq('id', user.id);
    
    setSaving(false);

    if (error) {
        toast({ title: "Pendaftaran Gagal", description: "Terjadi kesalahan saat menyimpan profil Anda.", variant: 'destructive' });
    } else {
        toast({ title: "Berhasil!", description: "Profil Anda telah dikonfigurasi." });
        const destination = role === 'CANTINE' ? '/cantine/dashboard' : '/dashboard';
        router.push(destination);
        router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden">
        <div className="bg-primary h-2 w-full" />
        <CardHeader className="text-center pb-2">
            <div className="mb-6 flex justify-center">
                <AppLogo />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Selamat Datang!</CardTitle>
            <CardDescription>
                Mohon pilih peran Anda untuk memulai pengalaman digital sekolah.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => setRole('ADMIN')}
                    className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        role === 'ADMIN' ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-gray-100 hover:border-gray-200"
                    )}
                >
                    <div className={cn("p-2 rounded-full", role === 'ADMIN' ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>
                        <School className="h-6 w-6" />
                    </div>
                    <span className={cn("text-xs font-bold uppercase tracking-widest", role === 'ADMIN' ? "text-primary" : "text-gray-500")}>GURU</span>
                </button>
                <button 
                    onClick={() => setRole('CANTINE')}
                    className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        role === 'CANTINE' ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-gray-100 hover:border-gray-200"
                    )}
                >
                    <div className={cn("p-2 rounded-full", role === 'CANTINE' ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>
                        <UtensilsCrossed className="h-6 w-6" />
                    </div>
                    <span className={cn("text-xs font-bold uppercase tracking-widest", role === 'CANTINE' ? "text-primary" : "text-gray-500")}>KANTIN</span>
                </button>
            </div>

            <div className="space-y-4 pt-2">
                {role === 'ADMIN' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="schoolName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nama Sekolah / Instansi</Label>
                        <div className="relative">
                            <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="schoolName" 
                                value={schoolName} 
                                onChange={(e) => setSchoolName(e.target.value)} 
                                placeholder="Contoh: SDIT Al-Ikhlas"
                                className="pl-10 h-12 rounded-xl"
                            />
                        </div>
                    </div>
                )}
                
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="schoolCode" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {role === 'ADMIN' ? 'Buat Kode Sekolah Unik' : 'Masukkan Kode Sekolah'}
                    </Label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="schoolCode" 
                            value={schoolCode} 
                            onChange={(e) => setSchoolCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                            placeholder="Contoh: al-ikhlas" 
                            className="pl-10 h-12 rounded-xl"
                        />
                    </div>
                    <p className="text-[9px] text-muted-foreground italic">
                        {role === 'ADMIN' 
                            ? 'Gunakan huruf kecil, angka, dan tanda hubung. Tanpa spasi.' 
                            : 'Minta kode unik ini kepada pihak Guru/Sekolah Anda.'}
                    </p>
                </div>
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20">
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {role === 'ADMIN' ? 'Daftarkan Sekolah Saya' : 'Gabung ke Sekolah'}
            </Button>
        </CardContent>
      </Card>
    </main>
  );
}
