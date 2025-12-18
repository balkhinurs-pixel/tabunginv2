
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
import { Download, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ReportRow {
  nis: string;
  name: string;
  class: string;
  income: number;
  outcome: number;
  balance: number;
}

interface FilterControlsProps {
    reportData: ReportRow[];
    period: string;
    totals: {
        totalIncome: number;
        totalOutcome: number;
        totalBalance: number;
    }
}

export default function FilterControls({ reportData, period, totals }: FilterControlsProps) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [uniqueClasses, setUniqueClasses] = useState<string[]>([]);
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
        to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
    });
    const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('class') || 'all');

    useEffect(() => {
        const fetchClasses = async () => {
            const { data, error } = await supabase.from('students').select('class');
            if (data) {
                const unique = [...new Set(data.map(item => item.class))];
                setUniqueClasses(unique);
            }
        };
        fetchClasses();
    }, [supabase]);
    
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (dateRange?.from) {
            params.set('from', format(dateRange.from, 'yyyy-MM-dd'));
        } else {
            params.delete('from');
        }
        if (dateRange?.to) {
            params.set('to', format(dateRange.to, 'yyyy-MM-dd'));
        } else {
            params.delete('to');
        }
        if (selectedClass) {
            params.set('class', selectedClass);
        } else {
            params.delete('class');
        }

        router.replace(`${pathname}?${params.toString()}`);

    }, [dateRange, selectedClass, pathname, router, searchParams]);
    
    const handlePrintPdf = () => {
        const doc = new jsPDF();
        
        const schoolName = "ribath5"; // This could come from profile data in the future
        
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
                { content: totals.totalIncome.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } },
                { content: totals.totalOutcome.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } },
                { content: totals.totalBalance.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } }]
            ],
            headStyles: { fillColor: [29, 78, 133], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [241, 245, 249], fontStyle: 'bold' },
            theme: 'grid',
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.text(`Halaman ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            }
        });

        doc.save(`laporan-tabungan-${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    return (
        <>
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
             <Button className="w-full" onClick={handlePrintPdf}>
                <Download className="mr-2 h-4 w-4" /> Cetak Laporan (PDF)
            </Button>
        </>
    )
}
