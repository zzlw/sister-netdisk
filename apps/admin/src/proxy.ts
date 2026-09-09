import { type NextRequest, NextResponse } from "next/server";

const PUBLIC = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    PUBLIC.has(pathname)
  ) {
    return NextResponse.next();
  }
  const session = request.cookies
    .getAll()
    .find((c) => c.name.includes("session_token"));
  if (!session?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
