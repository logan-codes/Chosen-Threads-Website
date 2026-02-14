import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    
    const cookies = request.cookies;
    const hasSupabaseCookie = Array.from(cookies.getAll()).some(cookie => 
      cookie.name.includes('sb-') || cookie.name.includes('supabase')
    );

    if (!hasSupabaseCookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
