import { NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "tripdoc_admin_auth";

export async function POST() {
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