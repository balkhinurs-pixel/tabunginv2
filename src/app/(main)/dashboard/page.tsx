import Link from 'next/link';
import { Users, QrCode, FileText, ShieldCheck, Search, ArrowRight, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ActionButton = ({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href?: string }) => {
  const content = (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-secondary hover:bg-primary/10 border-0">
        <Icon className="h-6 w-6 text-primary" />
      </Button>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};


const BackpackIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 7h16" />
        <path d="M8 5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
        <path d="M9.5 12.5h2" />
        <path d="M12.5 15.5h-2a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h2" />
        <path d="M10.5 15.5v-3" />
    </svg>
)

export default function DashboardPage() {
  const totalBalance = 5475000;
  
  return (
    <div className="space-y-6">
      <Card className="bg-primary text-primary-foreground shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-2 rounded-lg">
                <BackpackIcon className="h-6 w-6 text-white"/>
            </div>
            <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90">TRIAL</Badge>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-80">Total Saldo Semua Siswa</span>
              <EyeOff className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-4xl font-bold tracking-tight">
              {totalBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs opacity-80 mt-1">Kuota Siswa Digunakan: 1 / 5</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-sm">Cari Siswa (via NIS)</p>
          <div className="flex gap-2">
            <Input placeholder="Masukkan NIS siswa..." />
            <Button>
              <Search className="mr-2 h-4 w-4" /> Cari
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex justify-around">
            <ActionButton icon={Users} label="Data Siswa" href="/profiles" />
            <ActionButton icon={QrCode} label="Cetak Kartu" href="/print-cards"/>
            <ActionButton icon={FileText} label="Laporan" href="/reports"/>
            <ActionButton icon={ShieldCheck} label="Aktivasi" />
        </CardContent>
      </Card>

      <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Transaksi Terkini</h3>
                <Button variant="link" className="text-primary h-auto p-0">
                    Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
            <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Belum ada transaksi terbaru dalam 2 hari terakhir.</p>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
