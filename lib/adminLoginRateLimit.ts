type Entry = { count: number; resetAt: number };
const attempts = new Map<string, Entry>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
export function loginClientKey(req: Request) {
  return (req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 80);
}
export function checkAdminLoginLimit(key: string, now = Date.now()) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) { attempts.set(key, { count: 0, resetAt: now + WINDOW_MS }); return { allowed: true, retryAfter: 0 }; }
  return { allowed: entry.count < MAX_ATTEMPTS, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
}
export function recordAdminLoginFailure(key: string, now = Date.now()) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
}
export function clearAdminLoginFailures(key: string) { attempts.delete(key); }
