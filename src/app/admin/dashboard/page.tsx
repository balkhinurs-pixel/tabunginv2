
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Key, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface DashboardStats {
    totalUsers: number;
    proUsers: number;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
        setLoading(true);

        const { data: profiles, error } = await supabase.from('profiles').select('plan');

        if (error) {
            console.error("Error fetching stats:", error);
        } else {
            const totalUsers = profiles.length;
            const proUsers = profiles.filter(p => p.plan === 'PRO').length;
            setStats({ totalUsers, proUsers });
        }

        setLoading(false);
    };

    fetchStats();
  }, [supabase]);

  const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value: string | number, icon: React.ElementType, loading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="h-8 w-24 mt-1 rounded-md animate-pulse bg-muted" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
      </Card>
  );

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground">Selamat datang di panel kontrol aplikasi Anda.</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title="Total Pengguna"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            loading={loading}
          />
          <StatCard 
            title="Akun Aktif (Premium)"
            value={stats?.proUsers ?? 0}
            icon={Key}
            loading={loading}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground">Fitur pendapatan belum aktif</p>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
