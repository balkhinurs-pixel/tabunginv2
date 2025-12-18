
'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Student } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SendWAButtonProps {
    student: Student;
    income: number;
    expense: number;
    balance: number;
}

const ActionButton = ({ icon: Icon, label, variant = 'ghost', onClick }: { icon: React.ElementType, label: string, variant?: 'ghost', onClick?: () => void }) => {
    const colorClasses = {
        ghost: 'bg-green-100 hover:bg-green-200 text-green-700'
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
            transactionDetails = `
*5 Transaksi Terakhir:*
`;
            recentTransactions.forEach(tx => {
                const date = format(new Date(tx.created_at!), 'dd/MM/yy');
                const sign = tx.type === 'Pemasukan' ? '+' : '-';
                transactionDetails += `- (${date}) ${tx.description}: ${sign}${formatCurrency(tx.amount)}
`;
            });
        } else {
            transactionDetails = `
_Belum ada transaksi_`;
        }

        const message = `
*Laporan Tabungan Siswa*
Nama: *${student.name}*
Kelas: ${student.class}
${transactionDetails}

*Ringkasan Saldo:*
Total Pemasukan: ${formatCurrency(income)}
Total Pengeluaran: ${formatCurrency(expense)}
*Saldo Akhir: ${formatCurrency(balance)}*

Terima kasih.
_Dibuat pada: ${format(new Date(), 'd MMM yyyy, HH:mm')}_
        `.trim().replace(/^\s+/gm, '');
        
        const cleanPhoneNumber = student.whatsapp_number.replace(/\D/g, '');

        const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return <ActionButton icon={MessageCircle} label="Kirim WA" variant="ghost" onClick={handleSendWA} />
}
