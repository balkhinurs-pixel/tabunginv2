
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
  } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Transaction } from '@/types';

const DeleteTransactionDialog = ({ transactionId, description, onDelete }: { transactionId: string, description: string, onDelete: (id: string) => void }) => {
    const { toast } = useToast();
    const supabase = createClient();

    const handleDelete = async () => {
        const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
        
        if (error) {
             toast({
                title: 'Gagal Menghapus Transaksi',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            onDelete(transactionId);
            toast({
                title: 'Transaksi Dihapus',
                description: `Transaksi "${description}" telah dihapus.`,
            });
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus Transaksi?</DialogTitle>
                    <DialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Yakin ingin menghapus transaksi "{description}"?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Batal</Button></DialogClose>
                    <Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface TransactionListProps {
    initialTransactions: Transaction[];
}

export default function TransactionList({ initialTransactions }: TransactionListProps) {
    const [transactions, setTransactions] = useState(initialTransactions);

    const handleDeleteTransaction = (transactionId: string) => {
        setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    };

    return (
         <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="text-xl">Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-x-auto">
                <Table className="whitespace-nowrap">
                    <TableHeader>
                        <TableRow>
                            <TableHead>TANGGAL</TableHead>
                            <TableHead>JENIS</TableHead>
                            <TableHead>KETERANGAN</TableHead>
                            <TableHead className="text-right">JUMLAH</TableHead>
                            <TableHead className="text-center">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Belum ada transaksi.
                                </TableCell>
                            </TableRow>
                        )}
                        {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{format(parseISO(tx.created_at!), 'dd/MM/yy')}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.type === 'Pemasukan' ? 'default' : 'destructive'} className={cn(tx.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                        {tx.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className={cn("text-right font-medium", tx.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600')}>
                                    {tx.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                                </TableCell>
                                <TableCell className="text-center">
                                    <DeleteTransactionDialog 
                                        transactionId={tx.id}
                                        description={tx.description}
                                        onDelete={handleDeleteTransaction}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
      </Card>
    )
}
