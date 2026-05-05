
'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Student } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface SendWAButtonProps {
    student: Student;
    income: number;
    expense: number;
    balance: number;
}

const ActionButton = ({ icon: Icon, label, variant = 'ghost', onClick }: { icon: React.ElementType, label: string, variant?: 'ghost', onClick?: () => void }) => {
    const colorClasses = {
        ghost: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
    };
    
    return (
        <Button onClick={onClick} className={`w-full justify-center text-left h-12 text-base font-medium ${colorClasses[variant]}`}>
            <Icon className="mr-3 h-5 w-5" />
            {label}
        </Button>
    );
};


export default function SendWAButton({ student, income, expense, balance }: SendWAButtonProps) {
    const { toast } = useToast();
    
    const handleSendWA = () => {
        if (!student) return;

        if (!student.whatsapp_number) {
            toast({
                title: 'Nomor WA Tidak Ditemukan',
                description: 'Mohon tambahkan nomor WhatsApp wali siswa terlebih dahulu di halaman Data Siswa.',
                variant: 'destructive',
            });
            return;
        }

        const formatCurrency = (val: number) => val.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

        const recentTransactions = student.transactions.slice(0, 5);
        
        let transactionDetails = '';
        if (recentTransactions.length > 0) {
            transactionDetails = `*🕒 5 Transaksi Terakhir:*
`;
            recentTransactions.forEach(tx => {
                const date = format(new Date(tx.created_at!), 'dd/MM/yy');
                const indicator = tx.type === 'Pemasukan' ? '🟢' : '🔴';
                const sign = tx.type === 'Pemasukan' ? '+' : '-';
                transactionDetails += `${indicator} (${date}) ${tx.description}: ${sign}${formatCurrency(tx.amount)}
`;
            });
        } else {
            transactionDetails = `_Belum ada riwayat transaksi._
`;
        }

        const message = `
*📊 LAPORAN TABUNGAN SISWA*
--------------------------------------------
👤 *Profil Siswa:*
Nama: *${student.name}*
NIS: ${student.nis}
Kelas: ${student.class}

${transactionDetails}
*💰 Ringkasan Saldo:*
--------------------------------------------
📥 Total Pemasukan: ${formatCurrency(income)}
📤 Total Pengeluaran: ${formatCurrency(expense)}
⭐ *Saldo Akhir: ${formatCurrency(balance)}*

_Laporan ini dikirim secara otomatis oleh sistem._
_Waktu Cetak: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: id })}_
--------------------------------------------
*Terima kasih.*
        `.trim().replace(/^\s+/gm, '');
        
        const cleanPhoneNumber = student.whatsapp_number.replace(/\D/g, '');

        const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return <ActionButton icon={MessageCircle} label="Kirim Laporan WA" variant="ghost" onClick={handleSendWA} />
}
