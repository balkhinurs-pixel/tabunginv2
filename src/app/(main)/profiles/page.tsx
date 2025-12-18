
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Student, Profile } from '@/types';
import { addStudentAction, updateStudentAction, deleteStudentAction } from './actions';
import ProfilesClientPage from './ProfilesClientPage';
import type { AuthUser } from '@supabase/supabase-js';

// This is now a Server Component
export default async function ProfilesPage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
    );

    // Fetch initial data on the server
    const { data: { user } } = await supabase.auth.getUser();
    
    const [
        { data: studentsData, error: studentsError },
        { data: profileData, error: profileError }
    ] = await Promise.all([
        supabase.from('students').select('*').order('name', { ascending: true }),
        user ? supabase.from('profiles').select('*').eq('id', user.id).single() : Promise.resolve({ data: null, error: null })
    ]);

    if (studentsError || profileError) {
        console.error("Error fetching initial data for ProfilesPage:", studentsError || profileError);
        // We can pass the error to the client component to display it
    }

    // Safely create the admin client on the server
    const getSupabaseAdmin = () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            // This will now correctly throw an error during server-side rendering if variables are missing
            throw new Error('Server Error: Supabase URL or Service Role Key is not configured in environment variables.');
        }
        return createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );
    };

    const supabaseAdmin = getSupabaseAdmin();

    // Bind the admin client to the server actions
    const boundAddStudentAction = addStudentAction.bind(null, supabaseAdmin);
    const boundUpdateStudentAction = updateStudentAction.bind(null, supabaseAdmin);
    const boundDeleteStudentAction = deleteStudentAction.bind(null, supabaseAdmin);

    return (
        <ProfilesClientPage
            initialStudents={studentsData as Student[] || []}
            initialProfile={profileData as Profile | null}
            initialUser={user as AuthUser | null}
            addStudentAction={boundAddStudentAction}
            updateStudentAction={boundUpdateStudentAction}
            deleteStudentAction={boundDeleteStudentAction}
        />
    );
}
