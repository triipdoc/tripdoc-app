"use client";

import { useMemo, useState } from "react";

type Program = {
  id: string;
  title: string;
  type: string | null;
  country: string | null;
  funding_type: string | null;
  deadline: string | null;
  official_url: string | null;
  image_url: string | null;
  verification_status: string | null;
  
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
  if (!deadline) return { label: "No deadline", tag: "gray" as const, daysLeft: null as number | null };

  const today = new Date();
  const d = new Date(deadline + "T00:00:00");
  const diffMs = d.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { label: "Expired", tag: "red" as const, daysLeft };
  if (daysLeft <= 14) return { label: `Closing in ${daysLeft} days`, tag: "orange" as const, daysLeft };
  return { label: "Open", tag: "green" as const, daysLeft };
}

function DeadlineBadge({ deadline }: { deadline?: string | null }) {
  const s = getDeadlineStatus(deadline);

  const bg =
    s.tag === "red" ? "#ffe5e5" :
    s.tag === "orange" ? "#fff1db" :
    s.tag === "green" ? "#eaffea" : "#f2f2f2";

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

export default function ProgramsClient({ programs }: { programs: Program[] }) {
  const [q, setQ] = useState("");
const [type, setType] = useState("all");
const [country, setCountry] = useState("all");
const [funding, setFunding] = useState("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const sorted = [...programs].sort((a, b) => {
  const aStatus = getDeadlineStatus(a.deadline).daysLeft ?? 999999;
  const bStatus = getDeadlineStatus(b.deadline).daysLeft ?? 999999;
  return aStatus - bStatus; // soonest first
});

return sorted.filter((p) => {
      const matchesQuery =
        !query ||
        (p.title || "").toLowerCase().includes(query) ||
        (p.country || "").toLowerCase().includes(query) ||
        (p.funding_type || "").toLowerCase().includes(query);

      const matchesType =
        type === "all" || (p.type || "").toLowerCase() === type;

        const matchesCountry =
  country === "all" || (p.country || "") === country;

      const matchesFunding =
  funding === "all" || (p.funding_type || "") === funding;

return matchesQuery && matchesType && matchesCountry && matchesFunding;
    });
  }, [programs, q, type]);

  const types = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (p.type) set.add(p.type.toLowerCase());
    });
    return ["all", ...Array.from(set)];
  }, [programs]);

  const countries = useMemo(() => {
  const set = new Set<string>();
  programs.forEach((p) => {
    if (p.country) set.add(p.country);
  });
  return ["all", ...Array.from(set)];
}, [programs]);

const fundings = useMemo(() => {
  const set = new Set<string>();
  programs.forEach((p) => {
    if (p.funding_type) set.add(p.funding_type);
  });
  return ["all", ...Array.from(set)];
}, [programs]);

  return (
    <>
     

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
  value={q}
  onChange={(e) => setQ(e.target.value)}
  placeholder="Search title, country, funding..."
  style={{
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    minWidth: 260,
    outline: "none"
  }}
/>

  <select
    value={type}
    onChange={(e) => setType(e.target.value)}
  >
    {types.map((t) => (
      <option key={t} value={t}>
        {t === "all" ? "All types" : t}
      </option>
    ))}
  </select>

  {/* ADD THIS COUNTRY FILTER HERE */}
  <select
    value={country}
    onChange={(e) => setCountry(e.target.value)}
  >
    {countries.map((c) => (
      <option key={c} value={c}>
        {c === "all" ? "All countries" : c}
      </option>
    ))}
  </select>

  <div>
    Showing {filtered.length} of {programs.length}
  </div>

</div>

<select
  value={funding}
  onChange={(e) => setFunding(e.target.value)}
  style={{
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    minWidth: 150
  }}
>
  {fundings.map((f) => (
    <option key={f} value={f}>
      {f === "all" ? "All funding" : f}
    </option>
  ))}
</select>

      <div style={{ display: "grid", gap: 20, marginTop: 24 }}>
        {filtered.map((p) => {
          const applyLink = p.official_url || "#";
          const isApplyDisabled = !p.official_url;

          return (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                padding: 20,
                borderRadius: 12,
                background: "#fafafa",
                minWidth: 150
              }}
            >
              {p.image_url && (
  <img
    src={p.image_url}
    alt={p.title}
    style={{
      width: "100%",
      height: 180,
      objectFit: "cover",
      borderRadius: 10,
      marginBottom: 12,
    }}
  />
)}
            <a
  href={`/programs/${p.slug}`}
  style={{
    fontSize: 20,
    fontWeight: 600,
    textDecoration: "none",
    color: "black",
    display: "block",
    marginBottom: 10
  }}
>
  {p.title}
</a>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
  <DeadlineBadge deadline={p.deadline} />
  <Badge status={p.verification_status} />
</div>

              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                <div><strong>Country:</strong> {p.country || "—"}</div>
                <div><strong>Type:</strong> {p.type || "—"}</div>
                <div><strong>Funding:</strong> {p.funding_type || "—"}</div>
                <div><strong>Deadline:</strong> {p.deadline || "—"}</div>
              </div>

              <a
                href={applyLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  padding: "10px 16px",
                  background: isApplyDisabled ? "#999" : "#0070f3",
                  color: "white",
                  borderRadius: 8,
                  textDecoration: "none",
                  pointerEvents: isApplyDisabled ? "none" : "auto",
                }}
              >
                Apply Now
              </a>

              {isApplyDisabled && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  No official link added yet.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}