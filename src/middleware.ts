
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
      .select('role, school_code')
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
          // Jika role masih 'USER', wajib ke /welcome
          if (profile.role === 'USER' && pathname !== '/welcome') {
            return NextResponse.redirect(new URL('/welcome', request.url));
          }

          // Super Admin (ADMIN) ke panel khusus
          if (profile.role === 'ADMIN') {
              if (isAuthRoute || pathname === '/dashboard') {
                  return NextResponse.redirect(new URL('/admin/dashboard', request.url));
              }
              return response;
          }

          // Guru (TEACHER)
          if (profile.role === 'TEACHER') {
              if (isAuthRoute || pathname === '/welcome' || pathname.startsWith('/admin')) {
                  return NextResponse.redirect(new URL('/dashboard', request.url));
              }
              return response;
          }
          
          // Mencegah masuk ke /welcome jika sudah punya peran
          if (profile.role !== 'USER' && pathname === '/welcome') {
            let dest = '/dashboard';
            if (profile.role === 'CANTINE') dest = '/cantine/outlet';
            if (profile.role === 'ADMIN') dest = '/admin/dashboard';
            return NextResponse.redirect(new URL(dest, request.url));
          }
        } else {
            // Jika belum ada profile sama sekali
            if (pathname !== '/welcome' && pathname !== '/auth/callback' && pathname !== '/logout') {
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
