
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Calendar as CalendarIcon, ArrowLeft, Filter, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ReportRow {
  nis: string;
  name: string;
  class: string;
  income: number;
  outcome: number;
  balance: number;
}

export default function ReportsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const { toast } = useToast();

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            let query = supabase
                .from('students')
                .select(`
                    id, nis, name, class,
                    transactions (
                        type,
                        amount,
                        created_at
                    )
                `);

            if (dateRange?.from) {
                 query = query.gte('transactions.created_at', format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
            }
            if (dateRange?.to) {
                query = query.lte('transactions.created_at', format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
            }

            const { data, error } = await query;

            if (error && error.code !== 'PGRST116') { // Ignore error when transactions are empty for a date range
                 toast({
                    title: 'Gagal memuat data laporan',
                    description: error.message,
                    variant: 'destructive',
                });
            } else {
                setStudents(data as Student[]);
            }
            setLoading(false);
        };

        fetchStudents();
    }, [dateRange, toast]);

    const filteredStudents = useMemo(() => {
        if (selectedClass === 'all') {
            return students;
        }
        return students.filter(s => s.class === selectedClass);
    }, [students, selectedClass]);
    
    const reportData: ReportRow[] = useMemo(() => {
        return filteredStudents.map(student => {
            const { income, expense } = student.transactions.reduce(
                (acc, tx) => {
                    if (tx.type === 'Pemasukan') acc.income += tx.amount;
                    else acc.expense += tx.amount;
                    return acc;
                },
                { income: 0, expense: 0 }
            );
            return {
                nis: student.nis,
                name: student.name,
                class: student.class,
                income,
                outcome: expense,
                balance: income - expense,
            };
        });
    }, [filteredStudents]);

    const { totalIncome, totalOutcome, totalBalance } = useMemo(() => {
        return reportData.reduce(
            (acc, item) => {
                acc.totalIncome += item.income;
                acc.totalOutcome += item.outcome;
                acc.totalBalance += item.balance;
                return acc;
            },
            { totalIncome: 0, totalOutcome: 0, totalBalance: 0 }
        );
    }, [reportData]);

    const handlePrintPdf = () => {
        const doc = new jsPDF();
        
        const schoolName = "ribath5";
        const period = dateRange?.from ? `${format(dateRange.from, 'd MMM yyyy', {locale: id})} - ${dateRange.to ? format(dateRange.to, 'd MMM yyyy', {locale: id}) : 'Sekarang'}` : 'Semua Periode';
        
        doc.setFontSize(16);
        doc.text(`Laporan Tabungan Siswa - ${schoolName}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Periode: ${period}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
        
        autoTable(doc, {
            startY: 30,
            head: [['NO', 'NIS', 'NAMA SISWA', 'KELAS', 'PEMASUKAN (RP)', 'PENGELUARAN (RP)', 'SALDO AKHIR (RP)']],
            body: reportData.map((item, index) => [
                index + 1,
                item.nis,
                item.name,
                item.class,
                { content: item.income.toLocaleString('id-ID'), styles: { halign: 'right' } },
                { content: item.outcome.toLocaleString('id-ID'), styles: { halign: 'right' } },
                { content: item.balance.toLocaleString('id-ID'), styles: { halign: 'right' } },
            ]),
            foot: [
                [{ content: 'GRAND TOTAL', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalIncome.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } },
                { content: totalOutcome.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } },
                { content: totalBalance.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } }]
            ],
            headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [241, 245, 249], fontStyle: 'bold' },
            theme: 'grid',
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.text(`Halaman ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            }
        });

        doc.save(`laporan-tabungan-${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    const uniqueClasses = [...new Set(students.map(s => s.class))];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold tracking-tight">Laporan Tabungan Siswa</h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
                <Label>Filter Kelas:</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                        <div className='flex items-center gap-2'>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Semua Kelas" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Filter Rentang Tanggal:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "d MMM yyyy", { locale: id })} - {format(dateRange.to, "d MMM yyyy", { locale: id })}
                          </>
                        ) : (
                          format(dateRange.from, "d MMMM yyyy", { locale: id })
                        )
                      ) : (
                        <span>Pilih rentang tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
            </div>
        </CardContent>
      </Card>
      
      <div className='space-y-2'>
        <Button className="w-full" onClick={handlePrintPdf}>
            <Download className="mr-2 h-4 w-4" /> Cetak Laporan (PDF)
        </Button>
        <Button variant="secondary" className="w-full" disabled>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Ekspor ke CSV (Segera Hadir)
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="text-center text-lg">Preview Laporan</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
                Periode: {dateRange?.from ? `${format(dateRange.from, 'd MMM yyyy', {locale: id})} - ${dateRange.to ? format(dateRange.to, 'd MMM yyyy', {locale: id}) : 'Sekarang'}` : 'Semua Periode'}
            </p>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">NO</TableHead>
                            <TableHead>NIS</TableHead>
                            <TableHead>NAMA SISWA</TableHead>
                            <TableHead>KELAS</TableHead>
                            <TableHead className="text-right">PEMASUKAN (RP)</TableHead>
                            <TableHead className="text-right">PENGELUARAN (RP)</TableHead>
                            <TableHead className="text-right">SALDO AKHIR (RP)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Memuat data...
                                </TableCell>
                            </TableRow>
                        ) : reportData.length > 0 ? reportData.map((item, index) => (
                            <TableRow key={item.nis}>
                                <TableCell className="text-center">{index + 1}</TableCell>
                                <TableCell>{item.nis}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.class}</TableCell>
                                <TableCell className="text-right font-medium text-green-600">{item.income.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-right font-medium text-red-600">{item.outcome.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-right font-bold">{item.balance.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        )) : (
                           <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Tidak ada data untuk ditampilkan pada periode ini.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-muted/50">
                            <TableCell colSpan={4} className="font-bold text-center">GRAND TOTAL</TableCell>
                            <TableCell className="text-right font-bold text-green-600">{totalIncome.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-right font-bold text-red-600">{totalOutcome.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-right font-bold">{totalBalance.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
