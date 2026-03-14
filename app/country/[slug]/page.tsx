import { supabase } from "../../../lib/supabase";
import type { Metadata } from "next";

type Program = {
  id: string;
  title: string;
  slug: string | null;
  country: string | null;
  funding_type: string | null;
  image_url: string | null;
  verification_status: string | null;
};

function formatCountryLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const countryName = decodeURIComponent(slug);
  const label = formatCountryLabel(countryName);

  return {
    title: `Opportunities in ${label}`,
    description: `Explore verified scholarships, internships, fellowships, and research opportunities available in ${label} on TripDoc.`,
    openGraph: {
      title: `Opportunities in ${label} | TripDoc`,
      description: `Explore verified opportunities available in ${label} on TripDoc.`,
      url: `https://app.tripdoc.net/country/${encodeURIComponent(countryName)}`,
      siteName: "TripDoc",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Opportunities in ${label} | TripDoc`,
      description: `Explore verified opportunities available in ${label} on TripDoc.`,
    },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const countryName = decodeURIComponent(slug);

  const { data, error } = await supabase
    .from("programs")
    .select("id,title,slug,country,funding_type,image_url,verification_status")
    .ilike("country", countryName)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 40 }}>
        <a
          href="/"
          style={{
            display: "inline-block",
            marginBottom: 20,
            textDecoration: "none",
            color: "#0070f3",
            fontWeight: 600,
          }}
        >
          ← Back to home
        </a>

        <h1 style={{ marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: "#666" }}>Unable to load this country page right now.</p>
      </main>
    );
  }

  const programs = (data || []).filter(
    (p: Program) => p.title && p.slug && p.title.trim() !== ""
  ) as Program[];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 40 }}>
      <a
        href="/"
        style={{
          display: "inline-block",
          marginBottom: 20,
          textDecoration: "none",
          color: "#0070f3",
          fontWeight: 600,
        }}
      >
        ← Back to home
      </a>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 10 }}>
          Opportunities in {formatCountryLabel(countryName)}
        </h1>

        <p style={{ color: "#666", margin: 0 }}>
          Explore verified opportunities available in {formatCountryLabel(countryName)}.
        </p>
      </div>

      {programs.length === 0 ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 24,
            background: "#fafafa",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>No opportunities yet</h2>
          <p style={{ margin: 0, color: "#666" }}>
            No opportunities were found for this country for now.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {programs.map((p) => (
            <a
              key={p.id}
              href={`/programs/${p.slug}`}
              style={{
                display: "block",
                border: "1px solid #ddd",
                padding: 20,
                borderRadius: 12,
                background: "#fafafa",
                textDecoration: "none",
                color: "inherit",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
              }}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.title}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginBottom: 12,
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 160,
                    borderRadius: 10,
                    marginBottom: 12,
                    background: "#f1f1f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#777",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid #e5e5e5",
                  }}
                >
                  No image available
                </div>
              )}

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

              <div style={{ marginBottom: 10, color: "#444" }}>
                {p.country || "—"} • {p.funding_type || "—"}
              </div>

              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid #ddd",
                    background:
                      p.verification_status === "verified"
                        ? "#eaffea"
                        : "#fff6dd",
                  }}
                >
                  {p.verification_status === "verified"
                    ? "✅ Verified"
                    : "⏳ Pending"}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}