import { NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "tripdoc_admin_auth";
const ADMIN_COOKIE_VALUE = "yes";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    const adminPassword = process.env.ADMIN_DASHBOARD_PASSWORD?.trim();

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password is not configured." },
        { status: 500 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}