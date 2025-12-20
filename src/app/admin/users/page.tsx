import { createClient } from '@/lib/utils/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Profile } from '@/types';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// This is a Server Component that fetches data securely.
async function getUsers() {
    // We use the admin client to bypass RLS for the admin panel.
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        // Filter out student accounts, which have a shadow email ending in .supabase.user
        .not('email', 'like', '%.supabase.user')
        .order('email', { ascending: true });

    if (error) {
        console.error("Error fetching profiles with admin client:", error);
        return [];
    }
    return data as Profile[];
}


export default async function AdminUsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-muted-foreground">Lihat dan kelola semua pengguna (guru/admin) yang terdaftar di aplikasi Anda.</p>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengguna ({users.length})</CardTitle>
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
                                {users.length > 0 ? (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.plan === 'PRO' ? 'default' : 'secondary'} className={user.plan === 'PRO' ? 'bg-green-100 text-green-800' : ''}>
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
                        {users.length > 0 ? (
                            <div className="space-y-4">
                                {users.map(user => (
                                    <div key={user.id} className="border rounded-lg p-4">
                                        <div className="mb-2">
                                            <p className="text-sm font-medium truncate">{user.email}</p>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Status: </span>
                                                <Badge variant={user.plan === 'PRO' ? 'default' : 'secondary'} className={`ml-1 ${user.plan === 'PRO' ? 'bg-green-100 text-green-800' : ''}`}>
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
