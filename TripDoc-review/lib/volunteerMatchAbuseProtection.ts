import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

export const VOLUNTEER_MATCH_BODY_LIMIT_BYTES = 16_384;
export const VOLUNTEER_MATCH_EVENT_BODY_LIMIT_BYTES = 2_048;
export const VOLUNTEER_MATCH_HUMAN_REVIEW_BODY_LIMIT_BYTES = 8_192;
export const HUMAN_REVIEW_DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export type RateLimitStore = Map<string, number[]>;

export const volunteerMatchRateLimitStores = {
  match: new Map<string, number[]>(),
  events: new Map<string, number[]>(),
  humanReview: new Map<string, number[]>(),
};

export class VolunteerMatchRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "VolunteerMatchRequestError";
    this.status = status;
  }
}

export async function readJsonBodyWithLimit(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  const declaredBytes = contentLength ? Number(contentLength) : null;

  if (declaredBytes !== null && (!Number.isFinite(declaredBytes) || declaredBytes > maxBytes)) {
    throw new VolunteerMatchRequestError("Request body is too large.", 413);
  }

  const rawBody = await request.text();
  const actualBytes = new TextEncoder().encode(rawBody).length;

  if (actualBytes > maxBytes) {
    throw new VolunteerMatchRequestError("Request body is too large.", 413);
  }

  if (!rawBody.trim()) {
    throw new VolunteerMatchRequestError("Request body is required.", 400);
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new VolunteerMatchRequestError("Request body must be valid JSON.", 400);
  }
}

function getClientFingerprintInput(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipLikeValue =
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown-ip";
  const userAgent = request.headers.get("user-agent") || "unknown-user-agent";

  return `${ipLikeValue}|${userAgent}`;
}

export function getVolunteerMatchRequestFingerprint(request: NextRequest) {
  return createHash("sha256")
    .update(getClientFingerprintInput(request))
    .digest("hex");
}

export function checkRateLimit({
  store,
  key,
  limit,
  windowMs,
  now = Date.now(),
}: {
  store: RateLimitStore;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}) {
  const windowStart = now - windowMs;
  const recentHits = (store.get(key) || []).filter((timestamp) => timestamp > windowStart);

  if (recentHits.length >= limit) {
    store.set(key, recentHits);
    const oldestHit = recentHits[0] || now;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldestHit + windowMs - now) / 1000)),
    };
  }

  recentHits.push(now);
  store.set(key, recentHits);

  return { allowed: true, retryAfterSeconds: 0 };
}

export function checkVolunteerMatchRateLimit({
  request,
  store,
  bucket,
  limit,
  windowMs,
}: {
  request: NextRequest;
  store: RateLimitStore;
  bucket: string;
  limit: number;
  windowMs: number;
}) {
  const fingerprint = getVolunteerMatchRequestFingerprint(request);
  return checkRateLimit({
    store,
    key: `${bucket}:${fingerprint}`,
    limit,
    windowMs,
  });
}

export function rateLimitHeaders(retryAfterSeconds: number): HeadersInit {
  return retryAfterSeconds > 0
    ? { "Retry-After": String(retryAfterSeconds) }
    : {};
}

function normalizeContactValue(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

export function isRapidDuplicateHumanReviewRequest({
  existingRequests,
  email,
  whatsapp,
  now = new Date(),
  windowMs = HUMAN_REVIEW_DUPLICATE_WINDOW_MS,
}: {
  existingRequests: { email: string | null; whatsapp: string | null; created_at: string | null }[];
  email?: string;
  whatsapp?: string;
  now?: Date;
  windowMs?: number;
}) {
  const normalizedEmail = normalizeContactValue(email);
  const normalizedWhatsapp = normalizeContactValue(whatsapp);
  const nowMs = now.getTime();

  return existingRequests.some((request) => {
    if (!request.created_at) return false;

    const createdAtMs = new Date(request.created_at).getTime();
    if (!Number.isFinite(createdAtMs) || nowMs - createdAtMs > windowMs) {
      return false;
    }

    return Boolean(
      (normalizedEmail && normalizeContactValue(request.email) === normalizedEmail) ||
        (normalizedWhatsapp && normalizeContactValue(request.whatsapp) === normalizedWhatsapp)
    );
  });
}
