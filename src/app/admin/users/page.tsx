
'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AppUser {
    id: string;
    email: string | undefined;
    created_at: string;
    last_sign_in_at: string | undefined;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            // Note: This requires admin privileges in Supabase.
            // You might need to call this from a server-side function
            // with service_role key for it to work.
            // For now, we assume it's callable for demo purposes.
            // A proper implementation would use an edge function.
            
            // This is a placeholder as listUsers is admin-only.
            const { data, error } = await supabase.from('profiles').select('id, email');
            
            // A real implementation would look like this in an edge function:
            // const { data: { users }, error } = await supabase.auth.admin.listUsers()

            const demoUsers: AppUser[] = [
                { id: '1', email: 'user1@example.com', created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
                { id: '2', email: 'user2@example.com', created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
                { id: '3', email: 'admin@admin.com', created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
            ];

            setUsers(demoUsers);
            setLoading(false);
        };
        fetchUsers();
    }, []);

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
                                <TableHead>Status</TableHead>
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
                                            <Badge variant={user.email?.endsWith('@admin.com') ? 'destructive' : 'default'}>
                                                {user.email?.endsWith('@admin.com') ? 'Admin' : 'Pengguna'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(user.created_at), 'd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                                        <TableCell>{user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'd MMM yyyy, HH:mm', { locale: id }) : 'Belum Pernah'}</TableCell>
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

// You need to create a 'profiles' table for the demo to work,
// or use an edge function with Supabase admin rights to fetch auth.users.
/*
create table
  public.profiles (
    id uuid not null,
    updated_at timestamp with time zone null,
    username text null,
    full_name text null,
    avatar_url text null,
    website text null,
    constraint profiles_pkey primary key (id),
    constraint profiles_username_key unique (username),
    constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
  );
*/

