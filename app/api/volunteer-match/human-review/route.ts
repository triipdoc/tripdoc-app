import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  buildHumanReviewRequestInsertPayload,
  volunteerHumanReviewSubmissionSchema,
} from "../../../../lib/volunteerMatchMvp";
import {
  sendVolunteerHumanReviewNotification,
  type VolunteerHumanReviewNotificationRequest,
} from "../../../../lib/volunteerHumanReviewNotifications";
import {
  checkVolunteerMatchRateLimit,
  HUMAN_REVIEW_DUPLICATE_WINDOW_MS,
  isRapidDuplicateHumanReviewRequest,
  rateLimitHeaders,
  readJsonBodyWithLimit,
  volunteerMatchRateLimitStores,
  VolunteerMatchRequestError,
  VOLUNTEER_MATCH_HUMAN_REVIEW_BODY_LIMIT_BYTES,
} from "../../../../lib/volunteerMatchAbuseProtection";

export const dynamic = "force-dynamic";

async function getSession(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("volunteer_match_sessions")
    .select("id,acquisition_source")
    .eq("id", sessionId)
    .single();

  if (error || !data) return null;
  return data as { id: string; acquisition_source: string | null };
}

async function hasRecentDuplicateReview({
  sessionId,
  email,
  whatsapp,
  now,
}: {
  sessionId: string;
  email?: string;
  whatsapp?: string;
  now: Date;
}) {
  const since = new Date(now.getTime() - HUMAN_REVIEW_DUPLICATE_WINDOW_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from("volunteer_human_review_requests")
    .select("email,whatsapp,created_at")
    .eq("session_id", sessionId)
    .gte("created_at", since)
    .limit(20);

  if (error) {
    console.error("Volunteer human review duplicate check error:", error);
    return false;
  }

  return isRapidDuplicateHumanReviewRequest({
    existingRequests: (data || []) as {
      email: string | null;
      whatsapp: string | null;
      created_at: string | null;
    }[],
    email,
    whatsapp,
    now,
  });
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkVolunteerMatchRateLimit({
      request: req,
      store: volunteerMatchRateLimitStores.humanReview,
      bucket: "volunteer-match-human-review",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many review requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimit.retryAfterSeconds),
        }
      );
    }

    const body = await readJsonBodyWithLimit(req, VOLUNTEER_MATCH_HUMAN_REVIEW_BODY_LIMIT_BYTES);
    const submission = volunteerHumanReviewSubmissionSchema.parse(body);
    const session = await getSession(submission.sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const now = new Date();
    const consentedAt = now.toISOString();
    const isDuplicate = await hasRecentDuplicateReview({
      sessionId: submission.sessionId,
      email: submission.email,
      whatsapp: submission.whatsapp,
      now,
    });

    if (isDuplicate) {
      return NextResponse.json(
        { error: "A recent review request already exists for this match. Please wait before submitting again." },
        { status: 429 }
      );
    }

    const { data: reviewRequest, error: requestError } = await supabaseAdmin
      .from("volunteer_human_review_requests")
      .insert(buildHumanReviewRequestInsertPayload({ submission, consentedAt }))
      .select(
        "id,session_id,name,email,whatsapp,preferred_contact_method,message,created_at"
      )
      .single();

    if (requestError || !reviewRequest) {
      console.error("Volunteer human review insert error:", requestError);
      return NextResponse.json(
        { error: "Could not submit human review request." },
        { status: 500 }
      );
    }

    try {
      const notificationResult = await sendVolunteerHumanReviewNotification({
        request: reviewRequest as VolunteerHumanReviewNotificationRequest,
        acquisitionSource: session.acquisition_source,
        origin: req.nextUrl.origin,
      });

      if (!notificationResult.sent) {
        console.warn("Volunteer human review notification not sent:", {
          reason: notificationResult.reason,
          skipped:
            "skipped" in notificationResult ? notificationResult.skipped : false,
        });
      }
    } catch (notificationError) {
      console.error(
        "Volunteer human review notification failed:",
        notificationError instanceof Error
          ? notificationError.message
          : "Unknown notification error"
      );
    }

    const { error: eventError } = await supabaseAdmin
      .from("volunteer_match_events")
      .insert({
        event_name: "human_review_submitted",
        session_id: submission.sessionId,
        acquisition_source: session.acquisition_source,
        metadata: {
          preferred_contact_method: submission.preferredContactMethod,
        },
      });

    if (eventError) {
      console.error("Volunteer human review event insert error:", eventError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof VolunteerMatchRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Volunteer human review route error:", error);
    return NextResponse.json(
      { error: "Please check the review form and consent before submitting." },
      { status: 400 }
    );
  }
}
