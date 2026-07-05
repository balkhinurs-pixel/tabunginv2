
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
  const isAuthRoute = ['/login', '/signup', '/student-login', '/scan-login', '/kiosk'].includes(pathname);
  const isPublicRoute = isAuthRoute || pathname === '/auth/callback' || pathname === '/';

  // 1. Jika TIDAK login dan mencoba akses rute terproteksi
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Jika LOGIN
  if (session) {
    const isStudent = session.user.email?.endsWith('.supabase.user');

    if (isStudent) {
      // Alur Siswa
      if (pathname === '/login' || pathname === '/student-login' || pathname === '/') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
      if (!pathname.startsWith('/home') && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    } else { 
      // Alur Guru / Kantin
      if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, school_code')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          // A. Jika belum atur profil (school_code kosong)
          if (!profile.school_code && pathname !== '/welcome') {
            return NextResponse.redirect(new URL('/welcome', request.url));
          }

          // B. Jika sudah atur profil, cegah masuk ke /welcome lagi
          if (profile.school_code && pathname === '/welcome') {
            const destination = profile.role === 'CANTINE' ? '/cantine/outlet' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }

          // C. Arahkan Kantin ke area kantin saja
          if (profile.role === 'CANTINE' && !pathname.startsWith('/cantine') && !pathname.startsWith('/_next') && pathname !== '/auth/callback' && pathname !== '/settings') {
              return NextResponse.redirect(new URL('/cantine/outlet', request.url));
          }
          
          // D. Arahkan Admin ke area dashboard (cegah masuk area kantin)
          if (profile.role === 'ADMIN' && pathname.startsWith('/cantine')) {
              return NextResponse.redirect(new URL('/dashboard', request.url));
          }

          // E. Jika di halaman login tapi sudah beres profil
          if (isAuthRoute) {
            const destination = profile.role === 'CANTINE' ? '/cantine/outlet' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }
        } else {
            // F. Jika session ada tapi profil belum terbuat (jarang terjadi karena trigger)
            if (pathname !== '/welcome' && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
                return NextResponse.redirect(new URL('/welcome', request.url));
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
