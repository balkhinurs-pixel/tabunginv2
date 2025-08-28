
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function PrintCardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold tracking-tight">Cetak Kartu Siswa (PDF)</h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
                <Label>Pilih Siswa (untuk preview & unduh PDF tunggal)</Label>
                <Select defaultValue="balkhi">
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih siswa..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="balkhi">balkhi (24001)</SelectItem>
                        <SelectItem value="jane">Jane Smith (24002)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Unduh Semua Kartu (PDF A4)
            </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold text-center">Preview Kartu</h3>
        <Card>
            <CardContent className="p-4 space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-primary text-sm">KARTU TABUNGAN SISWA</p>
                            <p className="text-xs text-muted-foreground">ribath5</p>
                        </div>
                        <Image src="https://picsum.photos/seed/burgerking/40/40" width={40} height={40} alt="Logo Sekolah" className="rounded-full" data-ai-hint="company logo" />
                    </div>

                    <div className="flex items-center gap-4">
                        <Image src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=24001" width={80} height={80} alt="QR Code" data-ai-hint="qr code" />
                        <div>
                            <p className="font-bold">balkhi</p>
                            <p className="text-sm text-muted-foreground">NIS: 24001</p>
                            <p className="text-sm text-muted-foreground">Kelas: 9a</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Gunakan kartu ini untuk transaksi & login</p>
                </div>
                <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh Kartu Ini (PDF)
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
