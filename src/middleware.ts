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

  // Rute publik yang bisa diakses tanpa login sama sekali
  const isAuthRoute = ['/login', '/signup', '/student-login', '/scan-login', '/kiosk'].includes(pathname);
  const isStudentRoute = pathname.startsWith('/home');
  const isCantineRoute = pathname.startsWith('/cantine');
  const isPublicRoute = isAuthRoute || pathname === '/auth/callback';

  // 1. Jika TIDAK ada sesi dan rute BUKAN publik, arahkan ke login guru
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Jika ADA sesi
  if (session) {
    const isStudent = session.user.email?.endsWith('.supabase.user');

    if (isStudent) {
      // LOGIKA UNTUK SISWA
      if (isAuthRoute || pathname === '/') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
      if (!isStudentRoute && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    } else { 
      // LOGIKA UNTUK GURU/KANTIN/ADMIN
      if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, school_code')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          // Jika belum setting kode sekolah, paksa ke halaman welcome
          if (!profile.school_code && pathname !== '/welcome') {
            return NextResponse.redirect(new URL('/welcome', request.url));
          }

          if (profile.school_code && pathname === '/welcome') {
            const destination = profile.role === 'CANTINE' ? '/cantine/dashboard' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }

          // Arahkan akun Kantine menjauh dari Dashboard Guru
          if (profile.role === 'CANTINE' && !isCantineRoute && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
              return NextResponse.redirect(new URL('/cantine/dashboard', request.url));
          }
          
          // Arahkan akun Guru menjauh dari rute Kantine
          if (profile.role === 'ADMIN' && isCantineRoute) {
              return NextResponse.redirect(new URL('/dashboard', request.url));
          }

          // Arahkan yang sudah login menjauh dari halaman login
          if (isAuthRoute) {
            const destination = profile.role === 'CANTINE' ? '/cantine/dashboard' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }
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