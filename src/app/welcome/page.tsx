
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Loader2, School } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { AuthUser } from '@supabase/supabase-js';
import { AppLogo } from '@/components/AppLogo';

export default function WelcomePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [saving, setSaving] = useState(false);

  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
        } else {
            router.push('/login'); // Should be caught by middleware, but as a fallback
        }
    }
    fetchUser();
  }, [supabase, router]);

  const handleSaveSettings = async () => {
    if (!user) return;
    if (!schoolName) {
        toast({ title: "Nama Sekolah Wajib Diisi", variant: 'destructive' });
        return;
    }
    if (!schoolCode) {
        toast({ title: "Kode Sekolah Wajib Diisi", description: "Mohon isi kode unik untuk sekolah Anda.", variant: 'destructive' });
        return;
    }

    setSaving(true);
    const sanitizedCode = schoolCode.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const { error } = await supabase
        .from('profiles')
        .update({
            school_name: schoolName,
            school_code: sanitizedCode,
        })
        .eq('id', user.id);
    
    setSaving(false);

    if (error) {
        toast({ title: "Gagal Menyimpan", description: "Kode sekolah mungkin sudah digunakan. Coba kode lain.", variant: 'destructive' });
    } else {
        toast({ title: "Pengaturan Disimpan", description: "Informasi sekolah Anda telah berhasil disimpan." });
        router.push('/dashboard');
        router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <AppLogo />
            </div>
            <CardTitle className="text-2xl">Selamat Datang!</CardTitle>
            <CardDescription>
                Satu langkah lagi. Mohon atur informasi sekolah Anda untuk memulai.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName">Nama Sekolah/Instansi Anda</Label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="schoolName" 
                    value={schoolName} 
                    onChange={(e) => setSchoolName(e.target.value)} 
                    placeholder="Contoh: SDIT Al-Ikhlas"
                    className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolCode">Kode Unik Sekolah (untuk Login Siswa)</Label>
               <Input 
                    id="schoolCode" 
                    value={schoolCode} 
                    onChange={(e) => setSchoolCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                    placeholder="Contoh: al-ikhlas" 
                />
              <p className="text-xs text-muted-foreground">Hanya huruf kecil, angka, dan tanda hubung (-). Tanpa spasi. Kode ini harus unik.</p>
            </div>
            <Button onClick={handleSaveSettings} disabled={saving} className="w-full h-11">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan dan Lanjutkan
            </Button>
        </CardContent>
      </Card>
    </main>
  );
}
