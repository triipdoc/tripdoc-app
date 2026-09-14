import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "tripdoc_admin_auth";
const ADMIN_COOKIE_VALUE = "yes";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  const isAdminPageRoute = pathname.startsWith("/manage-tripdoc");
  const isLoginRoute = pathname === "/manage-tripdoc/login";
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isAuthenticated = authCookie === ADMIN_COOKIE_VALUE;

  if (isAdminApiRoute && !isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminPageRoute && !isLoginRoute && !isAuthenticated) {
    const loginUrl = new URL("/manage-tripdoc/login", request.url);

    if (pathname !== "/manage-tripdoc/login") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/manage-tripdoc", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage-tripdoc", "/manage-tripdoc/:path*", "/api/admin/:path*"],
};