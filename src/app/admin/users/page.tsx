
'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types';

export default function AdminUsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            // This now fetches from the 'profiles' table which is accessible.
            const { data, error } = await supabase.from('profiles').select('*').order('email', { ascending: true });

            if (error) {
                console.error("Error fetching profiles:", error);
            } else {
                setUsers(data as Profile[]);
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
                                <TableHead>Role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">Memuat pengguna...</TableCell>
                                </TableRow>
                            ) : users.length > 0 ? (
                                users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.plan === 'PRO' ? 'default' : 'secondary'}>
                                                {user.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'outline'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        Tidak ada pengguna yang terdaftar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
