import CopyLinkButton from "./CopyLinkButton";
import { supabase } from "../../../lib/supabase";
import type { Metadata } from "next";
import StickyApplyBar from "./StickyApplyBar";
import ApplyNowButton from "./ApplyNowButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const { data } = await supabase
    .from("programs")
    .select("title, country, funding_type, type, image_url")
    .eq("slug", slug)
    .single();

  if (!data) {
    return {
      title: "Opportunity Not Found | TripDoc",
      description: "The requested opportunity could not be found on TripDoc.",
    };
  }

  const title = `${data.title} | TripDoc`;

  const description = `Apply for ${data.title}${
    data.country ? ` in ${data.country}` : ""
  }${data.funding_type ? `. Funding: ${data.funding_type}` : ""}${
    data.type ? `. Type: ${data.type}` : ""
  }. Find deadline, official link, and full details on TripDoc.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://app.tripdoc.net/programs/${slug}`,
      siteName: "TripDoc",
      type: "article",
      images: data.image_url ? [{ url: data.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

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
  description: string | null;
  verification_status: string | null;
};

type RelatedProgram = {
  id: string;
  title: string;
  slug: string | null;
  country: string | null;
  funding_type: string | null;
};

const infoCardStyle = {
  background: "#fafafa",
  border: "1px solid #eef0f3",
  borderRadius: 12,
  padding: 16,
} as const;

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial" }}>
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

        <h1>Program not found</h1>
      </main>
    );
  }

  const program = data as Program;

  const { data: relatedData } = await supabase
    .from("programs")
    .select("id,title,slug,country,funding_type")
    .neq("id", program.id)
    .or(
      `type.eq.${program.type || ""},country.eq.${program.country || ""},funding_type.eq.${program.funding_type || ""}`
    )
    .limit(3);

  const relatedPrograms = (relatedData || []) as RelatedProgram[];

  return (
    <main style={{ fontFamily: "Arial", background: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 40px" }}>
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

        <h1
          style={{
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 12,
            letterSpacing: "-0.4px",
          }}
        >
          {program.title}
        </h1>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 20,
            color: "#555",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {program.country && <span>🌍 {program.country}</span>}
          {program.type && <span>📚 {program.type}</span>}
          {program.funding_type && <span>💰 {program.funding_type}</span>}
          {program.deadline && <span>📅 Deadline: {program.deadline}</span>}
        </div>

        {program.image_url && (
          <div
            style={{
              width: "100%",
              margin: "20px 0 30px",
              borderRadius: 18,
              overflow: "hidden",
              background: "#f7f7f7",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <img
              src={program.image_url}
              alt={program.title}
              style={{
                width: "100%",
                height: 320,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}

        <div
          style={{
            marginBottom: 32,
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 24,
            background: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 22,
            }}
          >
            Quick Overview
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Country
              </div>
              <div style={{ fontWeight: 600 }}>🌍 {program.country || "—"}</div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Type
              </div>
              <div style={{ fontWeight: 600 }}>📚 {program.type || "—"}</div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Funding
              </div>
              <div style={{ fontWeight: 600 }}>💰 {program.funding_type || "—"}</div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Deadline
              </div>
              <div style={{ fontWeight: 600 }}>📅 {program.deadline || "—"}</div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Verification
              </div>
              <div style={{ fontWeight: 600 }}>
                {program.verification_status === "verified"
                  ? "✅ Verified"
                  : "⏳ Pending"}
              </div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Official Link
              </div>
              <div style={{ fontWeight: 600 }}>
                {program.official_url ? "🔗 Available" : "— Not added yet"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          {program.verification_status === "verified" ? (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#e8f7ee",
                color: "#0a7a33",
                fontWeight: 600,
              }}
            >
              ✅ Verified Opportunity
            </span>
          ) : (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#fff4e5",
                color: "#a05a00",
                fontWeight: 600,
              }}
            >
              ⏳ Verification Pending
            </span>
          )}
        </div>

        <div
          style={{
            marginBottom: 30,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <ApplyNowButton
  title={program.title}
  officialUrl={program.official_url}
/>

          <CopyLinkButton />

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `${program.title} - https://app.tripdoc.net/programs/${program.slug}`
            )}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "14px 18px",
              background: "#25D366",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            WhatsApp
          </a>

          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              `https://app.tripdoc.net/programs/${program.slug}`
            )}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "14px 18px",
              background: "#0A66C2",
              color: "white",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            LinkedIn
          </a>
        </div>

        {program.description && (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 26,
              background: "#fff",
              marginBottom: 32,
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>Program Description</h2>

            <p
              style={{
                lineHeight: 1.7,
                whiteSpace: "pre-line",
                color: "#333",
                margin: 0,
              }}
            >
              {program.description}
            </p>
          </div>
        )}

        {relatedPrograms.length > 0 && (
          <div
            style={{
              marginTop: 0,
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 24,
              background: "#fff",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>Related Opportunities</h2>

            <div style={{ display: "grid", gap: 16 }}>
              {relatedPrograms.map((item) => (
                <a
                  key={item.id}
                  href={`/programs/${item.slug}`}
                  style={{
                    display: "block",
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 16,
                    textDecoration: "none",
                    color: "black",
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ color: "#555", fontSize: 14 }}>
                    {item.country || "—"} • {item.funding_type || "—"}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <StickyApplyBar title={program.title} url={program.official_url} />
    </main>
  );
}