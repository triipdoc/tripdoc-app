import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getVolunteerSourceLabel } from "../../../lib/volunteerMatchMvp";
import { getVolunteerCountryName } from "../../../lib/volunteerMatchCountries";

type AnalyticsRange = "last7days" | "last30days" | "alltime";

type AnalyticsRow = {
  program_id: string;
  title: string;
  count: number;
};

type AnalyticsLabelRow = {
  label: string;
  count: number;
};

type AnalyticsRpcPayload = {
  totalClicks?: number;
  totalApplyClicks?: number;
  totalCopyClicks?: number;
  topClicked?: AnalyticsRow[];
  topApplied?: AnalyticsRow[];
  topShared?: AnalyticsRow[];
  topCountries?: AnalyticsLabelRow[];
  topOpportunityTypes?: AnalyticsLabelRow[];
};

type VolunteerMatchRouteRow = {
  route_id: string;
  route_slug: string;
  route_name: string;
  count: number;
};

type VolunteerMatchAnalyticsRpcPayload = {
  totalViews?: number;
  totalStarted?: number;
  totalCompleted?: number;
  matchingOpportunityClicks?: number;
  humanReviewClicks?: number;
  humanReviewSubmissions?: number;
  topAcquisitionSources?: AnalyticsLabelRow[];
  topCountries?: AnalyticsLabelRow[];
  topRecommendedRoutes?: VolunteerMatchRouteRow[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getRangeStart(range: AnalyticsRange) {
  if (range === "alltime") return null;

  const days = range === "last7days" ? 7 : 30;
  return new Date(Date.now() - days * MS_PER_DAY);
}

function normalizeRows<T extends { count: number }>(rows?: T[]) {
  return Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        count: Number(row.count) || 0,
      }))
    : [];
}

function emptyVolunteerMatchAnalytics(warning?: string) {
  return {
    totalViews: 0,
    totalStarted: 0,
    totalCompleted: 0,
    startRate: 0,
    completionRate: 0,
    matchingOpportunityClicks: 0,
    humanReviewClicks: 0,
    humanReviewSubmissions: 0,
    topAcquisitionSources: [] as AnalyticsLabelRow[],
    topCountries: [] as AnalyticsLabelRow[],
    topRecommendedRoutes: [] as VolunteerMatchRouteRow[],
    ...(warning ? { warning } : {}),
  };
}

function getRate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export async function GET(request: NextRequest) {
  try {
    const rangeParam = request.nextUrl.searchParams.get("range");
    const range: AnalyticsRange =
      rangeParam === "last7days" ||
      rangeParam === "last30days" ||
      rangeParam === "alltime"
        ? rangeParam
        : "last7days";

    const rangeStart = getRangeStart(range);

    const { data, error } = await supabaseAdmin.rpc("get_admin_analytics", {
      range_start: rangeStart ? rangeStart.toISOString().replace("Z", "") : null,
      result_limit: 5,
    });

    const {
      data: volunteerMatchData,
      error: volunteerMatchError,
    } = await supabaseAdmin.rpc("get_volunteer_match_admin_analytics", {
      range_start: rangeStart ? rangeStart.toISOString() : null,
      result_limit: 5,
    });

    if (error) {
      console.error("Admin analytics RPC error:", error);
      return NextResponse.json(
        {
          error:
            "Failed to load analytics. Run the get_admin_analytics database migration.",
        },
        { status: 500 }
      );
    }

    const analytics = (data || {}) as AnalyticsRpcPayload;
    const volunteerMatchAnalytics =
      (volunteerMatchData || {}) as VolunteerMatchAnalyticsRpcPayload;

    if (volunteerMatchError) {
      console.error("Volunteer Match analytics RPC error:", volunteerMatchError);
    }

    const totalViews = Number(volunteerMatchAnalytics.totalViews) || 0;
    const totalStarted = Number(volunteerMatchAnalytics.totalStarted) || 0;
    const totalCompleted = Number(volunteerMatchAnalytics.totalCompleted) || 0;

    const response = {
      range,
      totalClicks: Number(analytics.totalClicks) || 0,
      totalApplyClicks: Number(analytics.totalApplyClicks) || 0,
      totalCopyClicks: Number(analytics.totalCopyClicks) || 0,
      topClicked: normalizeRows(analytics.topClicked),
      topApplied: normalizeRows(analytics.topApplied),
      topShared: normalizeRows(analytics.topShared),
      topCountries: normalizeRows(analytics.topCountries),
      topOpportunityTypes: normalizeRows(analytics.topOpportunityTypes),
      volunteerMatch: volunteerMatchError
        ? emptyVolunteerMatchAnalytics(
            "Volunteer Match analytics migration is not available yet."
          )
        : {
            totalViews,
            totalStarted,
            totalCompleted,
            startRate: getRate(totalStarted, totalViews),
            completionRate: getRate(totalCompleted, totalStarted),
            matchingOpportunityClicks:
              Number(volunteerMatchAnalytics.matchingOpportunityClicks) || 0,
            humanReviewClicks:
              Number(volunteerMatchAnalytics.humanReviewClicks) || 0,
            humanReviewSubmissions:
              Number(volunteerMatchAnalytics.humanReviewSubmissions) || 0,
            topAcquisitionSources: normalizeRows(
              volunteerMatchAnalytics.topAcquisitionSources
            ).map((row) => ({
              ...row,
              label:
                row.label === "unknown"
                  ? "Unknown"
                  : getVolunteerSourceLabel(
                      row.label as Parameters<typeof getVolunteerSourceLabel>[0]
                    ),
            })),
            topCountries: normalizeRows(
              volunteerMatchAnalytics.topCountries
            ).map((row) => ({
              ...row,
              label:
                row.label === "unknown"
                  ? "Unknown"
                  : getVolunteerCountryName(row.label),
            })),
            topRecommendedRoutes: normalizeRows(
              volunteerMatchAnalytics.topRecommendedRoutes
            ),
          },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Admin analytics route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
