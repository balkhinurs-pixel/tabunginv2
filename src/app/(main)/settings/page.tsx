
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Trash2, DatabaseZap, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types';
import type { AuthUser } from '@supabase/supabase-js';
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
        setLoading(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            setUser(authUser);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) {
                toast({ title: "Gagal memuat profil", description: error.message, variant: 'destructive' });
            } else {
                setProfile(data);
                setSchoolName(data.school_name || '');
                setSchoolCode(data.school_code || '');
            }
        }
        setLoading(false);
    }
    fetchProfile();
  }, [supabase, toast]);

  const handleSaveSettings = async () => {
    if (!user) return;
    if (!schoolCode) {
        toast({ title: "Kode Sekolah Wajib Diisi", description: "Mohon isi kode unik untuk sekolah Anda.", variant: 'destructive' });
        return;
    }

    setSaving(true);
    const { error } = await supabase
        .from('profiles')
        .update({
            school_name: schoolName,
            school_code: schoolCode.toLowerCase().replace(/\s+/g, '-'), // Sanitize code
        })
        .eq('id', user.id);
    
    setSaving(false);
    if (error) {
        toast({ title: "Gagal Menyimpan", description: "Kode sekolah mungkin sudah digunakan. Coba kode lain.", variant: 'destructive' });
    } else {
        toast({ title: "Pengaturan Disimpan", description: "Informasi sekolah Anda telah diperbarui." });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Pengaturan Aplikasi & Akun</h2>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Sekolah</CardTitle>
          <CardDescription>Atur nama dan kode unik sekolah Anda. Kode ini akan digunakan oleh siswa saat mereka login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        {loading ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="schoolName">Nama Sekolah/Instansi Anda</Label>
              <Input id="schoolName" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Contoh: SDIT Al-Ikhlas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolCode">Kode Unik Sekolah (untuk Login Siswa)</Label>
              <Input id="schoolCode" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} placeholder="Contoh: al-ikhlas (tanpa spasi)" />
              <p className="text-xs text-muted-foreground">Gunakan huruf kecil, angka, dan tanda hubung (-). Kode ini harus unik.</p>
            </div>
            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Pengaturan Sekolah
            </Button>
          </>
        )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Aplikasi</CardTitle>
        </CardHeader>
        <CardContent>
            <Button variant="secondary" className="w-full justify-start" disabled>
                <DatabaseZap className="mr-2 h-4 w-4" />
                Backup & Restore Data (Segera Hadir)
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}

// Helper component for skeleton loading
const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);
