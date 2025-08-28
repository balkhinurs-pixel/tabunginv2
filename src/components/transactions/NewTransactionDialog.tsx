'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScanLine, QrCode, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

export default function NewTransactionDialog() {
    const [step, setStep] = useState<'scan' | 'form'>('scan');
    const [open, setOpen] = useState(false);
    const { toast } = useToast()

    const handleScan = () => {
        // Simulate scanning
        setTimeout(() => setStep('form'), 1500);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Handle form submission logic
        toast({
            title: "Transaksi Tercatat",
            description: "Transaksi telah berhasil disimpan.",
        })
        setOpen(false);
        setTimeout(() => setStep('scan'), 500); // Reset after closing
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <QrCode className="mr-2 h-4 w-4" />
            Transaksi Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {step === 'scan' ? (
          <>
            <DialogHeader>
              <DialogTitle>Pindai Kode QR</DialogTitle>
              <DialogDescription>
                Pindai kode QR siswa untuk memulai transaksi.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="relative h-48 w-48 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                <ScanLine className="absolute h-full w-full text-primary animate-pulse" />
                <QrCode className="h-24 w-24 text-muted-foreground/50" />
              </div>
               <Button onClick={handleScan}>Simulasikan Pindai</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Catat Transaksi</DialogTitle>
              <DialogDescription>
                Masukkan detail transaksi untuk Siswa ID: 12345.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tipe Transaksi</Label>
                <RadioGroup defaultValue="deposit" className="flex gap-4">
                  <Label htmlFor="deposit" className="flex items-center gap-2 cursor-pointer rounded-md border p-3 has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground has-[input:checked]:border-primary flex-1">
                    <RadioGroupItem value="deposit" id="deposit" className="sr-only"/>
                    <ArrowUpCircle className="h-5 w-5"/>
                    <span>Setoran</span>
                  </Label>
                  <Label htmlFor="withdrawal" className="flex items-center gap-2 cursor-pointer rounded-md border p-3 has-[input:checked]:bg-destructive has-[input:checked]:text-destructive-foreground has-[input:checked]:border-destructive flex-1">
                    <RadioGroupItem value="withdrawal" id="withdrawal" className="sr-only"/>
                    <ArrowDownCircle className="h-5 w-5"/>
                    <span>Penarikan</span>
                  </Label>
                </RadioGroup>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Jumlah</Label>
                <Input id="amount" type="number" placeholder="0" required />
              </div>
              <DialogFooter>
                <Button type="submit">Simpan Transaksi</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
