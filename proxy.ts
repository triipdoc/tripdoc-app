import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="TripDoc Admin"',
      "Cache-Control": "no-store",
    },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname === "/manage-tripdoc" ||
    pathname.startsWith("/manage-tripdoc/");

  if (!isProtected) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const encoded = authHeader.split(" ")[1];
    const decoded = atob(encoded);
    const [username, password] = decoded.split(":");

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminUser || !adminPass) {
      return new NextResponse("Missing admin credentials.", { status: 500 });
    }

    if (username !== adminUser || password !== adminPass) {
      return unauthorized();
    }

    return NextResponse.next();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: ["/manage-tripdoc", "/manage-tripdoc/:path*"],
};