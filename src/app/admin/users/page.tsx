
'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Profile } from '@/types';

interface AppUser {
    id: string;
    email: string | undefined;
    created_at: string;
    last_sign_in_at: string | undefined;
    plan: 'TRIAL' | 'PRO';
}

export default function AdminUsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            // Note: This requires admin privileges.
            // A real implementation would use an edge function with service_role key.
            const { data, error } = await supabase.from('profiles').select('*');

            if (error) {
                console.error("Error fetching profiles:", error);
            } else {
                // This is a placeholder for user auth data which is harder to get on the client.
                const mappedUsers = data.map((profile: Profile) => ({
                    id: profile.id,
                    email: profile.email,
                    created_at: new Date().toISOString(), // Placeholder
                    last_sign_in_at: new Date().toISOString(), // Placeholder
                    plan: profile.plan
                }));
                setUsers(mappedUsers);
            }
            setLoading(false);
        };
        fetchUsers();
    }, [supabase]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-muted-foreground">Lihat dan kelola semua pengguna yang terdaftar di aplikasi Anda.</p>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengguna</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Status Akun</TableHead>
                                <TableHead>Tanggal Registrasi</TableHead>
                                <TableHead>Terakhir Login</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Memuat pengguna...</TableCell>
                                </TableRow>
                            ) : (
                                users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.plan === 'PRO' ? 'default' : 'secondary'}>
                                                {user.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(user.created_at), 'd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                                        <TableCell>{user.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { locale: id, addSuffix: true }) : 'Belum Pernah'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    