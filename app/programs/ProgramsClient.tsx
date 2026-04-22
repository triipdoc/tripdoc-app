"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
};

type ProgramsClientProps = {
  initialPrograms: Program[];
  searchQuery?: string;
  showBackLink?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalPrograms?: number;
  selectedType?: string;
  selectedCountry?: string;
  selectedFunding?: string;
  selectedSort?: string;
};

const sortOptions = [
  { label: "Latest", value: "latest" },
  { label: "Deadline Soon", value: "deadline_asc" },
  { label: "Latest Deadline", value: "deadline_desc" },
  { label: "Featured", value: "featured" },
  { label: "Trending (7 days)", value: "trending_7d" },
  { label: "Trending (30 days)", value: "trending_30d" },
  { label: "Most Applied", value: "most_applied" },
  { label: "Most Shared", value: "most_shared" },
];

function toCountrySlug(country: string) {
  return country.toLowerCase().trim().replace(/\s+/g, "-");
}

function toTypeSlug(type: string) {
  return type.toLowerCase().trim().replace(/\s+/g, "-");
}

function toFundingSlug(funding: string) {
  return funding.toLowerCase().trim().replace(/\s+/g, "-");
}

function Badge({ status }: { status?: string | null }) {
  const s = (status || "pending").toLowerCase();
  const isVerified = s === "verified";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        border: "1px solid #ddd",
        background: isVerified ? "#eaffea" : "#fff6dd",
      }}
    >
      {isVerified ? "✅ Verified" : "⏳ Pending"}
    </span>
  );
}

function getDeadlineStatus(deadline?: string | null) {
  if (!deadline) {
    return {
      label: "No deadline",
      tag: "gray" as const,
      daysLeft: null as number | null,
    };
  }

  const today = new Date();
  const d = new Date(deadline + "T00:00:00");
  const diffMs = d.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { label: "Expired", tag: "red" as const, daysLeft };
  }

  if (daysLeft === 0) {
    return { label: "Closing today", tag: "orange" as const, daysLeft };
  }

  if (daysLeft === 1) {
    return { label: "Closing in 1 day", tag: "orange" as const, daysLeft };
  }

  if (daysLeft <= 14) {
    return {
      label: `Closing in ${daysLeft} days`,
      tag: "orange" as const,
      daysLeft,
    };
  }

  return { label: "Open", tag: "green" as const, daysLeft };
}

function DeadlineBadge({ deadline }: { deadline?: string | null }) {
  const s = getDeadlineStatus(deadline);

  const bg =
    s.tag === "red"
      ? "#ffe5e5"
      : s.tag === "orange"
      ? "#fff1db"
      : s.tag === "green"
      ? "#eaffea"
      : "#f2f2f2";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        border: "1px solid #ddd",
        background: bg,
      }}
    >
      {s.label}
    </span>
  );
}

function ProgramImage({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        style={{
          width: "100%",
          height: 180,
          borderRadius: 10,
          marginBottom: 12,
          background: "#f1f1f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#777",
          fontSize: 14,
          fontWeight: 600,
          border: "1px solid #e5e5e5",
        }}
      >
        No image available
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      style={{
        width: "100%",
        height: 170,
        objectFit: "cover",
        borderRadius: 12,
        marginBottom: 14,
        display: "block",
      }}
    />
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  minWidth: 160,
  outline: "none",
  background: "white",
} as const;

const actionButtonStyle = {
  width: "100%",
  minWidth: 0,
  textAlign: "center" as const,
  padding: "11px 10px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap" as const,
  boxSizing: "border-box" as const,
};

export default function ProgramsClient({
  initialPrograms,
  searchQuery = "",
  showBackLink = false,
  currentPage = 1,
  totalPages = 1,
  totalPrograms,
  selectedType = "all",
  selectedCountry = "all",
  selectedFunding = "all",
  selectedSort = "latest",
}: ProgramsClientProps) {
  const router = useRouter();

  const [q, setQ] = useState(searchQuery);
  const [type, setType] = useState(selectedType);
  const [country, setCountry] = useState(selectedCountry);
  const [funding, setFunding] = useState(selectedFunding);
  const [sort, setSort] = useState(selectedSort);
  const [copiedProgramId, setCopiedProgramId] = useState<string | null>(null);

  const safeTotalPrograms = totalPrograms ?? initialPrograms.length;
  const safeTotalPages = totalPages < 1 ? 1 : totalPages;
  const safeCurrentPage = currentPage < 1 ? 1 : currentPage;

  async function trackClick(programId: string, action: string) {
    try {
      const res = await fetch("/api/track-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        body: JSON.stringify({
          program_id: programId,
          action,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Tracking API error:", result || res.statusText);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Tracking failed:", err);
      return false;
    }
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return initialPrograms.filter((p) => {
      const matchesQuery =
        !query ||
        (p.title || "").toLowerCase().includes(query) ||
        (p.country || "").toLowerCase().includes(query) ||
        (p.type || "").toLowerCase().includes(query) ||
        (p.funding_type || "").toLowerCase().includes(query);

      const matchesType =
        type === "all" || (p.type || "").toLowerCase() === type.toLowerCase();

      const matchesCountry =
        country === "all" || (p.country || "").toLowerCase() === country.toLowerCase();

      const matchesFunding =
        funding === "all" ||
        (p.funding_type || "").toLowerCase() === funding.toLowerCase();

      return matchesQuery && matchesType && matchesCountry && matchesFunding;
    });
  }, [initialPrograms, q, type, country, funding]);

  const types = useMemo(() => {
    const set = new Set<string>();

    initialPrograms.forEach((p) => {
      if (p.type) set.add(p.type.toLowerCase());
    });

    return ["all", ...Array.from(set).sort()];
  }, [initialPrograms]);

  const countries = useMemo(() => {
    const set = new Set<string>();

    initialPrograms.forEach((p) => {
      if (p.country) set.add(p.country);
    });

    return ["all", ...Array.from(set).sort()];
  }, [initialPrograms]);

  const fundings = useMemo(() => {
    const set = new Set<string>();

    initialPrograms.forEach((p) => {
      if (p.funding_type) set.add(p.funding_type);
    });

    return ["all", ...Array.from(set).sort()];
  }, [initialPrograms]);

  function updateUrl(nextValues: {
    q?: string;
    type?: string;
    country?: string;
    funding?: string;
    sort?: string;
    page?: string;
  }) {
    const params = new URLSearchParams(window.location.search);

    const nextQ = nextValues.q ?? q;
    const nextType = nextValues.type ?? type;
    const nextCountry = nextValues.country ?? country;
    const nextFunding = nextValues.funding ?? funding;
    const nextSort = nextValues.sort ?? sort;
    const nextPage = nextValues.page ?? "1";

    if (!nextQ.trim()) params.delete("q");
    else params.set("q", nextQ.trim());

    if (nextType === "all") params.delete("type");
    else params.set("type", nextType);

    if (nextCountry === "all") params.delete("country");
    else params.set("country", nextCountry);

    if (nextFunding === "all") params.delete("funding");
    else params.set("funding", nextFunding);

    if (nextSort === "latest") params.delete("sort");
    else params.set("sort", nextSort);

    if (nextPage === "1") params.delete("page");
    else params.set("page", nextPage);

    const queryString = params.toString();
    router.push(queryString ? `/programs?${queryString}` : "/programs");
  }

  function buildPageLink(page: number) {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedType !== "all") params.set("type", selectedType);
    if (selectedCountry !== "all") params.set("country", selectedCountry);
    if (selectedFunding !== "all") params.set("funding", selectedFunding);
    if (selectedSort !== "latest") params.set("sort", selectedSort);
    if (page > 1) params.set("page", String(page));

    const queryString = params.toString();
    return queryString ? `/programs?${queryString}` : "/programs";
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 16px" }}>
      <div style={{ marginBottom: 10 }}>
        {showBackLink && (
          <a
            href="/"
            style={{
              display: "inline-block",
              marginBottom: 16,
              textDecoration: "none",
              color: "#0070f3",
              fontWeight: 600,
            }}
          >
            ← Back to home
          </a>
        )}

        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>
          {searchQuery ? `Search results for "${searchQuery}"` : "All Opportunities"}
        </h1>

        <p style={{ marginTop: 8, color: "#666" }}>
          Discover verified scholarships, internships, jobs, and global opportunities.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 18,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          id="main-search"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            updateUrl({ q: value, page: "1" });
          }}
          placeholder="Search title, country, type, funding..."
          style={{
            ...inputStyle,
            minWidth: 260,
          }}
        />

        <select
          value={type}
          onChange={(e) => {
            const value = e.target.value;
            setType(value);
            updateUrl({ type: value, page: "1" });
          }}
          style={inputStyle}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All types" : t}
            </option>
          ))}
        </select>

        <select
          value={country}
          onChange={(e) => {
            const value = e.target.value;
            setCountry(value);
            updateUrl({ country: value, page: "1" });
          }}
          style={inputStyle}
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All countries" : c}
            </option>
          ))}
        </select>

        <select
          value={funding}
          onChange={(e) => {
            const value = e.target.value;
            setFunding(value);
            updateUrl({ funding: value, page: "1" });
          }}
          style={inputStyle}
        >
          {fundings.map((f) => (
            <option key={f} value={f}>
              {f === "all" ? "All funding" : f}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => {
            const value = e.target.value;
            setSort(value);
            updateUrl({ sort: value, page: "1" });
          }}
          style={inputStyle}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setQ("");
            setType("all");
            setCountry("all");
            setFunding("all");
            setSort("latest");
            router.push("/programs");
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Clear Filters
        </button>

        <div style={{ color: "#555", fontWeight: 600 }}>
          Showing {filtered.length} on this page • {safeTotalPrograms} total opportunities
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fafafa",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>No opportunities found</h3>

          <p style={{ margin: "0 0 12px 0", color: "#666", lineHeight: 1.6 }}>
            Try a different keyword, choose another country, or remove some filters.
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/programs"
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                textDecoration: "none",
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                fontWeight: 600,
              }}
            >
              View all opportunities
            </a>

            <a
              href="/programs?q=Germany"
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                textDecoration: "none",
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                fontWeight: 600,
              }}
            >
              Try Germany
            </a>

            <a
              href="/programs?q=scholarship"
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                textDecoration: "none",
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                fontWeight: 600,
              }}
            >
              Try scholarships
            </a>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              marginTop: 22,
            }}
          >
            {filtered.map((p) => {
              const applyLink = p.official_url || "#";
              const isApplyDisabled = !p.official_url;

              return (
                <div
                  key={p.id}
                  style={{
                    display: "block",
                    border: "1px solid #e5e7eb",
                    padding: 18,
                    borderRadius: 16,
                    background: "#ffffff",
                    minWidth: 0,
                    color: "inherit",
                    transition:
                      "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                  }}
                >
                  <a
                    href={`/programs/${p.slug}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                    }}
                  >
                    <ProgramImage src={p.image_url} alt={p.title} />

                    <div
                      style={{
                        fontSize: 21,
                        fontWeight: 700,
                        color: "#111",
                        marginBottom: 12,
                        lineHeight: 1.35,
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {p.title}
                    </div>
                  </a>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    <DeadlineBadge deadline={p.deadline} />
                    <Badge status={p.verification_status} />
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gap: 8,
                      fontSize: 16,
                      lineHeight: 1.55,
                      color: "#222",
                    }}
                  >
                    <div>
                      <strong>Country:</strong>{" "}
                      {p.country ? (
                        <a
                          href={`/countries/${toCountrySlug(p.country)}`}
                          style={{
                            color: "#0070f3",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          {p.country}
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div>
                      <strong>Type:</strong>{" "}
                      {p.type ? (
                        <a
                          href={`/types/${toTypeSlug(p.type)}`}
                          style={{
                            color: "#0070f3",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          {p.type}
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div>
                      <strong>Funding:</strong>{" "}
                      {p.funding_type ? (
                        <a
                          href={`/funding/${toFundingSlug(p.funding_type)}`}
                          style={{
                            color: "#0070f3",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          {p.funding_type}
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div>
                      <strong>Deadline:</strong> {p.deadline || "—"}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      display: "grid",
                      gridTemplateColumns: "1.25fr 1fr 1fr",
                      gap: 8,
                      alignItems: "stretch",
                    }}
                  >
                    <a
                      href={`/programs/${p.slug}`}
                      style={{
                        ...actionButtonStyle,
                        background: "#111",
                        color: "white",
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      }}
                    >
                      View Details
                    </a>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!isApplyDisabled && p.id) {
                          await trackClick(p.id, "apply_now");
                          window.open(applyLink, "_blank", "noopener,noreferrer");
                        }
                      }}
                      disabled={isApplyDisabled}
                      style={{
                        ...actionButtonStyle,
                        background: isApplyDisabled ? "#a3a3a3" : "#1677ff",
                        color: "white",
                        border: "none",
                        cursor: isApplyDisabled ? "not-allowed" : "pointer",
                        boxShadow: isApplyDisabled
                          ? "none"
                          : "0 2px 8px rgba(22,119,255,0.18)",
                      }}
                    >
                      Apply Now
                    </button>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!p.id || !p.slug) return;

                        try {
                          const detailUrl = `${window.location.origin}/programs/${p.slug}`;
                          await navigator.clipboard.writeText(detailUrl);
                          setCopiedProgramId(p.id);
                          await trackClick(p.id, "copy_link");

                          setTimeout(() => {
                            setCopiedProgramId((current) =>
                              current === p.id ? null : current
                            );
                          }, 2000);
                        } catch (err) {
                          console.error("Copy failed:", err);
                        }
                      }}
                      style={{
                        ...actionButtonStyle,
                        background: "#fff",
                        color: "#111",
                        border: "1px solid #d9d9d9",
                        cursor: "pointer",
                      }}
                    >
                      {copiedProgramId === p.id ? "Copied!" : "Copy Link"}
                    </button>
                  </div>

                  {isApplyDisabled && (
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                      Application link not available yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 20,
              marginBottom: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ color: "#666", fontSize: 14 }}>
              Showing page {safeCurrentPage} of {safeTotalPages} • {safeTotalPrograms} total opportunities
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {safeCurrentPage > 1 && (
                <a
                  href={buildPageLink(safeCurrentPage - 1)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    textDecoration: "none",
                    border: "1px solid #ddd",
                    color: "#111",
                    background: "#fff",
                    fontWeight: 600,
                  }}
                >
                  ← Previous
                </a>
              )}

              {safeCurrentPage < safeTotalPages && (
                <a
                  href={buildPageLink(safeCurrentPage + 1)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    textDecoration: "none",
                    border: "1px solid #2563eb",
                    color: "#fff",
                    background: "#2563eb",
                    fontWeight: 600,
                  }}
                >
                  Next →
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}