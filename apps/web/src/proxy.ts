import { type NextRequest, NextResponse } from "next/server";

function nextWithForwardedHost(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ??
    (request.nextUrl.protocol === "https:" ? "https" : "http");
  if (forwardedHost) {
    requestHeaders.set("x-forwarded-host", forwardedHost);
  }
  requestHeaders.set("x-forwarded-proto", forwardedProto);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return nextWithForwardedHost(request);
  }
  const needAuth =
    pathname.startsWith("/account") || pathname.startsWith("/(account)");
  if (!needAuth) {
    return nextWithForwardedHost(request);
  }
  const session = request.cookies
    .getAll()
    .find((c) => c.name.includes("session_token"));
  if (!session?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return nextWithForwardedHost(request);
}

export const config = {
  matcher: ["/account/:path*", "/login", "/api/:path*"],
};
