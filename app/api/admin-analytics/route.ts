import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Admin analytics route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
