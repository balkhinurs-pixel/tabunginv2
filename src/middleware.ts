
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  const isAuthRoute = ['/login', '/signup', '/student-login'].includes(pathname);
  const isPublicRoute = ['/login', '/signup', '/student-login', '/auth/callback', '/welcome'].includes(pathname);

  // If no session, and not a public route, redirect to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there is a session
  if (session) {
    const isStudent = session.user.email?.endsWith('.supabase.user');

    if (isStudent) {
      // Logic for students
      const studentDashboardPath = '/dashboard'; 
      // If student is trying to access auth pages, redirect to their dashboard
      if (isAuthRoute) {
        return NextResponse.redirect(new URL(studentDashboardPath, request.url));
      }
      // If student is trying to access any page outside of the student group (which is just /dashboard for them), redirect them back.
      if (!pathname.startsWith(studentDashboardPath) && pathname !== '/dashboard') {
         return NextResponse.redirect(new URL(studentDashboardPath, request.url));
      }
    } else {
      // Logic for regular users (teachers/admins)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, school_code')
        .eq('id', session.user.id)
        .single();
      
      // If profile setup is not complete
      if (profile && !profile.school_code && pathname !== '/welcome') {
        return NextResponse.redirect(new URL('/welcome', request.url));
      }

      // If profile is set up, but they are on the welcome page
      if (profile && profile.school_code && pathname === '/welcome') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // If user is on an auth page, redirect to their respective dashboard
      if (isAuthRoute) {
        const destination = profile?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
        return NextResponse.redirect(new URL(destination, request.url));
      }

      // Prevent non-admins from accessing admin routes
      if (profile?.role !== 'ADMIN' && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /logo.png (logo file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
