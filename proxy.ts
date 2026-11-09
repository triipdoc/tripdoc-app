import { canonicalBrowsePath } from "./lib/browseUrls";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME, verifyAdminSession, isSameOriginRequest } from "./lib/adminSession";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const browsePath = canonicalBrowsePath(pathname);
  if (browsePath) {
    if (pathname !== browsePath) {
      const destination = request.nextUrl.clone();
      destination.pathname = browsePath;
      return NextResponse.redirect(destination, 308);
    }
    return NextResponse.next();
  }
  const authCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  const isAdminPageRoute = pathname.startsWith("/manage-tripdoc");
  const isLoginRoute = pathname === "/manage-tripdoc/login";
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isAuthenticated = await verifyAdminSession(authCookie);

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

  if (isAdminApiRoute && !isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/category/:path*", "/country/:path*", "/types/:path*", "/countries/:path*", "/manage-tripdoc", "/manage-tripdoc/:path*", "/api/admin/:path*", "/api/admin-analytics"],
};