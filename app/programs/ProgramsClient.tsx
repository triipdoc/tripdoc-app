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
};

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
        height: 150,
        fontSize: 13,
        objectFit: "cover",
        borderRadius: 10,
        marginBottom: 12,
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

export default function ProgramsClient({
  initialPrograms,
  searchQuery = "",
  showBackLink = false,
  currentPage = 1,
  totalPages = 1,
  totalPrograms = 0,
  selectedType = "all",
  selectedCountry = "all",
  selectedFunding = "all",
}: ProgramsClientProps) {
  const router = useRouter();

  const [q, setQ] = useState(searchQuery);
  const [type, setType] = useState(selectedType);
  const [country, setCountry] = useState(selectedCountry);
  const [funding, setFunding] = useState(selectedFunding);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const sorted = [...initialPrograms].sort((a, b) => {
      const aStatus = getDeadlineStatus(a.deadline).daysLeft ?? 999999;
      const bStatus = getDeadlineStatus(b.deadline).daysLeft ?? 999999;
      return aStatus - bStatus;
    });

    return sorted.filter((p) => {
      const matchesQuery =
        !query ||
        (p.title || "").toLowerCase().includes(query) ||
        (p.country || "").toLowerCase().includes(query) ||
        (p.type || "").toLowerCase().includes(query) ||
        (p.funding_type || "").toLowerCase().includes(query);

      const matchesType =
        type === "all" || (p.type || "").toLowerCase() === type;

      const matchesCountry =
        country === "all" || (p.country || "") === country;

      const matchesFunding =
        funding === "all" || (p.funding_type || "") === funding;

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
    page?: string;
  }) {
    const params = new URLSearchParams(window.location.search);

    const nextQ = nextValues.q ?? q;
    const nextType = nextValues.type ?? type;
    const nextCountry = nextValues.country ?? country;
    const nextFunding = nextValues.funding ?? funding;
    const nextPage = nextValues.page ?? "1";

    if (!nextQ.trim()) params.delete("q");
    else params.set("q", nextQ.trim());

    if (nextType === "all") params.delete("type");
    else params.set("type", nextType);

    if (nextCountry === "all") params.delete("country");
    else params.set("country", nextCountry);

    if (nextFunding === "all") params.delete("funding");
    else params.set("funding", nextFunding);

    params.set("page", nextPage);

    router.push(`/programs?${params.toString()}`);
  }

  function buildPageLink(page: number) {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedType !== "all") params.set("type", selectedType);
    if (selectedCountry !== "all") params.set("country", selectedCountry);
    if (selectedFunding !== "all") params.set("funding", selectedFunding);

    params.set("page", String(page));

    return `/programs?${params.toString()}`;
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 40px" }}>
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

        <button
          type="button"
          onClick={() => {
            setQ("");
            setType("all");
            setCountry("all");
            setFunding("all");
            router.push("/programs?page=1");
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
          Reset
        </button>

        <div style={{ color: "#555", fontWeight: 600 }}>
          Showing {filtered.length} on this page • {totalPrograms} total opportunities
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
          <p style={{ margin: 0, color: "#666", lineHeight: 1.6 }}>
            Try a different keyword, choose another country, or remove some filters.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
              marginTop: 24,
            }}
          >
            {filtered.map((p) => {
              const applyLink = p.official_url || "#";
              const isApplyDisabled = !p.official_url;

              return (
                <a
                  key={p.id}
                  href={`/programs/${p.slug}`}
                  style={{
                    display: "block",
                    border: "1px solid #ddd",
                    padding: 20,
                    borderRadius: 12,
                    background: "#fafafa",
                    minWidth: 150,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                >
                  <ProgramImage src={p.image_url} alt={p.title} />

                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "black",
                      marginBottom: 10,
                      lineHeight: 1.4,
                    }}
                  >
                    {p.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginBottom: 4,
                    }}
                  >
                    <DeadlineBadge deadline={p.deadline} />
                    <Badge status={p.verification_status} />
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                    <div>
                      <strong>Country:</strong> {p.country || "—"}
                    </div>
                    <div>
                      <strong>Type:</strong> {p.type || "—"}
                    </div>
                    <div>
                      <strong>Funding:</strong> {p.funding_type || "—"}
                    </div>
                    <div>
                      <strong>Deadline:</strong> {p.deadline || "—"}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "10px 16px",
                        background: "#111",
                        color: "white",
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                    >
                      View Details
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!isApplyDisabled) {
                          window.open(applyLink, "_blank", "noopener,noreferrer");
                        }
                      }}
                      disabled={isApplyDisabled}
                      style={{
                        display: "inline-block",
                        padding: "10px 16px",
                        background: isApplyDisabled ? "#999" : "#0070f3",
                        color: "white",
                        borderRadius: 8,
                        border: "none",
                        cursor: isApplyDisabled ? "not-allowed" : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Apply Now
                    </button>
                  </div>

                  {isApplyDisabled && (
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                      Application link not available yet.
                    </div>
                  )}
                </a>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 32,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ color: "#666", fontSize: 14 }}>
              Showing page {currentPage} of {totalPages} • {totalPrograms} total opportunities
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {currentPage > 1 && (
                <a
                  href={buildPageLink(currentPage - 1)}
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

              {currentPage < totalPages && (
                <a
                  href={buildPageLink(currentPage + 1)}
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