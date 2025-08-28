
'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/data/students';
import { initialStudents } from '@/data/students';
import { supabase } from '@/lib/supabase';


const AddStudentDialog = ({ onStudentAdded }: { onStudentAdded: (newStudent: Omit<Student, 'id' | 'transactions'>) => void }) => {
    const { toast } = useToast();
    const [nis, setNis] = useState('');
    const [name, setName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [open, setOpen] = useState(false);

    const handleSubmit = () => {
        if (!nis || !name || !studentClass) {
            toast({
                title: 'Data Tidak Lengkap',
                description: 'Mohon isi semua kolom yang wajib diisi.',
                variant: 'destructive',
            });
            return;
        }
        onStudentAdded({ nis, name, class: studentClass });
        toast({
            title: 'Siswa Ditambahkan',
            description: `Siswa baru dengan nama ${name} berhasil ditambahkan.`,
        });
        setNis('');
        setName('');
        setStudentClass('');
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                      <Input id="nis" value={nis} onChange={(e) => setNis(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="fullName">Nama Lengkap</Label>
                      <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="class">Kelas</Label>
                      <Input id="class" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} />
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
                  <Button onClick={handleSubmit}>
                    <Save className="mr-2 h-4 w-4" /> Simpan Siswa
                  </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const EditStudentDialog = ({ student, onStudentUpdated }: { student: Student; onStudentUpdated: (studentId: string, data: Omit<Student, 'id' | 'transactions'>) => void }) => {
    const { toast } = useToast();
    
    const [nis, setNis] = useState(student?.nis || '');
    const [name, setName] = useState(student?.name || '');
    const [studentClass, setStudentClass] = useState(student?.class || '');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (student) {
            setNis(student.nis);
            setName(student.name);
            setStudentClass(student.class);
        }
    }, [student, open]);

    const handleSubmit = () => {
        if (!nis || !name || !studentClass) {
            toast({
                title: 'Data Tidak Lengkap',
                description: 'Mohon isi semua kolom yang wajib diisi.',
                variant: 'destructive',
            });
            return;
        }
        onStudentUpdated(student.id, { nis, name, class: studentClass });
        toast({
            title: 'Siswa Diperbarui',
            description: `Data siswa ${name} berhasil diperbarui.`,
        });
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className='h-8 w-8 border-yellow-500 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600'>
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ubah Profil Siswa</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-nis">NIS (Nomor Induk Siswa)</Label>
                        <Input id="edit-nis" value={nis} onChange={(e) => setNis(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-fullName">Nama Lengkap</Label>
                        <Input id="edit-fullName" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-class">Kelas</Label>
                        <Input id="edit-class" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-whatsapp">Nomor WhatsApp Wali (Opsional)</Label>
                        <Input id="edit-whatsapp" placeholder="Contoh: 6281234567890" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-pin">PIN Siswa (untuk Login)</Label>
                        <Input id="edit-pin" defaultValue="123456" />
                    </div>
                </div>
                <DialogFooter className="grid grid-cols-2 gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Batal</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit}>
                        <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const DeleteStudentDialog = ({ studentId, studentName, onStudentDeleted }: { studentId: string; studentName: string; onStudentDeleted: (studentId: string) => void; }) => {
    const { toast } = useToast();

    const handleDelete = () => {
        onStudentDeleted(studentId);
        toast({
            title: 'Siswa Dihapus',
            description: `Data siswa ${studentName} telah dihapus.`,
            variant: 'destructive',
        });
    }

    return (
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
                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus profil dan semua data terkait untuk {studentName}.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Batal</Button></DialogClose>
                    <DialogClose asChild><Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ProfilesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // In a real scenario, you would fetch from Supabase here.
    // For now, we'll use the dummy data to keep the UI working.
    // Example:
    // const fetchStudents = async () => {
    //   const { data, error } = await supabase.from('students').select('*');
    //   if (error) {
    //     console.error('Error fetching students:', error);
    //     toast({ title: 'Error', description: 'Gagal mengambil data siswa.', variant: 'destructive' });
    //   } else {
    //     setStudents(data);
    //   }
    // };
    // fetchStudents();
    
    setStudents(initialStudents);
  }, []);

  const handleAddStudent = (studentData: Omit<Student, 'id' | 'transactions'>) => {
    // This will later be a Supabase insert
    const newStudent = {
      ...studentData,
      id: `s${Date.now()}`, // Temporary ID
      transactions: [],
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleUpdateStudent = (studentId: string, studentData: Omit<Student, 'id' | 'transactions'>) => {
    // This will later be a Supabase update
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, ...studentData } : student
      )
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    // This will later be a Supabase delete
    setStudents(prev => prev.filter(student => student.id !== studentId));
  };


  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "nis,name,class\n"
      + "24003,Contoh Siswa,9c\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
            toast({ title: 'File Kosong', description: 'File CSV tidak berisi data.', variant: 'destructive' });
            return;
        }

        const header = lines[0].trim().split(',');
        if (header[0] !== 'nis' || header[1] !== 'name' || header[2] !== 'class') {
            toast({ title: 'Format Salah', description: 'Pastikan header CSV adalah: nis,name,class', variant: 'destructive' });
            return;
        }
        
        let addedCount = 0;
        try {
            for (let i = 1; i < lines.length; i++) {
                const data = lines[i].trim().split(',');
                if (data.length === 3) {
                    const [nis, name, studentClass] = data;
                    if (nis && name && studentClass) {
                        handleAddStudent({ nis, name, class: studentClass });
                        addedCount++;
                    }
                }
            }
            if (addedCount > 0) {
                 toast({ title: 'Import Berhasil', description: `${addedCount} siswa berhasil diimpor.` });
            } else {
                 toast({ title: 'Tidak Ada Data Ditambahkan', description: 'Pastikan file CSV memiliki data yang valid.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Import Gagal', description: 'Terjadi kesalahan saat memproses file.', variant: 'destructive' });
        } finally {
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className='flex items-center justify-between'>
        <h2 className="text-2xl font-bold tracking-tight">Data Siswa</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AddStudentDialog onStudentAdded={handleAddStudent} />
        <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Unduh Template
        </Button>
      </div>
      <Button variant="outline" onClick={handleImportClick}>
        <Upload className="mr-2 h-4 w-4" /> Import (CSV)
      </Button>
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleFileImport}
      />

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
                             <EditStudentDialog student={student} onStudentUpdated={handleUpdateStudent} />
                             <DeleteStudentDialog studentId={student.id} studentName={student.name} onStudentDeleted={handleDeleteStudent} />
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

    