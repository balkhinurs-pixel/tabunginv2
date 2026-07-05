
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Banknote, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import CantineManagement from '../settings/_components/CantineManagement';
import SettlementManagement from '../settings/_components/SettlementManagement';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TeacherSettlementPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('school_code')
                .eq('id', user.id)
                .single();
            
            if (data) setSchoolCode(data.school_code);
        }
        setLoading(false);
    }
    fetchProfile();
  }, [supabase]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold tracking-tight text-primary">Manajemen Kantin & Keuangan</h2>
      </div>

      <Tabs defaultValue="settle" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 rounded-2xl bg-muted/50 p-1.5 h-14">
          <TabsTrigger value="settle" className="rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2">
             <Banknote className="h-4 w-4" /> Settlement
          </TabsTrigger>
          <TabsTrigger value="outlets" className="rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2">
             <UtensilsCrossed className="h-4 w-4" /> Outlet Kantin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settle" className="space-y-4">
            <Card className="shadow-sm border-emerald-100 overflow-hidden">
                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        <CardTitle>Pencairan Omzet Kantin</CardTitle>
                    </div>
                    <CardDescription>Berikan uang tunai kepada pengelola kantin berdasarkan saldo virtual mereka.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <SettlementManagement />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="outlets" className="space-y-4">
            <Card className="shadow-sm border-orange-100">
                <CardHeader className="bg-orange-50/50 border-b border-orange-100">
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                        <CardTitle>Akun Petugas Kantin</CardTitle>
                    </div>
                    <CardDescription>Daftarkan atau hapus akses akun login untuk penjual di kantin sekolah.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="h-20 animate-pulse bg-muted rounded-xl" />
                    ) : schoolCode ? (
                        <CantineManagement />
                    ) : (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Mohon atur <strong>Kode Sekolah</strong> di menu Pengaturan terlebih dahulu.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
