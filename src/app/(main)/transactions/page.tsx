import NewTransactionDialog from '@/components/transactions/NewTransactionDialog';

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-8 items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
             <h2 className="text-2xl font-bold tracking-tight">Pindai untuk Memulai</h2>
            <p className="text-muted-foreground max-w-xs">
                Posisikan kode QR siswa di dalam bingkai untuk memulai transaksi dengan cepat.
            </p>
        </div>
        <NewTransactionDialog />
    </div>
  );
}
