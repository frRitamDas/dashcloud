import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-session-core';
import { safeInternalPath } from '@/lib/redirects';

const PROTECTED = ['/profile'];
const ADMIN = ['/admin'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    if (PROTECTED.some((p) => pathname.startsWith(p)) && !user) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/login';
      redirect.searchParams.set('next', pathname);
      return NextResponse.redirect(redirect);
    }

    if (pathname === '/login' || pathname === '/signup') {
      if (user) {
        const next = safeInternalPath(request.nextUrl.searchParams.get('next'), '/profile');
        return NextResponse.redirect(new URL(next, request.url));
      }
    }
  }

  const { pathname } = request.nextUrl;
  const isAdminArea = ADMIN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAdminLogin = pathname === '/admin/login';

  if (isAdminArea && !isAdminLogin) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const session = await verifyAdminToken(token, process.env.ADMIN_SESSION_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!session) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/admin/login';
      redirect.searchParams.set('next', pathname);
      return NextResponse.redirect(redirect);
    }
  }

  if (isAdminLogin) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const session = await verifyAdminToken(token, process.env.ADMIN_SESSION_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (session) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/admin';
      redirect.search = '';
      return NextResponse.redirect(redirect);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
};
