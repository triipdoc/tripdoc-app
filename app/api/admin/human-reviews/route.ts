import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  humanReviewListStatusSchema,
  normalizeHumanReviewStatus,
} from "../../../../lib/volunteerHumanReviews";

export const dynamic = "force-dynamic";

const reviewSelect = [
  "id",
  "session_id",
  "name",
  "email",
  "whatsapp",
  "preferred_contact_method",
  "message",
  "consent_to_contact",
  "consented_at",
  "privacy_notice_version",
  "status",
  "contacted_at",
  "reviewed_at",
  "closed_at",
  "admin_notes",
  "created_at",
  "updated_at",
].join(",");

type HumanReviewRow = {
  id: string;
  session_id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  preferred_contact_method: string | null;
  message: string | null;
  consent_to_contact: boolean | null;
  consented_at: string | null;
  privacy_notice_version: string | null;
  status: string | null;
  contacted_at: string | null;
  reviewed_at: string | null;
  closed_at: string | null;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SessionRow = {
  id: string;
  acquisition_source: string | null;
  created_at: string | null;
};

async function countReviews(status?: string) {
  let query = supabaseAdmin
    .from("volunteer_human_review_requests")
    .select("id", { count: "exact", head: true });

  if (status) query = query.eq("status", status);

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

function normalizeReview(row: HumanReviewRow, session?: SessionRow) {
  return {
    ...row,
    status: normalizeHumanReviewStatus(row.status),
    acquisition_source: session?.acquisition_source || null,
    session_created_at: session?.created_at || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const statusParam = request.nextUrl.searchParams.get("status") || "new";
    const parsedStatus = humanReviewListStatusSchema.safeParse(statusParam);
    const status = parsedStatus.success ? parsedStatus.data : "new";

    let query = supabaseAdmin
      .from("volunteer_human_review_requests")
      .select(reviewSelect)
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Admin human reviews GET error:", error);
      return NextResponse.json(
        { error: "Failed to load human review requests." },
        { status: 500 }
      );
    }

    const rows = (data || []) as unknown as HumanReviewRow[];
    const sessionIds = Array.from(new Set(rows.map((row) => row.session_id)));
    const sessionsById = new Map<string, SessionRow>();

    if (sessionIds.length > 0) {
      const { data: sessions, error: sessionError } = await supabaseAdmin
        .from("volunteer_match_sessions")
        .select("id,acquisition_source,created_at")
        .in("id", sessionIds);

      if (sessionError) {
        console.error("Admin human reviews session load error:", sessionError);
      } else {
        ((sessions || []) as SessionRow[]).forEach((session) => {
          sessionsById.set(session.id, session);
        });
      }
    }

    const [total, newCount, contactedCount, reviewedCount, closedCount] =
      await Promise.all([
        countReviews(),
        countReviews("new"),
        countReviews("contacted"),
        countReviews("reviewed"),
        countReviews("closed"),
      ]);

    return NextResponse.json({
      requests: rows.map((row) => normalizeReview(row, sessionsById.get(row.session_id))),
      counts: {
        total,
        new: newCount,
        contacted: contactedCount,
        reviewed: reviewedCount,
        closed: closedCount,
      },
      filters: {
        status,
      },
    });
  } catch (error) {
    console.error("Admin human reviews GET server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
