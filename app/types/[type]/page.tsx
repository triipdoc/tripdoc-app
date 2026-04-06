import { supabase } from "../../../lib/supabase";
import type { Metadata } from "next";

type Program = {
  id: string;
  title: string;
  slug: string | null;
  country: string | null;
  type: string | null;
  funding_type: string | null;
  deadline: string | null;
  image_url: string | null;
  verification_status: string | null;
  created_at?: string | null;
};

const SITE_URL = "https://app.tripdoc.net";

function formatTypeName(value: string) {
  return decodeURIComponent(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const formattedType = formatTypeName(type);

  const title = `${formattedType} Opportunities | TripDoc`;
  const description = `Browse verified ${formattedType.toLowerCase()} opportunities on TripDoc, including scholarships, internships, fellowships, jobs, and more.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/types/${type}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/types/${type}`,
      siteName: "TripDoc",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function TypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const formattedType = formatTypeName(type);

  const { data, error } = await supabase
    .from("programs")
    .select(
      "id,title,slug,country,type,funding_type,deadline,image_url,verification_status,created_at"
    )
    .eq("verification_status", "verified")
    .ilike("type", formattedType)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Type page error:", error.message);
  }

  const programs = (data || []) as Program[];

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 40px" }}>
      <a
        href="/programs"
        style={{
          display: "inline-block",
          marginBottom: 18,
          textDecoration: "none",
          color: "#0070f3",
          fontWeight: 600,
        }}
      >
        ← Back to programs
      </a>

      <h1
        style={{
          margin: 0,
          fontSize: 34,
          fontWeight: 800,
          lineHeight: 1.2,
        }}
      >
        {formattedType} Opportunities
      </h1>

      <p style={{ marginTop: 10, color: "#666", lineHeight: 1.7 }}>
        Explore verified {formattedType.toLowerCase()} opportunities on TripDoc.
      </p>

      <div
        style={{
          marginTop: 8,
          marginBottom: 24,
          color: "#333",
          fontWeight: 600,
        }}
      >
        {programs.length} opportunit{programs.length === 1 ? "y" : "ies"} found
      </div>

      {programs.length === 0 ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            background: "#fafafa",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 10 }}>No opportunities found</h2>
          <p style={{ margin: 0, color: "#666", lineHeight: 1.7 }}>
            There are no verified {formattedType.toLowerCase()} opportunities yet.
            Check back later or browse all available opportunities on TripDoc.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          {programs.map((program) => (
            <a
              key={program.id}
              href={program.slug ? `/programs/${program.slug}` : "#"}
              style={{
                display: "block",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 18,
                textDecoration: "none",
                color: "#111",
                background: "#fff",
                boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
              }}
            >
              {program.image_url ? (
                <img
                  src={program.image_url}
                  alt={program.title}
                  style={{
                    width: "100%",
                    height: 170,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 14,
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 170,
                    borderRadius: 12,
                    marginBottom: 14,
                    background: "#f1f1f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#777",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  No image available
                </div>
              )}

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  marginBottom: 10,
                }}
              >
                {program.title}
              </div>

              <div style={{ display: "grid", gap: 8, color: "#333", fontSize: 15 }}>
                <div>
                  <strong>Country:</strong> {program.country || "—"}
                </div>
                <div>
                  <strong>Type:</strong> {program.type || "—"}
                </div>
                <div>
                  <strong>Funding:</strong> {program.funding_type || "—"}
                </div>
                <div>
                  <strong>Deadline:</strong> {program.deadline || "—"}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}