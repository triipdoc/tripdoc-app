import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

type ClickRow = {
  program_id: string | null;
  action: string | null;
  created_at: string | null;
};

type ProgramRow = {
  id: string;
  title: string | null;
  country: string | null;
  type: string | null;
};

type AnalyticsRange = "last7days" | "last30days" | "alltime";

function getRangeStart(range: AnalyticsRange) {
  if (range === "alltime") return null;

  const now = new Date();
  const start = new Date(now);

  if (range === "last7days") {
    start.setDate(now.getDate() - 7);
  }

  if (range === "last30days") {
    start.setDate(now.getDate() - 30);
  }

  return start;
}

function rankPrograms(
  clicks: ClickRow[],
  programs: ProgramRow[],
  actionFilter?: string,
  limit = 5
) {
  const counts = new Map<string, number>();

  for (const row of clicks) {
    if (!row.program_id) continue;
    if (actionFilter && row.action !== actionFilter) continue;

    counts.set(row.program_id, (counts.get(row.program_id) || 0) + 1);
  }

  const programMap = new Map(
    programs.map((program) => [
      program.id,
      {
        title: program.title || "Unknown Program",
        country: program.country || "Unknown",
        type: program.type || "Unknown",
      },
    ])
  );

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([program_id, count]) => ({
      program_id,
      title: programMap.get(program_id)?.title || "Unknown Program",
      count,
    }));
}

function rankProgramField(
  clicks: ClickRow[],
  programs: ProgramRow[],
  field: "country" | "type",
  actionFilter?: string,
  limit = 5
) {
  const programMap = new Map(programs.map((program) => [program.id, program]));
  const counts = new Map<string, number>();

  for (const row of clicks) {
    if (!row.program_id) continue;
    if (actionFilter && row.action !== actionFilter) continue;

    const program = programMap.get(row.program_id);
    if (!program) continue;

    const key =
      field === "country"
        ? program.country?.trim() || "Unknown"
        : program.type?.trim() || "Unknown";

    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
    }));
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

    const [{ data: clicksData, error: clicksError }, { data: programsData, error: programsError }] =
      await Promise.all([
        supabaseAdmin
          .from("clicks")
          .select("program_id, action, created_at")
          .order("created_at", { ascending: false })
          .limit(10000),
        supabaseAdmin.from("programs").select("id, title, country, type"),
      ]);

    if (clicksError) {
      console.error("Analytics clicks error:", clicksError);
      return NextResponse.json({ error: clicksError.message }, { status: 500 });
    }

    if (programsError) {
      console.error("Analytics programs error:", programsError);
      return NextResponse.json(
        { error: programsError.message },
        { status: 500 }
      );
    }

    const allClicks = (clicksData || []) as ClickRow[];
    const programs = (programsData || []) as ProgramRow[];

    const filteredClicks = allClicks.filter((row) => {
      if (!row.created_at) return false;
      if (!rangeStart) return true;
      return new Date(row.created_at) >= rangeStart;
    });

    const totalClicks = filteredClicks.length;
    const totalApplyClicks = filteredClicks.filter(
      (row) => row.action === "apply_now"
    ).length;
    const totalCopyClicks = filteredClicks.filter(
      (row) => row.action === "copy_link"
    ).length;

    const response = {
      range,
      totalClicks,
      totalApplyClicks,
      totalCopyClicks,
      topClicked: rankPrograms(filteredClicks, programs),
      topApplied: rankPrograms(filteredClicks, programs, "apply_now"),
      topShared: rankPrograms(filteredClicks, programs, "copy_link"),
      topCountries: rankProgramField(filteredClicks, programs, "country"),
      topOpportunityTypes: rankProgramField(filteredClicks, programs, "type"),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Admin analytics route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}