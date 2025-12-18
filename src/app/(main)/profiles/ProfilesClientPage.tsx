
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { PlusCircle, Download, Upload, Filter, Search, ShieldCheck, User, KeyRound, Pencil, Trash2, Save, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Student, Profile } from '@/types';
import type { AuthUser } from '@supabase/supabase-js';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addStudentAction, updateStudentAction, deleteStudentAction } from './actions';

type BoundAddStudentAction = (formData: FormData) => Promise<{success: boolean; message: string; student?: Student;}>;
type BoundUpdateStudentAction = (formData: FormData) => Promise<{success: boolean; message: string; student?: Student;}>;
type BoundDeleteStudentAction = (studentId: string) => Promise<{success: boolean; message: string;}>;

interface ProfilesClientPageProps {
    initialStudents: Student[];
    initialProfile: Profile | null;
    initialUser: AuthUser | null;
    addStudentAction: BoundAddStudentAction;
    updateStudentAction: BoundUpdateStudentAction;
    deleteStudentAction: BoundDeleteStudentAction;
}

const EditStudentDialog = ({ student, onStudentUpdated, updateStudentAction }: { student: Student; onStudentUpdated: (updatedStudent: Student) => void; updateStudentAction: BoundUpdateStudentAction }) => {
    const { toast } = useToast();
    
    const [nis, setNis] = useState(student?.nis || '');
    const [name, setName] = useState(student?.name || '');
    const [studentClass, setStudentClass] = useState(student?.class || '');
    const [whatsappNumber, setWhatsappNumber] = useState(student?.whatsapp_number || '');
    const [pin, setPin] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (student && open) {
            setNis(student.nis);
            setName(student.name);
            setStudentClass(student.class);
            setWhatsappNumber(student.whatsapp_number || '');
            setPin('');
        }
    }, [student, open]);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const result = await updateStudentAction(formData);
        setLoading(false);

        if (result.success && result.student) {
            onStudentUpdated(result.student);
            toast({
                title: 'Siswa Diperbarui',
                description: result.message,
            });
            setOpen(false);
        } else {
             toast({
                title: 'Gagal Memperbarui Siswa',
                description: result.message,
                variant: 'destructive',
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className='h-8 w-8 border-yellow-500 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600'>
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form action={handleSubmit} ref={formRef}>
                <DialogHeader>
                    <DialogTitle>Ubah Profil Siswa</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <input type="hidden" name="id" value={student.id} />
                    <div className="space-y-2">
                        <Label htmlFor="edit-nis">NIS (Nomor Induk Siswa)</Label>
                        <Input id="edit-nis" name="nis" value={nis} onChange={(e) => setNis(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-fullName">Nama Lengkap</Label>
                        <Input id="edit-fullName" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-class">Kelas</Label>
                        <Input id="edit-class" name="class" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-whatsapp">Nomor WhatsApp Wali (Opsional)</Label>
                        <Input id="edit-whatsapp" name="whatsapp_number" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="Contoh: 6281234567890" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-pin">PIN Siswa (untuk Login)</Label>
                        <Input id="edit-pin" name="pin" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Biarkan untuk tidak mengubah" />
                         <Alert variant="default" className="mt-2 text-blue-800 bg-blue-50 border-blue-200">
                           <Info className="h-4 w-4 !text-blue-800" />
                           <AlertDescription>
                            Isi hanya jika Anda ingin mereset PIN siswa. Biarkan kosong jika tidak ada perubahan.
                           </AlertDescription>
                        </Alert>
                    </div>
                </div>
                <DialogFooter className="grid grid-cols-2 gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" type="button">Batal</Button>
                    </DialogClose>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Simpan Perubahan
                    </Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>
    )
}

const DeleteStudentDialog = ({ studentId, studentName, onStudentDeleted, deleteStudentAction }: { studentId: string; studentName: string; onStudentDeleted: (studentId: string) => void; deleteStudentAction: BoundDeleteStudentAction }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteStudentAction(studentId);
        setLoading(false);

        if (result.success) {
            onStudentDeleted(studentId);
            toast({
                title: 'Siswa Dihapus',
                description: result.message,
            });
            setOpen(false);
        } else {
            toast({
                title: 'Gagal Menghapus Siswa',
                description: result.message,
                variant: 'destructive'
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className='h-8 w-8 border-destructive text-destructive hover:bg-destructive/10'>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus Siswa?</DialogTitle>
                    <DialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus profil, semua data transaksi, dan akun login siswa untuk {studentName}.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" disabled={loading}>Batal</Button></DialogClose>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ya, Hapus Secara Permanen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ProfilesClientPage({
    initialStudents,
    initialProfile,
    initialUser,
}: Omit<ProfilesClientPageProps, 'addStudentAction' | 'updateStudentAction' | 'deleteStudentAction'>) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(false); // Can be used for client-side loading if needed
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // State for AddStudentDialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const studentQuota = profile?.plan === 'PRO' ? 100 : 32;

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(student => student.id !== studentId));
  };
  
  const handleAddStudentSubmit = async (formData: FormData) => {
    setAddLoading(true);
    const result = await addStudentAction(formData);
    setAddLoading(false);

    if (result.success) {
        toast({
            title: 'Siswa Ditambahkan',
            description: result.message,
        });
        if (result.student) {
             setStudents(prev => [...prev, result.student!].sort((a,b) => a.name.localeCompare(b.name)));
        }
        formRef.current?.reset();
        setAddDialogOpen(false);
    } else {
        toast({
            title: 'Gagal Menambahkan Siswa',
            description: result.message,
            variant: 'destructive',
        });
    }
  }


  const uniqueClasses = useMemo(() => [...new Set(initialStudents.map(s => s.class))], [initialStudents]);

  const filteredStudents = useMemo(() => {
    return students
      .filter(student => {
        if (selectedClass === 'all') return true;
        return student.class === selectedClass;
      })
      .filter(student => {
        if (!searchTerm) return true;
        return (
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.nis.includes(searchTerm)
        );
      });
  }, [students, searchTerm, selectedClass]);


  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "nis,name,class,whatsapp_number,pin\n"
      + "24003,Contoh Siswa,9c,6281234567890,123456\n";
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

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast({ title: 'Fungsi Import Belum Tersedia', description: 'Fitur ini sedang dalam pengembangan dan akan segera hadir.', variant: 'default' });
    
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className='flex items-center justify-between'>
        <h2 className="text-2xl font-bold tracking-tight">Data Siswa</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Siswa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form action={handleAddStudentSubmit} ref={formRef}>
                <DialogHeader>
                  <DialogTitle>Tambah Siswa Baru</DialogTitle>
                  <DialogDescription>Akun login untuk siswa akan dibuat secara otomatis menggunakan kode sekolah Anda.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="nis">NIS (Nomor Induk Siswa)</Label>
                      <Input id="nis" name="nis" required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="fullName">Nama Lengkap</Label>
                      <Input id="fullName" name="name" required />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="class">Kelas</Label>
                      <Input id="class" name="class" required />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="whatsapp">Nomor WhatsApp Wali (Opsional)</Label>
                      <Input id="whatsapp" name="whatsapp_number" placeholder="Contoh: 6281234567890" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="pin">PIN Awal Siswa (untuk Login)</Label>
                      <Input id="pin" name="pin" defaultValue="123456" required />
                  </div>
                </div>
                <DialogFooter className="grid grid-cols-2 gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">Batal</Button>
                  </DialogClose>
                  <Button type="submit" disabled={addLoading}>
                    {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Siswa
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Unduh Template
        </Button>
      </div>
      <Button variant="outline" onClick={handleImportClick} disabled>
        <Upload className="mr-2 h-4 w-4" /> Import (CSV) - Segera Hadir
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
            <p className="text-sm text-blue-800 font-medium">Kuota Siswa Digunakan: {students.length} / {studentQuota}</p>
        </CardContent>
      </Card>
      
      <Card>
          <CardContent className="p-4 space-y-4">
            <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-muted-foreground'><Filter className='h-4 w-4' /> Filter Kelas:</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                        <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className='space-y-2'>
                <Label htmlFor='search'>Cari Siswa (NIS, Nama):</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="search" placeholder="Ketik untuk mencari..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
          </CardContent>
      </Card>

      {profile?.plan === 'TRIAL' && (
        <Card className="text-center">
            <CardContent className="p-6 space-y-3">
                <div className='flex justify-center'>
                  <div className="p-2 bg-primary/10 rounded-full inline-block">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold">Aktivasi Akun PRO Anda</h3>
                <p className="text-muted-foreground text-sm">Buka kuota hingga {studentQuota} siswa dan dapatkan akses penuh.</p>
                <Button asChild>
                  <Link href="/activation">
                      Aktivasi Sekarang
                  </Link>
                </Button>
            </CardContent>
        </Card>
      )}

      <div>
        <p className="text-sm text-muted-foreground mb-2">Menampilkan {filteredStudents.length} dari {students.length} data</p>
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
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Memuat data siswa...
                        </TableCell>
                    </TableRow>
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
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
                                <EditStudentDialog student={student} onStudentUpdated={handleUpdateStudent} updateStudentAction={updateStudentAction} />
                                <DeleteStudentDialog studentId={student.id} studentName={student.name} onStudentDeleted={handleDeleteStudent} deleteStudentAction={deleteStudentAction} />
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                           {searchTerm || selectedClass !== 'all' ? 'Tidak ada siswa yang cocok dengan filter Anda.' : 'Belum ada siswa yang ditambahkan.'}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
