
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, Loader2, Upload, Palette, Layout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Student, Profile } from '@/types';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

// Helper function to fetch image as base64
const getImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
            const reader = new FileReader();
            reader.onloadend = function () {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject('Failed to convert blob to base64');
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = reject;
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    });
};

const CARD_COLORS = [
    { name: 'Biru Tabungin', value: '#3B82F6' },
    { name: 'Emerald Green', value: '#10B981' },
    { name: 'Midnight Purple', value: '#6366F1' },
    { name: 'Deep Rose', value: '#E11D48' },
    { name: 'Sunset Orange', value: '#F59E0B' },
    { name: 'Dark Slate', value: '#1E293B' },
];

export default function PrintCardsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  
  // Customization States
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [cardTemplate, setCardTemplate] = useState('standard');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast({ title: 'Anda tidak login', variant: 'destructive'});
            setLoading(false);
            return;
        }

        const [
            { data: studentsData, error: studentsError },
            { data: profileData, error: profileError }
        ] = await Promise.all([
             supabase.from('students').select('id, nis, name, class').order('name', { ascending: true }),
             supabase.from('profiles').select('*').eq('id', user.id).single()
        ]);
       
        if (studentsError || profileError) {
            toast({
                title: 'Gagal memuat data',
                description: studentsError?.message || profileError?.message,
                variant: 'destructive'
            });
        } else {
            setStudents(studentsData as Student[]);
            setProfile(profileData as Profile);
            if (studentsData && studentsData.length > 0) {
                setSelectedStudentId(studentsData[0].id);
            }
        }
        setLoading(false);
    };
    fetchData();
  }, [toast, supabase]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCustomLogo(reader.result as string);
            toast({ title: "Logo Berhasil Diunggah", description: "Logo akan muncul di preview kartu." });
        };
        reader.readAsDataURL(file);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [59, 130, 246];
  };

  const drawCard = async (doc: jsPDF, x: number, y: number, student: { nis: string, name: string, class: string }, schoolCode: string) => {
    const cardWidth = 85.6;
    const cardHeight = 53.98;
    const qrData = `${student.nis},${schoolCode}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    const [r, g, b] = hexToRgb(accentColor);
    
    let logoBase64 = customLogo;
    let qrBase64: string | null = null;

    try {
        if (!logoBase64) {
            logoBase64 = await getImageAsBase64('https://picsum.photos/seed/logoschool/200/200');
        }
        qrBase64 = await getImageAsBase64(qrUrl);
    } catch (error) {
        console.error("Failed to fetch images for PDF:", error);
        return;
    }

    // Background & Borders
    doc.setDrawColor(224, 224, 224);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3);
    
    if (cardTemplate === 'modern') {
        doc.setFillColor(r, g, b);
        doc.rect(x, y, 5, cardHeight, 'F');
    } else if (cardTemplate === 'elegant') {
        doc.setFillColor(r, g, b);
        doc.rect(x, y, cardWidth, 12, 'F');
    }

    // Logo
    if (logoBase64) {
        const logoY = cardTemplate === 'elegant' ? y + 2 : y + 5;
        doc.addImage(logoBase64, 'PNG', x + cardWidth - 15, logoY, 10, 10);
    }

    // Header Text
    doc.setFont('helvetica', 'bold');
    if (cardTemplate === 'elegant') {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('KARTU TABUNGAN SISWA', x + 5, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text(profile?.school_name || 'Sekolah Anda', x + 5, y + 8);
    } else {
        doc.setTextColor(r, g, b);
        doc.setFontSize(8);
        doc.text('KARTU TABUNGAN SISWA', x + (cardTemplate === 'modern' ? 10 : 5), y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(6);
        doc.text(profile?.school_name || 'Sekolah Anda', x + (cardTemplate === 'modern' ? 10 : 5), y + 10);
    }
  
    // QR Code
    if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', x + (cardTemplate === 'modern' ? 10 : 5), y + 15, 22, 22);
    }
    
    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(student.name, x + 35, y + 24);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(`NIS: ${student.nis}`, x + 35, y + 30);
    doc.text(`Kelas: ${student.class}`, x + 35, y + 34);
    doc.text(`Kode: ${schoolCode}`, x + 35, y + 38);
  
    // Footer
    doc.setFontSize(6);
    doc.setTextColor(156, 163, 175);
    doc.text('Gunakan kartu ini untuk transaksi & login', x + cardWidth / 2, y + cardHeight - 4, { align: 'center' });
  };
  
  const handlePrintSingleCard = async () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student || !profile?.school_code) return;
    setIsGenerating(true);
  
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 53.98]
    });
  
    await drawCard(doc, 0, 0, student, profile.school_code);
    doc.save(`kartu-${student.nis}.pdf`);
    setIsGenerating(false);
  };

  const handlePrintAllCards = async () => {
    if (students.length === 0 || !profile?.school_code) return;
    setIsGenerating(true);
    toast({ title: "Membuat PDF...", description: "Mohon tunggu sebentar." });

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const cardWidth = 85.6;
    const cardHeight = 53.98;
    const marginX = 10;
    const marginY = 15;
    const cardsPerRow = 2;
    const cardsPerCol = 5;
    const cardsPerPage = cardsPerRow * cardsPerCol;

    for (let index = 0; index < students.length; index++) {
        const student = students[index];
        if (index > 0 && index % cardsPerPage === 0) {
            doc.addPage();
        }

        const i = index % cardsPerPage;
        const row = Math.floor(i / cardsPerRow);
        const col = i % cardsPerRow;

        const x = marginX + col * (cardWidth + 10);
        const y = marginY + row * (cardHeight + 5);

        await drawCard(doc, x, y, student, profile.school_code);
    }

    doc.save('semua-kartu-tabungan.pdf');
    setIsGenerating(false);
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const qrPreviewUrl = selectedStudent && profile?.school_code 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${selectedStudent.nis},${profile.school_code}`)}` 
    : '';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold tracking-tight">Kustomisasi & Cetak Kartu</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" /> Desain Kartu
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Template Gaya</Label>
                        <Select value={cardTemplate} onValueChange={setCardTemplate}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="standard">Standar (Klasik)</SelectItem>
                                <SelectItem value="modern">Modern (Sidebar)</SelectItem>
                                <SelectItem value="elegant">Elegan (Header)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Warna Aksen</Label>
                        <div className="grid grid-cols-6 gap-2">
                            {CARD_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => setAccentColor(color.value)}
                                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${accentColor === color.value ? 'border-black scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Logo Sekolah</Label>
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Unggah Logo Baru
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Download className="h-4 w-4 text-primary" /> Aksi Cetak
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2 mb-4">
                        <Label>Pilih Siswa</Label>
                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={loading || students.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={loading ? "Memuat..." : "Pilih siswa..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map(student => (
                                    <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handlePrintSingleCard} disabled={isGenerating || !selectedStudent}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Unduh Kartu Tunggal
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={handlePrintAllCards} disabled={isGenerating || students.length === 0}>
                        Cetak Semua ({students.length} Kartu)
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
            <div className="sticky top-24">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold flex items-center gap-2 text-muted-foreground uppercase text-xs tracking-widest">
                        <Layout className="h-3 w-3" /> Live Preview
                    </h3>
                    <div className="h-px flex-1 bg-border mx-4" />
                </div>

                <div className="flex justify-center">
                    <div 
                        className="relative w-full max-w-[450px] aspect-[1.586/1] rounded-2xl shadow-2xl overflow-hidden bg-white border border-gray-100 transition-all duration-300"
                        style={{ boxShadow: `0 20px 50px -12px ${accentColor}33` }}
                    >
                        {/* Template Elements */}
                        {cardTemplate === 'modern' && <div className="absolute left-0 top-0 bottom-0 w-4" style={{ backgroundColor: accentColor }} />}
                        {cardTemplate === 'elegant' && <div className="absolute top-0 left-0 right-0 h-16" style={{ backgroundColor: accentColor }} />}

                        <div className={`h-full flex flex-col p-6 relative z-10 ${cardTemplate === 'elegant' ? 'text-white' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`font-black text-sm tracking-tighter ${cardTemplate === 'elegant' ? 'text-white' : ''}`} style={{ color: cardTemplate === 'elegant' ? 'white' : accentColor }}>
                                        KARTU TABUNGAN SISWA
                                    </p>
                                    <p className={`text-[10px] font-medium opacity-80 ${cardTemplate === 'elegant' ? 'text-white/80' : 'text-gray-500'}`}>
                                        {profile?.school_name || 'Nama Sekolah Anda'}
                                    </p>
                                </div>
                                <div className="h-10 w-10 relative bg-white rounded-full p-1 shadow-sm border border-gray-50">
                                    <Image 
                                        src={customLogo || 'https://picsum.photos/seed/logoschool/100/100'} 
                                        alt="Logo" 
                                        fill 
                                        className="object-contain rounded-full" 
                                    />
                                </div>
                            </div>

                            <div className={`mt-8 flex gap-6 items-center ${cardTemplate === 'elegant' ? 'mt-12 text-gray-900' : ''}`}>
                                <div className="bg-white p-2 rounded-xl shadow-md border border-gray-100 flex-shrink-0">
                                    {qrPreviewUrl ? (
                                        <Image src={qrPreviewUrl} width={90} height={90} alt="QR" className="rounded-lg" />
                                    ) : (
                                        <div className="w-[90px] h-[90px] bg-gray-100 animate-pulse rounded-lg" />
                                    )}
                                </div>
                                <div className={`flex flex-col gap-1 ${cardTemplate === 'elegant' ? 'translate-y-2' : ''}`}>
                                    <p className="font-bold text-xl tracking-tight text-gray-900 leading-tight">
                                        {selectedStudent?.name || 'Nama Lengkap Siswa'}
                                    </p>
                                    <div className="space-y-0.5 mt-2">
                                        <p className="text-xs font-semibold text-gray-500">NIS: <span className="text-gray-800">{selectedStudent?.nis || '000000'}</span></p>
                                        <p className="text-xs font-semibold text-gray-500">KELAS: <span className="text-gray-800">{selectedStudent?.class || 'X-A'}</span></p>
                                        <p className="text-xs font-semibold text-gray-500">KODE: <span className="text-gray-800">{profile?.school_code || 'SCHOOL'}</span></p>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-auto text-[9px] text-center font-bold text-gray-400 uppercase tracking-widest opacity-60">
                                Digunakan untuk Transaksi & Login Mandiri
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
