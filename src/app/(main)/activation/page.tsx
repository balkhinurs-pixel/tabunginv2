
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ActivationPage() {
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleActivate = async () => {
    if (!activationCode) {
      toast({
        title: 'Kode Kosong',
        description: 'Silakan masukkan kode aktivasi Anda.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    const { data: codeData, error: codeError } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', activationCode)
        .single();
    
    if (codeError || !codeData) {
        toast({
            title: 'Aktivasi Gagal',
            description: 'Kode aktivasi yang Anda masukkan tidak valid.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    if (codeData.is_used) {
        toast({
            title: 'Kode Telah Digunakan',
            description: 'Kode aktivasi ini sudah pernah digunakan.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
         toast({ title: 'Gagal', description: 'Anda harus masuk untuk aktivasi.', variant: 'destructive' });
         setLoading(false);
         return;
    }

    const { error: updateError } = await supabase
        .from('activation_codes')
        .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() })
        .eq('id', codeData.id);

    if (updateError) {
        toast({ title: 'Aktivasi Gagal', description: 'Terjadi kesalahan saat aktivasi.', variant: 'destructive' });
    } else {
        toast({
            title: 'Aktivasi Berhasil!',
            description: 'Akun Anda telah berhasil diaktivasi. Semua fitur telah terbuka.',
        });
        // Here you would typically update the user's role or plan in your database
        // For example, in a 'profiles' table.
        router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold tracking-tight">Aktivasi Aplikasi</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Masukkan Kode Aktivasi</CardTitle>
          <CardDescription>
            Masukkan kode aktivasi yang telah Anda terima untuk membuka semua fitur dan meningkatkan kuota siswa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activation-code">Kode Aktivasi</Label>
            <Input
              id="activation-code"
              placeholder="PRO-XXXXX-XXXXX-XXXXX"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>
          <Button onClick={handleActivate} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Aktifkan Sekarang
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
