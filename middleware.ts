import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Authentication is now handled at the Server Component level in the respective page.tsx files
  // for better reliability with environment variables.
  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*'],
}
