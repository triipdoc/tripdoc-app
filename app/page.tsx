import { supabase } from "../lib/supabase";
import ProgramsClient from "./programs/ProgramsClient";
import HorizontalRow from "./components/HorizontalRow";
import HeroSearch from "./components/HeroSearch";
import TrackedProgramLink from "./components/TrackedProgramLink";

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
  title?: string | null;
  type?: string | null;
  action?: string | null;
  created_at?: string | null;
};

const quickCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: "16px 18px",
  textDecoration: "none",
  color: "black",
  background: "white",
  fontWeight: 700,
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  minHeight: 60,
  minWidth: 200,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
} as const;

const cardStyle = {
  border: "1px solid #e5e7eb",
  padding: 18,
  borderRadius: 14,
  background: "white",
  minWidth: 260,
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
} as const;

const featuredCardStyle = {
  border: "1px solid #f3e7b3",
  padding: 18,
  borderRadius: 18,
  background: "linear-gradient(180deg, #fffdf7 0%, #ffffff 100%)",
  minWidth: 290,
  boxShadow: "0 8px 24px rgba(138,90,0,0.08)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
} as const;

function isNotExpired(deadline?: string | null) {
  if (!deadline) return true;

  const today = new Date();
  const d = new Date(deadline + "T23:59:59");

  return d.getTime() >= today.getTime();
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
    if (row.action === "open_detail") weight = 1;

    scores.set(row.program_id, (scores.get(row.program_id) || 0) + weight);
  }

  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}

function pickProgramsByRank(
  programs: Program[],
  rankedEntries: [string, number][],
  limit = 6,
  excludeIds = new Set<string>()
) {
  const byId = new Map(programs.map((p) => [p.id, p]));
  const results: Program[] = [];

  for (const [programId] of rankedEntries) {
    const program = byId.get(programId);
    if (!program) continue;
    if (excludeIds.has(program.id)) continue;
    if (!program.slug) continue;
    if (program.verification_status !== "verified") continue;
    if (!isNotExpired(program.deadline)) continue;

    results.push(program);

    if (results.length >= limit) break;
  }

  return results;
}

function getMetricMap(entries: [string, number][]) {
  return new Map(entries);
}

function formatDeadline(deadline?: string | null) {
  if (!deadline) return "No deadline";

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ProgramCard({
  program,
  badge,
  badgeStyle,
  meta,
  featured = false,
}: {
  program: Program;
  badge?: string;
  badgeStyle?: Record<string, string | number>;
  meta?: string;
  featured?: boolean;
}) {
  if (!program.slug) return null;

  return (
    <TrackedProgramLink
      href={`/programs/${program.slug}`}
      programId={program.id}
      className="horizontal-card"
      style={{
        ...(featured ? featuredCardStyle : cardStyle),
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {program.image_url && (
        <img
          src={program.image_url}
          alt={program.title}
          loading="lazy"
          style={{
            width: "100%",
            height: featured ? 170 : 140,
            objectFit: "cover",
            borderRadius: 10,
            marginBottom: 12,
            display: "block",
          }}
        />
      )}

      {badge && (
        <div
          style={{
            display: "inline-block",
            marginBottom: 10,
            padding: "6px 10px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 13,
            ...badgeStyle,
          }}
        >
          {badge}
        </div>
      )}

      <div
        style={{
          fontSize: featured ? 20 : 18,
          fontWeight: 700,
          color: "black",
          lineHeight: 1.4,
        }}
      >
        {program.title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          color: "#555",
          lineHeight: 1.5,
        }}
      >
        {meta || `${program.country || "—"} • ${program.funding_type || "—"}`}
      </div>

      {featured && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 13,
            fontWeight: 600,
            color: "#6b7280",
          }}
        >
          {program.country && <span>🌍 {program.country}</span>}
          {program.type && <span>📚 {program.type}</span>}
          {program.deadline && <span>⏰ {formatDeadline(program.deadline)}</span>}
        </div>
      )}
    </TrackedProgramLink>
  );
}

const now = new Date();
const sevenDaysAgo = new Date(now);
sevenDaysAgo.setDate(now.getDate() - 7);

const thirtyDaysAgo = new Date(now);
thirtyDaysAgo.setDate(now.getDate() - 30);

export default async function Home() {
  const { data, error } = await supabase
    .from("programs")
    .select(
      "id,title,slug,type,country,funding_type,deadline,official_url,image_url,verification_status,created_at,featured"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    );
  }

  const programs = ((data || []) as Program[]).filter((p) => {
    const cleanTitle = p.title?.trim().toLowerCase();

    return (
      !!p.id &&
      !!p.slug &&
      !!p.title &&
      cleanTitle !== "featured" &&
      cleanTitle !== "test" &&
      cleanTitle !== "draft"
    );
  });

  const verifiedActivePrograms = programs.filter(
    (p) => p.verification_status === "verified" && isNotExpired(p.deadline)
  );

  const { data: clickData } = await supabase
    .from("clicks")
    .select("program_id,title,type,action,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: clickData7d } = await supabase
    .from("clicks")
    .select("program_id,title,type,action,created_at")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: clickData30d } = await supabase
    .from("clicks")
    .select("program_id,title,type,action,created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(1000);

  const clicks = (clickData || []) as ClickRow[];
  const clicks7d = (clickData7d || []) as ClickRow[];
  const clicks30d = (clickData30d || []) as ClickRow[];

  const overallClickRanking = rankProgramsByClicks(clicks);
  const weightedTrending7dRanking = rankProgramsByWeightedClicks(clicks7d);
  const weightedTrending30dRanking = rankProgramsByWeightedClicks(clicks30d);
  const mostAppliedRanking = rankProgramsByClicks(clicks7d, "apply_now");
  const mostSharedRanking = rankProgramsByClicks(clicks7d, "copy_link");

  const clickCountMap = getMetricMap(overallClickRanking);
  const trending7dMap = getMetricMap(weightedTrending7dRanking);
  const trending30dMap = getMetricMap(weightedTrending30dRanking);
  const mostAppliedMap = getMetricMap(mostAppliedRanking);
  const mostSharedMap = getMetricMap(mostSharedRanking);

  const featuredPrograms = verifiedActivePrograms
    .filter((p) => p.featured)
    .slice(0, 6);

  const featuredIds = new Set(featuredPrograms.map((p) => p.id));

  const closingSoon = verifiedActivePrograms
    .filter((p) => {
      if (!p.deadline) return false;
      if (featuredIds.has(p.id)) return false;

      const deadline = new Date(p.deadline + "T23:59:59");
      const today = new Date();

      const diff =
        (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      return diff <= 7 && diff >= 0;
    })
    .slice(0, 6);

  const closingSoonIds = new Set(closingSoon.map((p) => p.id));

  const trendingFromClicks = pickProgramsByRank(
    verifiedActivePrograms,
    overallClickRanking,
    6,
    new Set([...featuredIds, ...closingSoonIds])
  );

  const trendingFromClicksIds = new Set(trendingFromClicks.map((p) => p.id));

  const newlyAdded = verifiedActivePrograms
    .filter(
      (p) =>
        !featuredIds.has(p.id) &&
        !closingSoonIds.has(p.id) &&
        !trendingFromClicksIds.has(p.id)
    )
    .slice(0, 4);

  const newlyAddedIds = new Set(newlyAdded.map((p) => p.id));

  const excludedForAnalytics = new Set<string>([
    ...featuredIds,
    ...closingSoonIds,
    ...newlyAddedIds,
    ...trendingFromClicksIds,
  ]);

  const trendingThisWeek = pickProgramsByRank(
    verifiedActivePrograms,
    weightedTrending7dRanking,
    6,
    excludedForAnalytics
  );

  const trendingThisMonth = pickProgramsByRank(
    verifiedActivePrograms,
    weightedTrending30dRanking,
    6,
    excludedForAnalytics
  );

  const mostApplied = pickProgramsByRank(
    verifiedActivePrograms,
    mostAppliedRanking,
    6,
    excludedForAnalytics
  );

  const mostShared = pickProgramsByRank(
    verifiedActivePrograms,
    mostSharedRanking,
    6,
    excludedForAnalytics
  );

  const popularPrograms = verifiedActivePrograms
    .filter(
      (p) =>
        !featuredIds.has(p.id) &&
        !closingSoonIds.has(p.id)
    )
    .slice(0, 6);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px 48px" }}>
      <div
        style={{
          marginBottom: 48,
          padding: "56px 0 32px",
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            marginBottom: 16,
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
          }}
        >
          Discover Verified Global Opportunities Worldwide
        </h1>

        <p
          style={{
            fontSize: 20,
            color: "#555",
            maxWidth: 680,
            marginBottom: 28,
            lineHeight: 1.55,
          }}
        >
          Scholarships, internships, fellowships, and research programs worldwide —
          all verified and curated to help you study, travel, and build your career.
        </p>

        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          <a
            href="/category/scholarship"
            style={{
              background: "#0070f3",
              color: "white",
              padding: "13px 22px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              boxShadow: "0 6px 18px rgba(0,112,243,0.22)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            🎓 Explore Scholarships
          </a>

          <a
            href="/category/internship"
            style={{
              border: "1px solid #ddd",
              padding: "13px 22px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              color: "#333",
              background: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            💼 Explore Internships
          </a>
        </div>

        <div style={{ marginTop: 10, marginBottom: 4 }}>
          <HeroSearch />
        </div>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          {[
            "🌍 30+ Countries",
            "🎓 500+ Opportunities",
            "✅ Verified Listings",
            "⚡ Updated Daily",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid #e5e7eb",
                padding: "10px 16px",
                borderRadius: 10,
                background: "#fafafa",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 20,
            color: "#555",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <span>✅ Verified opportunities</span>
          <span>🌍 Global destinations</span>
          <span>🔎 Easy search and filters</span>
        </div>
      </div>

      {featuredPrograms.length > 0 && (
        <div
          style={{
            marginTop: 0,
            marginBottom: 72,
            border: "1px solid #f3e7b3",
            borderRadius: 24,
            padding: "26px 22px 24px",
            background: "linear-gradient(180deg, #fffaf0 0%, #ffffff 100%)",
            boxShadow: "0 10px 30px rgba(138,90,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-end",
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  marginBottom: 10,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "#fff4d6",
                  color: "#8a5a00",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                ⭐ Editor’s Picks
              </div>

              <h2 style={{ margin: "0 0 8px 0", fontSize: 30, fontWeight: 800 }}>
                Featured Opportunities
              </h2>

              <p style={{ color: "#666", margin: 0, maxWidth: 760, lineHeight: 1.6 }}>
                Hand-picked opportunities highlighted by TripDoc for faster discovery.
                These are strong options worth checking first.
              </p>
            </div>

            <a
              href="#all-opportunities"
              style={{
                textDecoration: "none",
                fontWeight: 700,
                color: "#8a5a00",
                padding: "10px 14px",
                borderRadius: 10,
                background: "#fff",
                border: "1px solid #f3e7b3",
              }}
            >
              Browse all →
            </a>
          </div>

          <HorizontalRow>
            {featuredPrograms.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                featured
                badge="⭐ Featured"
                badgeStyle={{
                  background: "#fff4d6",
                  color: "#8a5a00",
                }}
                meta={`${p.country || "—"} • ${p.funding_type || "—"}`}
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      <div
        style={{
          marginTop: 8,
          marginBottom: 48,
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: "24px 22px",
          background: "#ffffff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px 0",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          Why Trust TripDoc?
        </h2>

        <p
          style={{
            margin: "0 0 18px 0",
            color: "#666",
            maxWidth: 760,
            lineHeight: 1.6,
          }}
        >
          We focus on verified global opportunities and present them in a simple,
          searchable format so students and professionals can find real options faster.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              title: "✅ Verified sources",
              text: "We prioritize opportunities with traceable official links and clear details.",
            },
            {
              title: "🌍 Global opportunities",
              text: "Scholarships, internships, research and fellowships across multiple countries.",
            },
            {
              title: "⚡ Updated regularly",
              text: "New programs are added frequently so visitors can keep discovering fresh options.",
            },
            {
              title: "🔎 Easy to search",
              text: "Use smart search, filters and category pages to find the right match quickly.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                border: "1px solid #eef0f3",
                borderRadius: 14,
                padding: 16,
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
              <div style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 48 }}>
        <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
          Browse by Category
        </h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Explore opportunities by category.
        </p>

        <HorizontalRow>
          <a href="/category/scholarship" style={quickCardStyle} className="horizontal-card">
            🎓 Scholarships
          </a>

          <a href="/category/internship" style={quickCardStyle} className="horizontal-card">
            💼 Internships
          </a>

          <a href="/category/research" style={quickCardStyle} className="horizontal-card">
            🔬 Research
          </a>

          <a href="/category/fellowship" style={quickCardStyle} className="horizontal-card">
            🌍 Fellowships
          </a>
        </HorizontalRow>
      </div>

      <div style={{ marginTop: 56 }}>
        <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
          🔥 Closing Soon
        </h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Opportunities with deadlines approaching within the next 7 days.
        </p>

        {closingSoon.length === 0 ? (
          <p>No urgent deadlines right now.</p>
        ) : (
          <HorizontalRow>
            {closingSoon.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                badge="⏰ Closing Soon"
                badgeStyle={{
                  background: "#fff1db",
                  color: "#a05a00",
                }}
                meta={`Deadline: ${formatDeadline(p.deadline)}`}
              />
            ))}
          </HorizontalRow>
        )}
      </div>

      {trendingFromClicks.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            📈 Trending by Users
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Opportunities getting the most interest from recent visitors on TripDoc.
          </p>

          <HorizontalRow>
            {trendingFromClicks.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                badge={`🔥 ${clickCountMap.get(p.id) || 0} clicks`}
                badgeStyle={{
                  background: "#eef4ff",
                  color: "#1d4ed8",
                }}
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      {trendingThisWeek.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            📊 Trending This Week
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Opportunities with the strongest user activity in the last 7 days.
          </p>

          <HorizontalRow>
            {trendingThisWeek.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                badge={`⚡ Score ${trending7dMap.get(p.id) || 0}`}
                badgeStyle={{
                  background: "#ecfeff",
                  color: "#0f766e",
                }}
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      {trendingThisMonth.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            🗓️ Trending This Month
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Opportunities that kept attracting attention in the last 30 days.
          </p>

          <HorizontalRow>
            {trendingThisMonth.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                badge={`📈 Score ${trending30dMap.get(p.id) || 0}`}
                badgeStyle={{
                  background: "#f3f0ff",
                  color: "#6d28d9",
                }}
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      {mostApplied.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            📝 Most Applied
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Opportunities users clicked Apply Now on the most in the last 7 days.
          </p>

          <HorizontalRow>
            {mostApplied.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                badge={`🚀 ${mostAppliedMap.get(p.id) || 0} apply clicks`}
                badgeStyle={{
                  background: "#effdf5",
                  color: "#15803d",
                }}
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      {mostShared.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            🔗 Most Shared
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Opportunities users copied and shared the most in the last 7 days.
          </p>

          <HorizontalRow>
            {mostShared.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                badge={`📎 ${mostSharedMap.get(p.id) || 0} shares`}
                badgeStyle={{
                  background: "#fff7ed",
                  color: "#c2410c",
                }}
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      <div style={{ marginTop: 56 }}>
        <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
          🔥 Popular Opportunities
        </h2>

        <p style={{ color: "#666", marginBottom: 20 }}>
          Verified programs many students are currently exploring.
        </p>

        <HorizontalRow>
          {popularPrograms.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </HorizontalRow>
      </div>

      <div style={{ marginTop: 56 }}>
        <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
          Browse by Country
        </h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Explore opportunities by destination country.
        </p>

        <HorizontalRow>
          <a href="/country/germany" style={quickCardStyle} className="horizontal-card">
            🇩🇪 Germany
          </a>

          <a href="/country/canada" style={quickCardStyle} className="horizontal-card">
            🇨🇦 Canada
          </a>

          <a href="/country/netherlands" style={quickCardStyle} className="horizontal-card">
            🇳🇱 Netherlands
          </a>

          <a href="/country/australia" style={quickCardStyle} className="horizontal-card">
            🇦🇺 Australia
          </a>
        </HorizontalRow>
      </div>

      {newlyAdded.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            🆕 Newly Added Opportunities
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Recently added verified programs on TripDoc.
          </p>

          <HorizontalRow>
            {newlyAdded.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </HorizontalRow>
        </div>
      )}

      <div id="all-opportunities" style={{ marginTop: 88 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 10, fontSize: 30, fontWeight: 800 }}>
            Explore All Opportunities
          </h2>

          <p style={{ color: "#666", margin: 0, maxWidth: 760, fontSize: 17 }}>
            Search and filter verified scholarships, internships, fellowships, and
            research programs from around the world.
          </p>
        </div>

        <ProgramsClient initialPrograms={programs} />
      </div>
    </main>
  );
}