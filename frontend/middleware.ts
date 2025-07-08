// middleware.ts
import { authMiddleware } from "@propelauth/nextjs/server/app-router";
import { NextResponse, type NextRequest } from "next/server";

// Custom middleware wrapper to skip auth on public pages
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If user is accessing public pages, allow without auth
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/calendar") 
  ) {
    return NextResponse.next();
  }

  // Otherwise enforce PropelAuth authentication
  return authMiddleware(req);
}

export const config = {
  matcher: [
    // Match everything except static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
