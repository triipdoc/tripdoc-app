// Web Crypto works in both Next middleware and Node route handlers.
export const ADMIN_COOKIE_NAME = "tripdoc_admin_auth";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();
function secret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_DASHBOARD_PASSWORD?.trim();
}
async function key() {
  const value = secret();
  if (!value) throw new Error("Admin authentication is not configured.");
  return crypto.subtle.importKey("raw", encoder.encode(value), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
export async function createAdminSession(now = Date.now()) {
  const payload = `v1.${Math.floor(now / 1000) + ADMIN_SESSION_SECONDS}.${crypto.randomUUID()}`;
  return `${payload}.${hex(await crypto.subtle.sign("HMAC", await key(), encoder.encode(payload)))}`;
}
export async function verifyAdminSession(token: string | undefined, now = Date.now()) {
  if (!token || token.length > 200 || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1" || !/^\d+$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[3])) return false;
  const expires = Number(parts[1]);
  if (expires <= Math.floor(now / 1000) || expires > Math.floor(now / 1000) + ADMIN_SESSION_SECONDS) return false;
  try {
    const signature = Uint8Array.from(parts[3].match(/../g)!, v => parseInt(v, 16));
    return await crypto.subtle.verify("HMAC", await key(), signature, encoder.encode(parts.slice(0, 3).join(".")));
  } catch { return false; }
}
export function isSameOriginRequest(req: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  return origin === new URL(req.url).origin;
}
