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
import { PlusCircle, Download, Upload, Filter, Search, ShieldCheck, User, KeyRound, Pencil, Trash2, Save, Loader2, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Student, Profile } from '@/types';
import type { AuthUser } from '@supabase/supabase-js';
import { Alert, AlertDescription } from '@/components/ui/alert';

// These types define the shape of the Server Actions that will be passed as props.
type BoundAddStudentAction = (formData: FormData) => Promise<{success: boolean; message: string; student?: Student;}>;
type BoundUpdateStudentAction = (formData: FormData) => Promise<{success: boolean; message: string; student?: Student;}>;
type BoundDeleteStudentAction = (studentId: string) => Promise<{success: boolean; message: string;}>;
type BoundImportStudentsAction = (csvContent: string) => Promise<{success: boolean; message: string; importedCount: number; newStudents: Student[]}>;


interface ProfilesClientPageProps {
    initialStudents: Student[];
    initialProfile: Profile | null;
    initialUser: AuthUser | null;
    addStudentAction: BoundAddStudentAction;
    updateStudentAction: BoundUpdateStudentAction;
    deleteStudentAction: BoundDeleteStudentAction;
    importStudentsAction: BoundImportStudentsAction;
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
    addStudentAction,
    updateStudentAction,
    deleteStudentAction,
    importStudentsAction,
}: ProfilesClientPageProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // State for AddStudentDialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const studentQuota = profile?.plan === 'PRO' ? 40 : 5;
  const proStudentQuota = 40;

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

    setImporting(true);
    toast({ title: 'Mengimpor siswa...', description: 'Mohon tunggu, ini mungkin memakan waktu beberapa saat.' });

    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target?.result as string;
        const result = await importStudentsAction(content);
        
        if (result.success) {
            toast({
                title: 'Impor Berhasil',
                description: result.message,
            });
            // Add new students to the local state to update UI
            setStudents(prev => [...prev, ...result.newStudents].sort((a,b) => a.name.localeCompare(b.name)));
        } else {
            toast({
                title: 'Impor Gagal',
                description: result.message,
                variant: 'destructive',
                duration: 10000,
            });
        }
        setImporting(false);
    };
    reader.readAsText(file);
    
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
      <Button variant="outline" onClick={handleImportClick} disabled={importing}>
        {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Import (CSV)
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
      
      {profile?.plan === 'TRIAL' && (
        <Card className="bg-gradient-to-br from-primary to-blue-800 text-primary-foreground shadow-lg">
            <CardContent className="p-6 space-y-4">
                <div className='flex items-center gap-4'>
                    <div className="p-3 bg-white/20 rounded-full">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Aktivasi Akun PRO Anda</h3>
                        <p className="text-primary-foreground/80 text-sm">Buka kuota hingga <span className="font-bold">{proStudentQuota} siswa</span> dan dapatkan akses penuh.</p>
                    </div>
                </div>
                <Button asChild variant="secondary" className="w-full justify-center group bg-white text-primary hover:bg-white/90">
                    <Link href="/activation">
                        Aktivasi Sekarang <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
