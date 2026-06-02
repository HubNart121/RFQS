import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const token = request.cookies.get('auth-token')?.value

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/calendar', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
