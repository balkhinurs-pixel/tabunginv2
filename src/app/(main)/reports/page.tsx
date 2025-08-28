'use client';

import { useState } from 'react';
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
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const reportData = [
  { id: 'TRX001', student: 'John Doe', type: 'Deposit', amount: 50000, date: '2023-10-26' },
  { id: 'TRX002', student: 'Jane Smith', type: 'Withdrawal', amount: 20000, date: '2023-10-25' },
  { id: 'TRX003', student: 'Peter Jones', type: 'Deposit', amount: 100000, date: '2023-10-25' },
  { id: 'TRX004', student: 'Mary Johnson', type: 'Deposit', amount: 75000, date: '2023-10-24' },
  { id: 'TRX005', student: 'John Doe', type: 'Withdrawal', amount: 15000, date: '2023-10-23' },
  { id: 'TRX006', student: 'Jane Smith', type: 'Deposit', amount: 30000, date: '2023-10-22' },
  { id: 'TRX007', student: 'Peter Jones', type: 'Withdrawal', amount: 50000, date: '2023-10-21' },
];

export default function ReportsPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2023, 9, 20),
        to: new Date(2023, 9, 26),
      });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between sm:items-center flex-col sm:flex-row gap-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Savings Reports</h2>
            <p className="text-muted-foreground">
                Generate and export detailed savings reports.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button>
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.id}</TableCell>
                <TableCell>{transaction.student}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'Deposit' ? 'default' : 'destructive'} className={transaction.type === 'Deposit' ? 'bg-green-600' : ''}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell className="text-right">
                  {transaction.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
