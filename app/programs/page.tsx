import { supabase } from "../../lib/supabase";
import ProgramsClient from "./ProgramsClient";

type Program = {
  id: string;
  title: string;
  slug: string | null;
  country: string | null;
  type: string | null;
  funding_type: string | null;
  deadline: string | null;
  official_url: string | null;
  image_url: string | null;
  verification_status: string | null;
  created_at?: string | null;
  featured?: boolean | null;
};

type ClickRow = {
  program_id: string | null;
  action?: string | null;
  created_at?: string | null;
};

const PAGE_SIZE = 24;

function safeDateValue(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function safeFutureDeadlineValue(value?: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function rankProgramsByClicks(clicks: ClickRow[] = [], actionFilter?: string) {
  const counts = new Map<string, number>();

  for (const row of clicks) {
    if (!row.program_id) continue;
    if (actionFilter && row.action !== actionFilter) continue;

    counts.set(row.program_id, (counts.get(row.program_id) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function rankProgramsByWeightedClicks(clicks: ClickRow[] = []) {
  const scores = new Map<string, number>();

  for (const row of clicks) {
    if (!row.program_id) continue;

    let weight = 1;
    if (row.action === "apply_now") weight = 3;
    if (row.action === "copy_link") weight = 2;

    scores.set(row.program_id, (scores.get(row.program_id) || 0) + weight);
  }

  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}

function orderProgramsByRanking(programs: Program[], ranking: [string, number][]) {
  const rankMap = new Map(ranking);
  const rankedPrograms: Program[] = [];
  const unrankedPrograms: Program[] = [];

  for (const program of programs) {
    if (rankMap.has(program.id)) {
      rankedPrograms.push(program);
    } else {
      unrankedPrograms.push(program);
    }
  }

  rankedPrograms.sort((a, b) => {
    const aScore = rankMap.get(a.id) || 0;
    const bScore = rankMap.get(b.id) || 0;

    if (bScore !== aScore) return bScore - aScore;

    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;

    return safeDateValue(b.created_at) - safeDateValue(a.created_at);
  });

  unrankedPrograms.sort((a, b) => {
    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;

    return safeDateValue(b.created_at) - safeDateValue(a.created_at);
  });

  return [...rankedPrograms, ...unrankedPrograms];
}

function orderProgramsBySort(programs: Program[], sort: string) {
  const items = [...programs];

  if (sort === "latest") {
    return items.sort((a, b) => {
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;

      return safeDateValue(b.created_at) - safeDateValue(a.created_at);
    });
  }

  if (sort === "deadline_asc") {
    return items.sort((a, b) => {
      const deadlineDiff =
        safeFutureDeadlineValue(a.deadline) - safeFutureDeadlineValue(b.deadline);

      if (deadlineDiff !== 0) return deadlineDiff;

      return safeDateValue(b.created_at) - safeDateValue(a.created_at);
    });
  }

  if (sort === "deadline_desc") {
    return items.sort((a, b) => {
      const aDeadline = safeFutureDeadlineValue(a.deadline);
      const bDeadline = safeFutureDeadlineValue(b.deadline);

      if (bDeadline !== aDeadline) return bDeadline - aDeadline;

      return safeDateValue(b.created_at) - safeDateValue(a.created_at);
    });
  }

  if (sort === "featured") {
    return items.sort((a, b) => {
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;

      return safeDateValue(b.created_at) - safeDateValue(a.created_at);
    });
  }

  return items.sort((a, b) => safeDateValue(b.created_at) - safeDateValue(a.created_at));
}

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    country?: string;
    funding?: string;
    page?: string;
    sort?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};

  const q = params.q?.trim() || "";
  const type = params.type?.trim() || "all";
  const country = params.country?.trim() || "all";
  const funding = params.funding?.trim() || "all";
  const sort = params.sort?.trim() || "latest";

  const parsedPage = Number(params.page || "1");
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const needsAnalyticsSort = [
    "trending_7d",
    "trending_30d",
    "most_applied",
    "most_shared",
  ].includes(sort);

  const baseSelect =
    "id,title,slug,country,type,funding_type,deadline,official_url,image_url,verification_status,created_at,featured";

  if (!needsAnalyticsSort) {
    let query = supabase
      .from("programs")
      .select(baseSelect, { count: "exact" })
      .eq("verification_status", "verified");

    if (q) {
      query = query.or(
        `title.ilike.%${q}%,country.ilike.%${q}%,type.ilike.%${q}%,funding_type.ilike.%${q}%`
      );
    }

    if (type !== "all") {
      query = query.eq("type", type);
    }

    if (country !== "all") {
      query = query.eq("country", country);
    }

    if (funding !== "all") {
      query = query.eq("funding_type", funding);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Programs page error:", error.message);
    }

    const allPrograms = orderProgramsBySort((data || []) as Program[], sort);
    const totalPrograms = count ?? allPrograms.length;
    const totalPages = Math.max(Math.ceil(totalPrograms / PAGE_SIZE), 1);
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const from = (safeCurrentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    const programs = allPrograms.slice(from, to);

    return (
      <ProgramsClient
        initialPrograms={programs}
        searchQuery={q}
        selectedType={type}
        selectedCountry={country}
        selectedFunding={funding}
        selectedSort={sort}
        showBackLink={true}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        totalPrograms={totalPrograms}
      />
    );
  }

  let baseQuery = supabase
    .from("programs")
    .select(baseSelect, { count: "exact" })
    .eq("verification_status", "verified");

  if (q) {
    baseQuery = baseQuery.or(
      `title.ilike.%${q}%,country.ilike.%${q}%,type.ilike.%${q}%,funding_type.ilike.%${q}%`
    );
  }

  if (type !== "all") {
    baseQuery = baseQuery.eq("type", type);
  }

  if (country !== "all") {
    baseQuery = baseQuery.eq("country", country);
  }

  if (funding !== "all") {
    baseQuery = baseQuery.eq("funding_type", funding);
  }

  const { data: allProgramsData, error: allProgramsError, count } = await baseQuery;

  if (allProgramsError) {
    console.error("Programs analytics sort error:", allProgramsError.message);
  }

  const allPrograms = (allProgramsData || []) as Program[];
  const filteredProgramIds = new Set(allPrograms.map((program) => program.id));

  const now = new Date();
  const fromDate = new Date(now);

  if (sort === "trending_30d") {
    fromDate.setDate(now.getDate() - 30);
  } else {
    fromDate.setDate(now.getDate() - 7);
  }

  const { data: clicksData, error: clicksError } = await supabase
    .from("clicks")
    .select("program_id,action,created_at")
    .gte("created_at", fromDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);

  if (clicksError) {
    console.error("Clicks query error:", clicksError.message);
  }

  const clicks = ((clicksData || []) as ClickRow[]).filter(
    (row) => row.program_id && filteredProgramIds.has(row.program_id)
  );

  let ranking: [string, number][] = [];

  if (sort === "trending_7d" || sort === "trending_30d") {
    ranking = rankProgramsByWeightedClicks(clicks);
  } else if (sort === "most_applied") {
    ranking = rankProgramsByClicks(clicks, "apply_now");
  } else if (sort === "most_shared") {
    ranking = rankProgramsByClicks(clicks, "copy_link");
  }

  const orderedPrograms = orderProgramsByRanking(allPrograms, ranking);

  const totalPrograms = count ?? orderedPrograms.length;
  const totalPages = Math.max(Math.ceil(totalPrograms / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const from = (safeCurrentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  const programs = orderedPrograms.slice(from, to);

  return (
    <ProgramsClient
      initialPrograms={programs}
      searchQuery={q}
      selectedType={type}
      selectedCountry={country}
      selectedFunding={funding}
      selectedSort={sort}
      showBackLink={true}
      currentPage={safeCurrentPage}
      totalPages={totalPages}
      totalPrograms={totalPrograms}
    />
  );
}