import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, ADMIN_SESSION_SECONDS, createAdminSession, isSameOriginRequest } from "../../../lib/adminSession";
import { timingSafeEqual, createHash } from "node:crypto";
import { checkAdminLoginLimit, clearAdminLoginFailures, loginClientKey, recordAdminLoginFailure } from "../../../lib/adminLoginRateLimit";

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  try {
    const clientKey = loginClientKey(req);
    const limit = checkAdminLoginLimit(clientKey);
    if (!limit.allowed) return NextResponse.json({ error: "Too many attempts. Wait before trying again." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
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

    if (!timingSafeEqual(createHash("sha256").update(password).digest(), createHash("sha256").update(adminPassword).digest())) {
      recordAdminLoginFailure(clientKey);
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    clearAdminLoginFailures(clientKey);
    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE_NAME, await createAdminSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}