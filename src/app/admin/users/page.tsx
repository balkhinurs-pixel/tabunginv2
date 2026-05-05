
import { createClient } from '@/lib/utils/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Profile } from '@/types';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function getUsers() {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .not('email', 'like', '%.supabase.user')
        .order('email', { ascending: true });

    if (error) {
        console.error("Error fetching profiles:", error);
        return [];
    }
    return data as Profile[];
}


export default async function AdminUsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-muted-foreground">Lihat dan kelola semua pengguna (guru/admin) yang terdaftar.</p>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Daftar Pengguna ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold text-[11px] uppercase tracking-wider">Email</TableHead>
                                    <TableHead className="font-bold text-[11px] uppercase tracking-wider">Status Akun</TableHead>
                                    <TableHead className="font-bold text-[11px] uppercase tracking-wider">Role</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length > 0 ? (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium text-sm">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={user.plan === 'PRO' ? 'bg-emerald-100 text-emerald-700 border-none font-bold' : 'bg-muted text-muted-foreground border-none font-bold'}>
                                                    {user.plan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'outline'} className="font-bold text-[10px]">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                                            Tidak ada pengguna yang terdaftar.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden">
                        {users.length > 0 ? (
                            <div className="space-y-4">
                                {users.map(user => (
                                    <div key={user.id} className="border rounded-lg p-4 bg-card">
                                        <div className="mb-3">
                                            <p className="text-sm font-bold truncate">{user.email}</p>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground font-medium">Status:</span>
                                                <Badge variant="secondary" className={user.plan === 'PRO' ? 'bg-emerald-100 text-emerald-700 border-none font-bold' : 'bg-muted text-muted-foreground border-none font-bold'}>
                                                    {user.plan}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground font-medium">Role:</span>
                                                 <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'outline'} className="font-bold text-[10px]">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Tidak ada pengguna yang terdaftar.</p>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
