
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

  // Define public routes
  const publicRoutes = ['/login', '/signup', '/student-login', '/auth/callback', '/welcome'];

  // If there's no session and the route is not public, redirect to login
  if (!session && !publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If there is a session, handle redirects
  if (session) {
    const isAuthPage = ['/login', '/signup', '/student-login'].some(route => pathname.startsWith(route));

    // Determine if the logged-in user is a student based on email format
    const isStudent = session.user.email?.endsWith('.supabase.user');

    if (isStudent) {
      // Student is logged in
      const studentDashboardPath = `/student-dashboard`;
      
      // If student is on a login/signup page, redirect to their dashboard
      if (isAuthPage) {
        return NextResponse.redirect(new URL(studentDashboardPath, request.url));
      }
      
      // Allow access only to their own dashboard.
      // If they try to access anything else, redirect them.
      if (!pathname.startsWith(studentDashboardPath)) {
        return NextResponse.redirect(new URL(studentDashboardPath, request.url));
      }

    } else {
        // This is a regular user (admin/teacher), not a student.
        // Fetch profile to check for role and setup status
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, school_code')
            .eq('id', session.user.id)
            .single();

        // If school info is not set up, redirect to welcome page
        if (profile && !profile.school_code && pathname !== '/welcome') {
            return NextResponse.redirect(new URL('/welcome', request.url));
        }

        // If school info IS set up and user is on welcome page, redirect to dashboard
        if (profile && profile.school_code && pathname === '/welcome') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        if (profile?.role === 'ADMIN') {
            // Admin is logged in
            if (isAuthPage) {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
        } else {
            // Regular user (teacher/staff) is logged in
            if (isAuthPage) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            // Prevent non-admin from accessing admin routes
            if (pathname.startsWith('/admin')) {
                 return NextResponse.redirect(new URL('/dashboard', request.url));
            }
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
