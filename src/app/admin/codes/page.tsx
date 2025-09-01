
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Key, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivationCode {
    id: number;
    code: string;
    created_at: string;
    is_used: boolean;
    used_by: string | null;
    used_at: string | null;
}

export default function AdminCodesPage() {
    const [codes, setCodes] = useState<ActivationCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchCodes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('activation_codes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ title: 'Gagal memuat kode', description: error.message, variant: 'destructive' });
        } else {
            setCodes(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const generateNewCode = async () => {
        setGenerating(true);
        const newCode = `PRO-${[...Array(3)].map(() => Math.random().toString(36).substring(2, 7).toUpperCase()).join('-')}`;
        
        const { data, error } = await supabase
            .from('activation_codes')
            .insert({ code: newCode })
            .select()
            .single();

        if (error) {
            toast({ title: 'Gagal membuat kode baru', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Kode baru telah dibuat!', description: newCode });
            setCodes(prev => [data, ...prev]);
        }
        setGenerating(false);
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast({ title: 'Kode disalin ke clipboard!' });
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Kode Aktivasi</h1>
            <p className="text-muted-foreground">Buat dan kelola kode aktivasi untuk akun premium.</p>

            <Card>
                <CardHeader>
                    <CardTitle>Buat Kode Baru</CardTitle>
                    <CardDescription>Klik tombol di bawah untuk membuat kode aktivasi premium baru.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={generateNewCode} disabled={generating}>
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                        Buat Kode Aktivasi
                    </Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Daftar Kode</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal Dibuat</TableHead>
                                <TableHead>Digunakan Oleh</TableHead>
                                <TableHead>Tanggal Digunakan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Memuat kode...</TableCell>
                                </TableRow>
                            ) : codes.length > 0 ? (
                                codes.map(code => (
                                    <TableRow key={code.id}>
                                        <TableCell className="font-mono">
                                            <div className="flex items-center gap-2">
                                                <span>{code.code}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(code.code)}>
                                                    {copiedCode === code.code ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={code.is_used ? 'secondary' : 'default'}>
                                                {code.is_used ? 'Digunakan' : 'Tersedia'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(code.created_at), 'd MMM yyyy', { locale: id })}</TableCell>
                                        <TableCell>{code.used_by || '-'}</TableCell>
                                        <TableCell>{code.used_at ? format(new Date(code.used_at), 'd MMM yyyy', { locale: id }) : '-'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada kode yang dibuat.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
