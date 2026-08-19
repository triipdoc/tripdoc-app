import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import {
  evaluateVolunteerRoutes,
  toPublicVolunteerRouteResult,
} from "../../../lib/volunteerMatchEngine";
import {
  buildVolunteerMatchResponse,
  parseVolunteerMatchSubmission,
  volunteerLinkedOpportunitySchema,
  VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION,
  type VolunteerLinkedOpportunity,
} from "../../../lib/volunteerMatchMvp";
import {
  checkVolunteerMatchRateLimit,
  rateLimitHeaders,
  readJsonBodyWithLimit,
  volunteerMatchRateLimitStores,
  VolunteerMatchRequestError,
  VOLUNTEER_MATCH_BODY_LIMIT_BYTES,
} from "../../../lib/volunteerMatchAbuseProtection";
import {
  volunteerRouteRecordSchema,
  volunteerRuleVersionRecordSchema,
  type VolunteerRouteRecord,
  type VolunteerRuleVersionRecord,
} from "../../../lib/volunteerMatchSchemas";

export const dynamic = "force-dynamic";

type ProgramJoinRow = {
  id?: string;
  title?: string | null;
  slug?: string | null;
  country?: string | null;
  type?: string | null;
  funding_type?: string | null;
  deadline?: string | null;
  verification_status?: string | null;
};

type RouteProgramJoinRow = {
  route_id: string;
  relationship_type: string | null;
  display_order: number | null;
  program?: ProgramJoinRow | ProgramJoinRow[] | null;
};

const routeSelect =
  "id,slug,name,route_family,summary,source_url,source_title,source_organisation,last_verified_at,verification_due_at,verification_notes";

const ruleSelect =
  "id,route_id,version_number,rules_json,source_url,source_title,source_organisation,last_verified_at,verification_due_at,verification_notes";

function getProgramFromJoin(row: RouteProgramJoinRow) {
  if (Array.isArray(row.program)) return row.program[0] || null;
  return row.program || null;
}

function groupLinkedOpportunities(rows: RouteProgramJoinRow[] = []) {
  const grouped = new Map<string, VolunteerLinkedOpportunity[]>();

  rows.forEach((row) => {
    const program = getProgramFromJoin(row);

    if (
      !program?.id ||
      !program.title?.trim() ||
      !program.slug?.trim() ||
      program.verification_status !== "verified"
    ) {
      return;
    }

    const opportunity = volunteerLinkedOpportunitySchema.parse({
      id: program.id,
      title: program.title,
      slug: program.slug,
      country: program.country || null,
      type: program.type || null,
      fundingType: program.funding_type || null,
      deadline: program.deadline || null,
      relationshipType: row.relationship_type || "related_opportunity",
    });

    const current = grouped.get(row.route_id) || [];
    current.push(opportunity);
    grouped.set(row.route_id, current);
  });

  return grouped;
}

async function loadRoutesAndRules() {
  const { data: routeRows, error: routeError } = await supabaseAdmin
    .from("volunteer_routes")
    .select(routeSelect)
    .eq("active", true)
    .eq("verification_status", "verified")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (routeError) throw routeError;

  const routes = (routeRows || []).map((route) =>
    volunteerRouteRecordSchema.parse(route)
  );

  if (routes.length === 0) {
    return {
      routes,
      ruleVersionsByRouteId: new Map<string, VolunteerRuleVersionRecord>(),
      linkedOpportunitiesByRouteId: new Map<string, VolunteerLinkedOpportunity[]>(),
    };
  }

  const routeIds = routes.map((route) => route.id);

  const { data: ruleRows, error: ruleError } = await supabaseAdmin
    .from("volunteer_route_rule_versions")
    .select(ruleSelect)
    .in("route_id", routeIds)
    .eq("status", "published");

  if (ruleError) throw ruleError;

  const ruleVersionsByRouteId = new Map<string, VolunteerRuleVersionRecord>();

  (ruleRows || []).forEach((rule) => {
    const parsedRule = volunteerRuleVersionRecordSchema.parse(rule);
    ruleVersionsByRouteId.set(parsedRule.route_id, parsedRule);
  });

  const { data: linkedRows, error: linkedError } = await supabaseAdmin
    .from("volunteer_match_route_programs")
    .select(
      "route_id,relationship_type,display_order,program:programs(id,title,slug,country,type,funding_type,deadline,verification_status)"
    )
    .in("route_id", routeIds)
    .order("display_order", { ascending: true });

  if (linkedError) throw linkedError;

  return {
    routes,
    ruleVersionsByRouteId,
    linkedOpportunitiesByRouteId: groupLinkedOpportunities(
      (linkedRows || []) as RouteProgramJoinRow[]
    ),
  };
}

async function insertVolunteerMatchEvents({
  sessionId,
  acquisitionSource,
  results,
}: {
  sessionId: string;
  acquisitionSource: string;
  results: ReturnType<typeof toPublicVolunteerRouteResult>[];
}) {
  const now = new Date().toISOString();
  const eventRows = [
    {
      event_name: "volunteer_match_started",
      session_id: sessionId,
      acquisition_source: acquisitionSource,
      metadata: {
        privacy_notice_version: VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION,
      },
      created_at: now,
    },
    {
      event_name: "volunteer_match_completed",
      session_id: sessionId,
      acquisition_source: acquisitionSource,
      metadata: { route_count: results.length },
      created_at: now,
    },
    ...results.map((result) => ({
      event_name: "volunteer_match_result",
      session_id: sessionId,
      route_id: result.routeId,
      acquisition_source: acquisitionSource,
      metadata: {
        verdict: result.verdict,
        route_slug: result.routeSlug,
      },
      created_at: now,
    })),
  ];

  const { error } = await supabaseAdmin
    .from("volunteer_match_events")
    .insert(eventRows);

  if (error) throw error;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkVolunteerMatchRateLimit({
      request: req,
      store: volunteerMatchRateLimitStores.match,
      bucket: "volunteer-match",
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many match attempts. Please wait a moment and try again." },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimit.retryAfterSeconds),
        }
      );
    }

    const body = await readJsonBodyWithLimit(req, VOLUNTEER_MATCH_BODY_LIMIT_BYTES);
    const submission = parseVolunteerMatchSubmission(body);
    const completedAt = new Date().toISOString();

    const { routes, ruleVersionsByRouteId, linkedOpportunitiesByRouteId } =
      await loadRoutesAndRules();

    const routesWithRules = routes
      .map((route: VolunteerRouteRecord) => {
        const ruleVersion = ruleVersionsByRouteId.get(route.id);
        return ruleVersion ? { route, ruleVersion } : null;
      })
      .filter(Boolean) as {
      route: VolunteerRouteRecord;
      ruleVersion: VolunteerRuleVersionRecord;
    }[];

    if (routesWithRules.length === 0) {
      return NextResponse.json(
        { error: "Volunteer routes are not available right now." },
        { status: 503 }
      );
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("volunteer_match_sessions")
      .insert({
        status: "completed",
        acquisition_source: submission.answers.acquisitionSource,
        acquisition_source_detail: submission.answers.acquisitionSourceDetail || null,
        answers_json: submission.answers,
        privacy_notice_version: VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION,
        consented_at: completedAt,
        completed_at: completedAt,
      })
      .select("id")
      .single();

    if (sessionError || !session?.id) {
      console.error("Volunteer match session insert error:", sessionError);
      return NextResponse.json(
        { error: "Could not create volunteer match session." },
        { status: 500 }
      );
    }

    const results = evaluateVolunteerRoutes(
      submission.answers,
      routesWithRules,
      new Date(completedAt)
    );

    const resultRows = results.map((result) => ({
      session_id: session.id,
      route_id: result.routeId,
      rule_version_id: result.ruleVersionId,
      verdict: result.verdict,
      internal_score: result.internalScore,
      reasons_json: result.reasons,
      blockers_json: result.blockers,
      next_steps_json: result.nextSteps,
      human_review_reasons_json: result.humanReviewReasons,
    }));

    const { error: resultError } = await supabaseAdmin
      .from("volunteer_match_results")
      .insert(resultRows);

    if (resultError) {
      console.error("Volunteer match result insert error:", resultError);
      return NextResponse.json(
        { error: "Could not save volunteer match results." },
        { status: 500 }
      );
    }

    await insertVolunteerMatchEvents({
      sessionId: session.id,
      acquisitionSource: submission.answers.acquisitionSource,
      results: results.map(toPublicVolunteerRouteResult),
    });

    return NextResponse.json(
      buildVolunteerMatchResponse({
        sessionId: session.id,
        acquisitionSource: submission.answers.acquisitionSource,
        results,
        linkedOpportunitiesByRouteId,
      })
    );
  } catch (error) {
    if (error instanceof VolunteerMatchRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Volunteer match POST error:", error);
    return NextResponse.json(
      { error: "Please check the form and try again." },
      { status: 400 }
    );
  }
}

