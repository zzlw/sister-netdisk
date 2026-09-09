import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needAuth =
    pathname.startsWith("/account") || pathname.startsWith("/(account)");
  if (!needAuth) {
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
  matcher: ["/account/:path*", "/login"],
};
