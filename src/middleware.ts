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
  const publicRoutes = ['/login', '/signup', '/student-login'];

  // If there's no session and the route is not public, redirect to login
  if (!session && !publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If there is a session, handle redirects based on role
  if (session) {
    const isAuthPage = publicRoutes.some(route => pathname.startsWith(route));

    // Fetch user profile to check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    const isStudent = session.user.email?.endsWith('@ribath5.supabase.user');

    if (isStudent) {
      // Student is logged in
      if (isAuthPage) {
        // If student is on a login/signup page, redirect to their profile
        return NextResponse.redirect(new URL(`/profiles/${session.user.id}`, request.url));
      }
      // Allow access to their own profile page
      if (pathname.startsWith(`/profiles/${session.user.id}`)) {
        return response;
      }
      // Block access to all other main app pages
      if (!pathname.startsWith('/auth/callback')) {
         return NextResponse.redirect(new URL(`/profiles/${session.user.id}`, request.url));
      }

    } else if (profile?.role === 'ADMIN') {
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

    