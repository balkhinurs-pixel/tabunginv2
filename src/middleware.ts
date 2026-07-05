
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
    // Ambil data profil dari database untuk mengecek role asli
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_code')
      .eq('id', session.user.id)
      .single();

    const isStudent = profile?.role === 'STUDENT' || session.user.email?.endsWith('.supabase.user');

    if (isStudent) {
      // Alur Siswa: Hanya boleh di /home
      if (pathname === '/login' || pathname === '/student-login' || pathname === '/' || pathname === '/welcome') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
      if (!pathname.startsWith('/home') && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    } else { 
      // Alur Guru / Kantin / User Baru
      if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        if (profile) {
          // A. Jika role masih 'USER' (atau belum pilih peran), wajib ke /welcome
          if (profile.role === 'USER' && pathname !== '/welcome') {
            return NextResponse.redirect(new URL('/welcome', request.url));
          }

          // B. Jika sudah punya peran, cegah masuk ke /welcome lagi
          if (profile.role !== 'USER' && pathname === '/welcome') {
            const destination = profile.role === 'CANTINE' ? '/cantine/outlet' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }

          // C. Filter Akses berdasarkan Role
          if (profile.role === 'CANTINE') {
              // Kantin hanya boleh di area /cantine dan /settings
              if (!pathname.startsWith('/cantine') && pathname !== '/settings' && !isPublicRoute) {
                  return NextResponse.redirect(new URL('/cantine/outlet', request.url));
              }
          }
          
          if (profile.role === 'ADMIN') {
              // Admin dilarang masuk area kantin
              if (pathname.startsWith('/cantine')) {
                  return NextResponse.redirect(new URL('/dashboard', request.url));
              }
          }

          // D. Jika sudah login dan mencoba ke halaman auth
          if (isAuthRoute) {
            const destination = profile.role === 'CANTINE' ? '/cantine/outlet' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }
        } else {
            // Jika profil belum ada di database, arahkan ke welcome untuk inisialisasi
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
