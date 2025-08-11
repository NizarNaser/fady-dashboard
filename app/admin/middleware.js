import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const url = req.nextUrl.clone()
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // حماية مسار /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      url.pathname = '/api/auth/signin'
      url.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    if (token.role !== 'admin') {
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
