
import type { Student, Profile } from '@/types';
import { addStudentAction, updateStudentAction, deleteStudentAction } from './actions';
import ProfilesClientPage from './ProfilesClientPage';
import type { AuthUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/utils/supabase/server';

// This is now a Server Component
export default async function ProfilesPage() {
    const supabase = createClient();

    // Fetch initial data on the server
    const { data: { user } } = await supabase.auth.getUser();
    
    const [
        { data: studentsData, error: studentsError },
        { data: profileData, error: profileError }
    ] = await Promise.all([
        supabase.from('students').select('*').order('name', { ascending: true }),
        user ? supabase.from('profiles').select('*').eq('id', user.id).single() : Promise.resolve({ data: null, error: null })
    ]);

    if (studentsError) {
        console.error("Error fetching students data for ProfilesPage:", studentsError);
    }
    if (profileError) {
        console.error("Error fetching profile data for ProfilesPage:", profileError);
    }

    return (
        <ProfilesClientPage
            initialStudents={studentsData as Student[] || []}
            initialProfile={profileData as Profile | null}
            initialUser={user as AuthUser | null}
            addStudentAction={addStudentAction}
            updateStudentAction={updateStudentAction}
            deleteStudentAction={deleteStudentAction}
        />
    );
}
