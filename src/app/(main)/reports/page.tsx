
'use client';

import { useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar as CalendarIcon, ArrowLeft, Filter, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function ReportsPage() {
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

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
                <Select>
                    <SelectTrigger>
                        <div className='flex items-center gap-2'>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Semua Kelas" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        <SelectItem value="9a">9a</SelectItem>
                        <SelectItem value="9b">9b</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>Filter Jenis Transaksi:</Label>
                <Select>
                    <SelectTrigger>
                         <div className='flex items-center gap-2'>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Semua Jenis" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Jenis</SelectItem>
                        <SelectItem value="deposit">Setoran</SelectItem>
                        <SelectItem value="withdrawal">Penarikan</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Tanggal Mulai:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label>Tanggal Selesai:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
            </div>
        </CardContent>
      </Card>
      
      <div className='space-y-2'>
        <Button className="w-full">
            <Download className="mr-2 h-4 w-4" /> Cetak Laporan (PDF)
        </Button>
        <Button variant="secondary" className="w-full">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Ekspor ke CSV
        </Button>
      </div>

    </div>
  );
}
