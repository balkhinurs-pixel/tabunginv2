
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Student } from '@/types';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

export default function PrintCardsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('students')
            .select('id, nis, name, class')
            .order('name', { ascending: true });

        if (error) {
            toast({
                title: 'Gagal memuat data siswa',
                description: error.message,
                variant: 'destructive'
            });
        } else {
            setStudents(data as Student[]);
            if (data && data.length > 0) {
                setSelectedStudentId(data[0].id);
            }
        }
        setLoading(false);
    };
    fetchStudents();
  }, [toast, supabase]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const drawCard = (doc: jsPDF, x: number, y: number, student: { nis: string, name: string, class: string }) => {
    const cardWidth = 85.6;
    const cardHeight = 53.98;
    const logoUrl = 'https://picsum.photos/seed/burgerking/40/40';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${student.nis}`;
  
    // Card border
    doc.setDrawColor(224, 224, 224); // light gray
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3);
  
    // Header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text('KARTU TABUNGAN SISWA', x + 5, y + 7);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('ribath5', x + 5, y + 10);
    
    // Logo (placeholder)
    // Note: jsPDF cannot directly draw from URL without CORS, we'll use a placeholder
    doc.setFillColor(209, 213, 219); // gray-300
    doc.circle(x + cardWidth - 8, y + 8, 4, 'F');
  
    // QR Code & Student Info
    doc.setFillColor(209, 213, 219); // gray-300
    doc.rect(x + 5, y + 15, 20, 20, 'F'); // QR placeholder
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(student.name, x + 30, y + 20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`NIS: ${student.nis}`, x + 30, y + 25);
    doc.text(`Kelas: ${student.class}`, x + 30, y + 30);
  
    // Footer
    doc.setFontSize(6);
    doc.text('Gunakan kartu ini untuk transaksi & login', x + cardWidth / 2, y + cardHeight - 5, { align: 'center' });
  };
  
  const handlePrintSingleCard = () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
  
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 53.98]
    });
  
    drawCard(doc, 0, 0, selectedStudent);
    doc.save(`kartu-${selectedStudent.nis}.pdf`);
    setIsGenerating(false);
  };

  const handlePrintAllCards = () => {
    if (students.length === 0) return;
    setIsGenerating(true);

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

    students.forEach((student, index) => {
        const page = Math.floor(index / cardsPerPage);
        if (index > 0 && index % cardsPerPage === 0) {
            doc.addPage();
        }

        const i = index % cardsPerPage;
        const row = Math.floor(i / cardsPerRow);
        const col = i % cardsPerRow;

        const x = marginX + col * (cardWidth + 10);
        const y = marginY + row * (cardHeight + 5);

        drawCard(doc, x, y, student);
    });

    doc.save('semua-kartu-tabungan.pdf');
    setIsGenerating(false);
  };

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
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={loading || students.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder={loading ? "Memuat siswa..." : "Pilih siswa..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {students.map(student => (
                             <SelectItem key={student.id} value={student.id}>
                                {student.name} ({student.nis})
                             </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button className="w-full" onClick={handlePrintAllCards} disabled={isGenerating || loading || students.length === 0}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Unduh Semua Kartu (PDF A4)
            </Button>
        </CardContent>
      </Card>

      {selectedStudent && (
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
                            <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${selectedStudent.nis}`} width={80} height={80} alt="QR Code" data-ai-hint="qr code" />
                            <div>
                                <p className="font-bold">{selectedStudent.name}</p>
                                <p className="text-sm text-muted-foreground">NIS: {selectedStudent.nis}</p>
                                <p className="text-sm text-muted-foreground">Kelas: {selectedStudent.class}</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Gunakan kartu ini untuk transaksi & login</p>
                    </div>
                    <Button className="w-full" onClick={handlePrintSingleCard} disabled={isGenerating}>
                         {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Unduh Kartu Ini (PDF)
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}

    </div>
  );
}
