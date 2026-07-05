
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Loader2, School, UtensilsCrossed, ShieldCheck, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { AuthUser } from '@supabase/supabase-js';
import { AppLogo } from '@/components/AppLogo';
import { cn } from '@/lib/utils';
import { registerUserRoleAction } from './actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            setUser(authUser);
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, school_code')
                .eq('id', authUser.id)
                .maybeSingle();
            
            if (profile && profile.role !== 'USER' && profile.role !== 'STUDENT') {
                const destination = profile.role === 'CANTINE' ? '/cantine/outlet' : '/dashboard';
                router.replace(destination);
            }
        } else {
            router.push('/login');
        }
    }
    fetchUser();
  }, [supabase, router]);

  const handleSaveSettings = async () => {
    if (!user || !user.email) return;
    
    if (role === 'ADMIN' && !schoolName) {
        toast({ title: "Nama Sekolah Wajib Diisi", variant: 'destructive' });
        return;
    }
    if (!schoolCode) {
        toast({ title: "Kode Sekolah Wajib Diisi", variant: 'destructive' });
        return;
    }

    setSaving(true);
    
    const result = await registerUserRoleAction({
        role: role,
        schoolName: schoolName,
        schoolCode: schoolCode
    });
    
    setSaving(false);

    if (!result.success) {
        toast({ 
            title: "Gagal", 
            description: result.message, 
            variant: 'destructive' 
        });
    } else {
        toast({ title: "Berhasil!", description: "Profil Anda telah dikonfigurasi." });
        const destination = role === 'CANTINE' ? '/cantine/outlet' : '/dashboard';
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

            {role === 'CANTINE' && (
                <Alert className="bg-blue-50 border-blue-200 text-blue-800 animate-in fade-in zoom-in-95 duration-300">
                    <Info className="h-4 w-4 text-blue-700" />
                    <AlertDescription className="text-[11px] leading-relaxed">
                        Akun Kantin harus terhubung ke sekolah. Silakan masukkan <strong>Kode Unik Sekolah</strong> yang diberikan oleh pihak Guru/Admin sekolah Anda.
                    </AlertDescription>
                </Alert>
            )}

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
                            placeholder={role === 'ADMIN' ? "Contoh: al-ikhlas" : "Masukkan kode dari Guru"} 
                            className="pl-10 h-12 rounded-xl border-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <p className="text-[9px] text-muted-foreground italic">
                        {role === 'ADMIN' 
                            ? 'Gunakan huruf kecil dan angka saja. Kode ini akan dipakai login oleh siswa & kantin.' 
                            : 'Minta kode unik sekolah kepada Guru Anda.'}
                    </p>
                </div>
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 transition-all active:scale-95">
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {role === 'ADMIN' ? 'Daftarkan Sekolah Saya' : 'Hubungkan ke Sekolah'}
            </Button>
        </CardContent>
      </Card>
    </main>
  );
}
