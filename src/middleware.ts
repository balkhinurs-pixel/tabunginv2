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

    // A. Akun Siswa (Email bayangan)
    const isStudentEmail = session.user.email?.endsWith('.supabase.user');
    const isCantineEmail = session.user.email?.endsWith('.kantin.user');

    if (isStudentEmail) {
      if (!pathname.startsWith('/home') && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
      return response;
    }

    if (isCantineEmail) {
      if (!pathname.startsWith('/cantine') && pathname !== '/settings' && !pathname.startsWith('/_next')) {
        return NextResponse.redirect(new URL('/cantine/outlet', request.url));
      }
      return response;
    }

    // B. Alur Guru / Admin / Akun Google Baru
    if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        if (profile) {
          // Jika role masih 'USER', wajib ke /welcome
          if (profile.role === 'USER' && pathname !== '/welcome') {
            return NextResponse.redirect(new URL('/welcome', request.url));
          }

          // Jika sudah punya peran, cegah masuk ke /welcome lagi
          if (profile.role !== 'USER' && pathname === '/welcome') {
            const destination = profile.role === 'CANTINE' ? '/cantine/outlet' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }

          // Filter Akses Role
          if (profile.role === 'CANTINE') {
              if (!pathname.startsWith('/cantine') && pathname !== '/settings' && !isPublicRoute) {
                  return NextResponse.redirect(new URL('/cantine/outlet', request.url));
              }
          }
          
          if (profile.role === 'ADMIN') {
              if (pathname.startsWith('/cantine')) {
                  return NextResponse.redirect(new URL('/dashboard', request.url));
              }
          }

          // Redirect rute login jika sudah ada sesi
          if (isAuthRoute) {
            const destination = profile.role === 'CANTINE' ? '/cantine/outlet' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }
        } else {
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
