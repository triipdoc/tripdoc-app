import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, isSameOriginRequest } from "../../../lib/adminSession";

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  const response = NextResponse.json({ success: true });

  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}