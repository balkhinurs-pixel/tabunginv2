'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Trash2, DatabaseZap } from 'lucide-react';

export default function SettingsPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>('https://picsum.photos/seed/burgerking/128/128');
  const [fileName, setFileName] = useState<string>('logo.png');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePreview = () => {
    setLogoPreview(null);
    setFileName('');
    // Also reset the file input if needed
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Pengaturan Aplikasi & Akun</h2>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Sekolah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">Nama Sekolah/Instansi Anda</Label>
            <Input id="schoolName" defaultValue="ribath5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolCode">Kode Unik Sekolah (untuk Login Siswa)</Label>
            <Input id="schoolCode" defaultValue="ribath5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Upload Logo (Max 500KB, PNG/JPG)</Label>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  Pilih File
                </label>
              </Button>
              <Input
                id="logo-upload"
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
              <span className="text-sm text-muted-foreground">
                {fileName || 'Tidak ada file yang dipilih'}
              </span>
            </div>
          </div>
          {logoPreview && (
            <div className="space-y-2">
                <Label>Preview Logo:</Label>
                <div className="p-4 border rounded-lg flex flex-col items-center gap-4 w-48">
                    <Image
                        src={logoPreview}
                        alt="Logo Preview"
                        width={128}
                        height={128}
                        className="rounded-md object-contain"
                        data-ai-hint="company logo"
                    />
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemovePreview}
                        className='w-full'
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Preview
                    </Button>
                </div>
            </div>
          )}
           <Button className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Simpan Pengaturan Sekolah
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Aplikasi</CardTitle>
        </CardHeader>
        <CardContent>
            <Button variant="secondary" className="w-full justify-start">
                <DatabaseZap className="mr-2 h-4 w-4" />
                Backup & Restore Data
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
