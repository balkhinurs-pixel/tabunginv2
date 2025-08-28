
'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
  } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Download, Upload, Filter, Search, ShieldCheck, User, KeyRound, Pencil, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudent } from '@/context/StudentContext';


export default function ProfilesPage() {
  const { students } = useStudent();
  return (
    <div className="flex flex-col gap-4">
      <div className='flex items-center justify-between'>
        <h2 className="text-2xl font-bold tracking-tight">Data Siswa</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Siswa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="nis">NIS (Nomor Induk Siswa)</Label>
                      <Input id="nis" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="fullName">Nama Lengkap</Label>
                      <Input id="fullName" />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="class">Kelas</Label>
                      <Input id="class" />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="whatsapp">Nomor WhatsApp Wali (Opsional)</Label>
                      <Input id="whatsapp" placeholder="Contoh: 6281234567890" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="pin">PIN Siswa (untuk Login)</Label>
                      <Input id="pin" defaultValue="123456" />
                  </div>
                </div>
                <DialogFooter className="grid grid-cols-2 gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Batal</Button>
                  </DialogClose>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" /> Simpan Siswa
                  </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Unduh Template
        </Button>
      </div>
      <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Import (CSV)
      </Button>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3 text-center">
            <p className="text-sm text-blue-800 font-medium">Kuota Siswa Digunakan: {students.length} / 5</p>
        </CardContent>
      </Card>
      
      <Card>
          <CardContent className="p-4 space-y-4">
            <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-muted-foreground'><Filter className='h-4 w-4' /> Filter Kelas:</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        <SelectItem value="7a">7A</SelectItem>
                        <SelectItem value="7b">7B</SelectItem>
                        <SelectItem value="8a">8A</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className='space-y-2'>
                <Label htmlFor='search'>Cari Siswa (NIS, Nama):</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="search" placeholder="Ketik untuk mencari..." className="pl-10" />
                </div>
            </div>
          </CardContent>
      </Card>

      <Card className="text-center">
          <CardContent className="p-6 space-y-3">
              <div className='flex justify-center'>
                <div className="p-2 bg-primary/10 rounded-full inline-block">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold">Aktivasi Aplikasi Anda</h3>
              <p className="text-muted-foreground text-sm">Buka kuota hingga 32 siswa dan dapatkan akses penuh.</p>
              <Button>Lihat Opsi Aktivasi</Button>
          </CardContent>
      </Card>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Menampilkan 1 - {students.length} dari {students.length} data</p>
        <div className="rounded-lg border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>PROFIL</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>NAMA</TableHead>
                <TableHead>KELAS</TableHead>
                <TableHead>AKSI</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map((student) => (
                <TableRow key={student.id}>
                    <TableCell>
                        <Button variant="outline" size="icon" className='h-8 w-8' asChild>
                            <Link href={`/profiles/${student.id}`}>
                                <User className="h-4 w-4" />
                            </Link>
                        </Button>
                    </TableCell>
                    <TableCell className="font-medium">{student.nis}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                        <div className='flex items-center gap-2'>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className='h-8 w-8 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600'>
                                        <KeyRound className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reset Kata Sandi</DialogTitle>
                                        <DialogDescription>
                                            Masukkan kata sandi baru untuk siswa {student.name}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="new-password" className="text-right">
                                            Sandi Baru
                                            </Label>
                                            <Input id="new-password" type="password" className="col-span-3" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Reset Kata Sandi</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className='h-8 w-8 border-yellow-500 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600'>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                 <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Ubah Profil Siswa</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-name" className="text-right">
                                            Nama
                                            </Label>
                                            <Input id="edit-name" defaultValue={student.name} className="col-span-3" />
                                        </div>
                                         <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-class" className="text-right">
                                            Kelas
                                            </Label>
                                            <Input id="edit-class" defaultValue={student.class} className="col-span-3" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Simpan Perubahan</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className='h-8 w-8 border-destructive text-destructive hover:bg-destructive/10'>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Hapus Siswa?</DialogTitle>
                                        <DialogDescription>
                                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus profil dan semua data terkait untuk {student.name}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="ghost">Batal</Button>
                                        <Button variant="destructive">Ya, Hapus</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
