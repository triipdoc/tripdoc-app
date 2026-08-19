import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { volunteerMatchClientEventSchema } from "../../../../lib/volunteerMatchMvp";
import {
  checkVolunteerMatchRateLimit,
  rateLimitHeaders,
  readJsonBodyWithLimit,
  volunteerMatchRateLimitStores,
  VolunteerMatchRequestError,
  VOLUNTEER_MATCH_EVENT_BODY_LIMIT_BYTES,
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

async function hasVerifiedRouteProgramLink(routeId: string, programId: string) {
  const { data, error } = await supabaseAdmin
    .from("volunteer_match_route_programs")
    .select("id")
    .eq("route_id", routeId)
    .eq("program_id", programId)
    .limit(1);

  if (error) throw error;
  return Boolean(data && data.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkVolunteerMatchRateLimit({
      request: req,
      store: volunteerMatchRateLimitStores.events,
      bucket: "volunteer-match-events",
      limit: 120,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many event requests. Please wait a moment." },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimit.retryAfterSeconds),
        }
      );
    }

    const body = await readJsonBodyWithLimit(req, VOLUNTEER_MATCH_EVENT_BODY_LIMIT_BYTES);
    const event = volunteerMatchClientEventSchema.parse(body);
    const session = await getSession(event.sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (event.eventName === "matching_opportunity_clicked") {
      const isVerifiedLink = await hasVerifiedRouteProgramLink(
        event.routeId!,
        event.programId!
      );

      if (!isVerifiedLink) {
        return NextResponse.json(
          { error: "This opportunity link is not verified for the route." },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseAdmin.from("volunteer_match_events").insert({
      event_name: event.eventName,
      session_id: event.sessionId,
      route_id: event.routeId || null,
      program_id: event.programId || null,
      acquisition_source: session.acquisition_source,
      metadata: {},
    });

    if (error) {
      console.error("Volunteer match event insert error:", error);
      return NextResponse.json(
        { error: "Could not record volunteer match event." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof VolunteerMatchRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Volunteer match event route error:", error);
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
}

