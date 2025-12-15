
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
                    {/* Desktop Table */}
                    <div className="hidden md:block">
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
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden">
                        {loading ? (
                            <p className="text-center text-muted-foreground">Memuat pengguna...</p>
                        ) : users.length > 0 ? (
                            <div className="space-y-4">
                                {users.map(user => (
                                    <div key={user.id} className="border rounded-lg p-4">
                                        <div className="mb-2">
                                            <p className="text-sm font-medium truncate">{user.email}</p>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Status: </span>
                                                <Badge variant={user.plan === 'PRO' ? 'default' : 'secondary'} className="ml-1">
                                                    {user.plan}
                                                </Badge>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Role: </span>
                                                 <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'outline'} className="ml-1">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground">Tidak ada pengguna yang terdaftar.</p>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
