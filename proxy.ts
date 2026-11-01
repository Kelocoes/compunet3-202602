import { NextRequest, NextResponse } from 'next/server';
import { decodeToken, SESSION_COOKIE } from '@/src/lib/token';

const protectedRoutes = ['/routines'];
const publicRoutes = ['/login', '/register'];

export function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtected = protectedRoutes.some((route) => path.startsWith(route));
    const isPublic = publicRoutes.includes(path);

    const payload = decodeToken(req.cookies.get(SESSION_COOKIE)?.value);

    if (isProtected && !payload) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isPublic && payload) {
        return NextResponse.redirect(new URL('/routines', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
