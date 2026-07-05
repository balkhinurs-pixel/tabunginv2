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

  const isAuthRoute = ['/login', '/signup', '/student-login', '/scan-login', '/kiosk'].includes(pathname);
  const isStudentRoute = pathname.startsWith('/home');
  const isCantineRoute = pathname.startsWith('/cantine');
  const isPublicRoute = isAuthRoute || pathname === '/auth/callback';

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session) {
    const isStudent = session.user.email?.endsWith('.supabase.user');

    if (isStudent) {
      if (isAuthRoute || pathname === '/') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
      if (!isStudentRoute && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    } else { 
      if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, school_code')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          if (!profile.school_code && pathname !== '/welcome') {
            return NextResponse.redirect(new URL('/welcome', request.url));
          }

          if (profile.school_code && pathname === '/welcome') {
            const destination = profile.role === 'CANTINE' ? '/cantine/dashboard' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
          }

          if (profile.role === 'CANTINE' && !isCantineRoute && !pathname.startsWith('/_next') && pathname !== '/auth/callback') {
              return NextResponse.redirect(new URL('/cantine/dashboard', request.url));
          }
          
          if (profile.role === 'ADMIN' && isCantineRoute) {
              return NextResponse.redirect(new URL('/dashboard', request.url));
          }

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
