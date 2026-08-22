import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import {
  adminHumanReviewUpdateSchema,
  buildHumanReviewStatusUpdate,
  normalizeHumanReviewStatus,
} from "../../../../../lib/volunteerHumanReviews";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        { error: "A valid review request ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsedBody = adminHumanReviewUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Provide a valid status or admin notes update." },
        { status: 400 }
      );
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from("volunteer_human_review_requests")
      .select(reviewSelect)
      .eq("id", parsedId.data)
      .single();

    if (currentError || !current) {
      return NextResponse.json(
        { error: "Human review request not found." },
        { status: 404 }
      );
    }

    const currentRow = current as unknown as HumanReviewRow;
    const payload = buildHumanReviewStatusUpdate({
      current: currentRow,
      nextStatus: parsedBody.data.status,
      adminNotes: parsedBody.data.admin_notes,
    });

    const { data, error } = await supabaseAdmin
      .from("volunteer_human_review_requests")
      .update(payload)
      .eq("id", parsedId.data)
      .select(reviewSelect)
      .single();

    if (error || !data) {
      console.error("Admin human review PATCH error:", error);
      return NextResponse.json(
        { error: "Failed to update human review request." },
        { status: 500 }
      );
    }

    const updatedReview = data as unknown as HumanReviewRow;

    return NextResponse.json({
      success: true,
      request: {
        ...updatedReview,
        status: normalizeHumanReviewStatus(updatedReview.status),
      },
    });
  } catch (error) {
    console.error("Admin human review PATCH server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
