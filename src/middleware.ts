
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

  // Rute Publik
  const isAuthRoute = ['/login', '/signup', '/student-login', '/cantine-login', '/scan-login', '/kiosk'].includes(pathname);
  const isPublicRoute = isAuthRoute || pathname === '/auth/callback' || pathname === '/';

  // 1. Jika TIDAK login dan mencoba akses rute terproteksi
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Jika LOGIN
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_code, school_name')
      .eq('id', session.user.id)
      .single();

    const isStudentEmail = session.user.email?.endsWith('.supabase.user');
    const isCantineEmail = session.user.email?.endsWith('.kantin.user');

    // A. Role SISWA
    if (isStudentEmail || (profile && profile.role === 'STUDENT')) {
      if (!pathname.startsWith('/home') && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
      return response;
    }

    // B. Role KANTIN
    if (isCantineEmail || (profile && profile.role === 'CANTINE')) {
      if (!pathname.startsWith('/cantine') && pathname !== '/settings' && !pathname.startsWith('/_next')) {
        return NextResponse.redirect(new URL('/cantine/outlet', request.url));
      }
      return response;
    }

    // C. Alur Guru (TEACHER) & Admin Pusat (ADMIN)
    if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        if (profile) {
          // LOGIKA TRANSISI: Jika role ADMIN/USER tapi punya school_code, perlakukan sebagai TEACHER
          const isActuallyTeacher = profile.role === 'TEACHER' || (profile.school_code && profile.role !== 'CANTINE' && profile.role !== 'STUDENT' && profile.role !== 'ADMIN');
          const isActuallyAdmin = profile.role === 'ADMIN' && !profile.school_code;

          // Super Admin (ADMIN) ke panel khusus
          if (isActuallyAdmin) {
              if (isAuthRoute || pathname === '/dashboard') {
                  return NextResponse.redirect(new URL('/admin/dashboard', request.url));
              }
              return response;
          }

          // Guru (TEACHER)
          if (isActuallyTeacher) {
              if (isAuthRoute || pathname === '/welcome' || pathname.startsWith('/admin')) {
                  return NextResponse.redirect(new URL('/dashboard', request.url));
              }
              return response;
          }
          
          // Jika belum ada data sekolah sama sekali, wajib ke /welcome
          if (!profile.school_code && pathname !== '/welcome' && pathname !== '/auth/callback') {
            return NextResponse.redirect(new URL('/welcome', request.url));
          }
        } else {
            // Jika belum ada profile sama sekali
            if (pathname !== '/welcome' && pathname !== '/auth/callback') {
                return NextResponse.redirect(new URL('/welcome', request.url));
            }
        }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/ping|_next/static|_next/image|favicon.ico|logo.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
