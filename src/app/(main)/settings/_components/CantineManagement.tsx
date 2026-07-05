
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Store, 
  Plus, 
  Trash2, 
  Loader2, 
  UtensilsCrossed,
  Info,
  AlertTriangle
} from 'lucide-react';
import { addCantineAction, deleteCantineAction, getCantineOutletsAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CantineManagement() {
  const [outlets, setOutlets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cantineId, setCantineId] = useState('');
  const [pin, setPin] = useState('');
  
  // Delete Verification States
  const [outletToDelete, setOutletToDelete] = useState<any>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');
  
  const { toast } = useToast();

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      const data = await getCantineOutletsAction();
      setOutlets(data);
    } catch (error) {
      console.error('Failed to fetch outlets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const handleAddCantine = async () => {
    const sanitizedId = cantineId.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    
    if (!sanitizedId || sanitizedId.length < 3) {
        toast({ title: "ID Terlalu Pendek", description: "ID Kantin minimal 3 karakter huruf/angka.", variant: "destructive" });
        return;
    }

    if (pin.length < 6) {
        toast({ title: "PIN Tidak Valid", description: "PIN harus terdiri dari 6 digit angka.", variant: "destructive" });
        return;
    }

    setAdding(true);
    const result = await addCantineAction({ cantineId: sanitizedId, pin });
    setAdding(false);

    if (result.success) {
        toast({ title: "Berhasil", description: result.message });
        setCantineId('');
        setPin('');
        fetchOutlets();
    } else {
        toast({ title: "Gagal", description: result.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!outletToDelete) return;
    
    setDeleting(true);
    const result = await deleteCantineAction(outletToDelete.id);
    setDeleting(false);

    if (result.success) {
        toast({ title: "Berhasil", description: result.message });
        setOutletToDelete(null);
        setConfirmDeleteName('');
        fetchOutlets();
    } else {
        toast({ title: "Gagal", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
        <Info className="h-4 w-4 text-emerald-700" />
        <AlertDescription className="text-xs">
            Gunakan fitur ini untuk membuatkan akun bagi penjual kantin di sekolah Anda. Mereka akan bisa memproses pembayaran dari tabungan siswa.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-orange-500" /> Daftar Outlet Kantin
        </h3>
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 rounded-full bg-orange-600 hover:bg-orange-700">
                    <Plus className="mr-1 h-3 w-3" /> Tambah Outlet
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Buat Akun Outlet Kantin</DialogTitle>
                    <DialogDescription>ID Kantin akan digunakan petugas untuk login di halaman Login Kantin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="c_id">ID Kantin (Singkat, tanpa spasi)</Label>
                        <Input 
                            id="c_id" 
                            placeholder="Misal: kantin1" 
                            value={cantineId}
                            onChange={(e) => setCantineId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        />
                        <p className="text-[10px] text-muted-foreground italic">Contoh: kantin-sehat, kedai-ibu, dll.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="c_pin">PIN Login (6 Digit Angka)</Label>
                        <Input 
                            id="c_pin" 
                            type="password" 
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6 Digit PIN" 
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddCantine} disabled={adding} className="w-full bg-orange-600">
                        {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Daftarkan Outlet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : outlets.length > 0 ? (
            outlets.map((outlet) => (
                <div key={outlet.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-orange-100 shadow-sm">
                            <Store className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">{outlet.displayId}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Aktif sebagai Outlet</p>
                        </div>
                    </div>
                    
                    <Dialog open={outletToDelete?.id === outlet.id} onOpenChange={(open) => {
                        if (!open) {
                            setOutletToDelete(null);
                            setConfirmDeleteName('');
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => setOutletToDelete(outlet)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <div className="flex items-center gap-2 text-rose-600 mb-2">
                                    <AlertTriangle className="h-6 w-6" />
                                    <DialogTitle>Hapus Akun Outlet?</DialogTitle>
                                </div>
                                <DialogDescription className="space-y-3">
                                    <p>Tindakan ini akan menghapus akun akses untuk <strong>{outlet.displayId}</strong> secara permanen. Petugas tidak akan bisa login lagi.</p>
                                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-2">
                                        <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Konfirmasi Penghapusan</p>
                                        <p className="text-[11px] text-rose-600">Ketik kembali ID kantin <span className="font-black underline">{outlet.displayId}</span> di bawah untuk melanjutkan:</p>
                                        <Input 
                                            value={confirmDeleteName}
                                            onChange={(e) => setConfirmDeleteName(e.target.value)}
                                            placeholder="Ketik ID kantin di sini..."
                                            className="bg-white border-rose-200 focus:ring-rose-500 text-sm font-bold"
                                        />
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex gap-2">
                                <Button variant="ghost" onClick={() => setOutletToDelete(null)} disabled={deleting}>Batal</Button>
                                <Button 
                                    variant="destructive" 
                                    disabled={confirmDeleteName !== outlet.displayId || deleting}
                                    onClick={handleDelete}
                                    className="flex-1"
                                >
                                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Hapus Permanen
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            ))
        ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-3xl border-gray-100">
                <UtensilsCrossed className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Belum ada outlet kantin yang terdaftar.</p>
            </div>
        )}
      </div>
    </div>
  );
}
