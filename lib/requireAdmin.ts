import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isSameOriginRequest, verifyAdminSession } from "./adminSession";
export async function requireAdmin(req: NextRequest) {
  if (!await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Your admin session has expired. Sign in again in another tab, then retry." }, { status: 401 });
  }
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  return null;
}
