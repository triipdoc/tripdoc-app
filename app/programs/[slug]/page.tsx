import CopyLinkButton from "./CopyLinkButton";
import { supabase } from "../../../lib/supabase";
import type { Metadata } from "next";
import StickyApplyBar from "./StickyApplyBar";
import ApplyNowButton from "./ApplyNowButton";
import TrackedProgramLink from "../../components/TrackedProgramLink";

const SITE_URL = "https://app.tripdoc.net";

function toCountrySlug(country: string) {
  return country.toLowerCase().trim().replace(/\s+/g, "-");
}

function toTypeSlug(type: string) {
  return type.toLowerCase().trim().replace(/\s+/g, "-");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const { data } = await supabase
    .from("programs")
    .select("title, country, funding_type, type, image_url, description")
    .eq("slug", slug)
    .single();

  if (!data) {
    return {
      title: "Opportunity Not Found | TripDoc",
      description: "The requested opportunity could not be found on TripDoc.",
      alternates: {
        canonical: `${SITE_URL}/programs/${slug}`,
      },
    };
  }

  const title = `${data.title} | TripDoc`;

  const description =
    data.description?.trim().slice(0, 160) ||
    `Apply for ${data.title}${data.country ? ` in ${data.country}` : ""}${
      data.funding_type ? `. Funding: ${data.funding_type}` : ""
    }${data.type ? `. Type: ${data.type}` : ""}. Find deadline, official link, and full details on TripDoc.`;

  const pageUrl = `${SITE_URL}/programs/${slug}`;

  return {
    title,
    description,
    keywords: [
      data.title,
      data.country || "",
      data.type || "",
      data.funding_type || "",
      "scholarship",
      "internship",
      "fellowship",
      "opportunities",
      "TripDoc",
    ].filter(Boolean),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "TripDoc",
      type: "article",
      images: data.image_url ? [{ url: data.image_url, alt: data.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.image_url ? [data.image_url] : [],
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
  type: string | null;
  verification_status: string | null;
};

const infoCardStyle = {
  background: "#fafafa",
  border: "1px solid #eef0f3",
  borderRadius: 12,
  padding: 16,
} as const;

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    const isBold = /^\*\*.*\*\*$/.test(part);

    if (isBold) {
      const cleanText = part.replace(/^\*\*/, "").replace(/\*\*$/, "");
      return <strong key={index}>{cleanText}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

function renderDescription(content: string) {
  const lines = content.split("\n");

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={index} style={{ height: 12 }} />;
    }

    const isBullet = trimmed.startsWith("- ");
    const isNumbered = /^\d+\.\s/.test(trimmed);
    const isHeading =
      trimmed.endsWith(":") &&
      trimmed.length < 80 &&
      !isBullet &&
      !isNumbered;

    if (isHeading) {
      return (
        <h3
          key={index}
          style={{
            margin: "20px 0 10px",
            fontSize: 20,
            fontWeight: 800,
            color: "#111",
          }}
        >
          {renderInlineFormatting(trimmed)}
        </h3>
      );
    }

    if (isBullet) {
      return (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 10,
            color: "#333",
            lineHeight: 1.8,
          }}
        >
          <span style={{ fontWeight: 700 }}>•</span>
          <span>{renderInlineFormatting(trimmed.slice(2))}</span>
        </div>
      );
    }

    if (isNumbered) {
      const match = trimmed.match(/^(\d+\.)\s(.*)$/);

      return (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 10,
            color: "#333",
            lineHeight: 1.8,
          }}
        >
          <span style={{ fontWeight: 700, minWidth: 26 }}>
            {match?.[1] || ""}
          </span>
          <span>{renderInlineFormatting(match?.[2] || trimmed)}</span>
        </div>
      );
    }

    return (
      <p
        key={index}
        style={{
          margin: "0 0 12px",
          lineHeight: 1.8,
          color: "#333",
        }}
      >
        {renderInlineFormatting(trimmed)}
      </p>
    );
  });
}

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
      <main
        style={{
          padding: 40,
          fontFamily: "Arial",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <a
          href="/programs"
          style={{
            display: "inline-block",
            marginBottom: 20,
            textDecoration: "none",
            color: "#0070f3",
            fontWeight: 600,
          }}
        >
          ← Back to programs
        </a>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 24,
            background: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: 10 }}>Program not found</h1>
          <p style={{ margin: 0, color: "#555", lineHeight: 1.7 }}>
            The opportunity you are looking for may have been removed, renamed,
            or the link may be incorrect.
          </p>
        </div>
      </main>
    );
  }

  const program = data as Program;

  let relatedPrograms: RelatedProgram[] = [];

  if (program.country) {
    const { data } = await supabase
      .from("programs")
      .select("id,title,slug,country,funding_type,type,verification_status")
      .eq("verification_status", "verified")
      .neq("id", program.id)
      .eq("country", program.country)
      .limit(3);

    relatedPrograms = data || [];
  }

  if (relatedPrograms.length < 3 && program.type) {
    const { data } = await supabase
      .from("programs")
      .select("id,title,slug,country,funding_type,type,verification_status")
      .eq("verification_status", "verified")
      .neq("id", program.id)
      .eq("type", program.type)
      .limit(3 - relatedPrograms.length);

    relatedPrograms = [
      ...relatedPrograms,
      ...(data || []).filter(
        (item) => !relatedPrograms.find((p) => p.id === item.id)
      ),
    ];
  }

  if (relatedPrograms.length < 3 && program.funding_type) {
    const { data } = await supabase
      .from("programs")
      .select("id,title,slug,country,funding_type,type,verification_status")
      .eq("verification_status", "verified")
      .neq("id", program.id)
      .eq("funding_type", program.funding_type)
      .limit(3 - relatedPrograms.length);

    relatedPrograms = [
      ...relatedPrograms,
      ...(data || []).filter(
        (item) => !relatedPrograms.find((p) => p.id === item.id)
      ),
    ];
  }

  if (relatedPrograms.length < 3) {
    const { data } = await supabase
      .from("programs")
      .select("id,title,slug,country,funding_type,type,verification_status")
      .eq("verification_status", "verified")
      .neq("id", program.id)
      .order("created_at", { ascending: false })
      .limit(3 - relatedPrograms.length);

    relatedPrograms = [
      ...relatedPrograms,
      ...(data || []).filter(
        (item) => !relatedPrograms.find((p) => p.id === item.id)
      ),
    ];
  }

  const programUrl = `${SITE_URL}/programs/${program.slug}`;
  const hasOfficialUrl = Boolean(program.official_url);

  return (
    <main style={{ fontFamily: "Arial", background: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 40px" }}>
        <a
          href="/programs"
          style={{
            display: "inline-block",
            marginBottom: 20,
            textDecoration: "none",
            color: "#0070f3",
            fontWeight: 600,
          }}
        >
          ← Back to programs
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
          {program.country && (
            <span>
              🌍{" "}
              <a
                href={`/countries/${toCountrySlug(program.country)}`}
                style={{
                  color: "#0070f3",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {program.country}
              </a>
            </span>
          )}
          {program.type && (
            <span>
              📚{" "}
              <a
                href={`/types/${toTypeSlug(program.type)}`}
                style={{
                  color: "#0070f3",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {program.type}
              </a>
            </span>
          )}
          {program.funding_type && (
  <span>
    💰{" "}
    <a
      href={`/funding/${toCountrySlug(program.funding_type)}`}
      style={{
        color: "#0070f3",
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      {program.funding_type}
    </a>
  </span>
)}
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
              <div style={{ fontWeight: 600 }}>
                {program.country ? (
                  <>
                    🌍{" "}
                    <a
                      href={`/countries/${toCountrySlug(program.country)}`}
                      style={{
                        color: "#0070f3",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      {program.country}
                    </a>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Type
              </div>
              <div style={{ fontWeight: 600 }}>
                {program.type ? (
                  <>
                    📚{" "}
                    <a
                      href={`/types/${toTypeSlug(program.type)}`}
                      style={{
                        color: "#0070f3",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      {program.type}
                    </a>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Funding
              </div>
             <div style={{ fontWeight: 600 }}>
  {program.funding_type ? (
    <>
      💰{" "}
      <a
        href={`/funding/${toCountrySlug(program.funding_type)}`}
        style={{
          color: "#0070f3",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {program.funding_type}
      </a>
    </>
  ) : (
    "—"
  )}
</div>
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
                {hasOfficialUrl ? "🔗 Available" : "— Not added yet"}
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
            programId={program.id}
            title={program.title}
            officialUrl={program.official_url}
          />

          <CopyLinkButton
            programId={program.id}
            title={program.title}
          />

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `${program.title} - ${programUrl}`
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
              programUrl
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

        <div
          style={{
            marginBottom: 32,
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 22,
            background: "#fcfcfc",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 14,
              fontSize: 22,
            }}
          >
            Apply Safely
          </h2>

          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #eef2f7",
              }}
            >
              ✅ Always apply through the official website link provided above.
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #eef2f7",
              }}
            >
              ⚠️ Never pay unofficial agents or third parties claiming guaranteed selection.
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #eef2f7",
              }}
            >
              📅 Always confirm the deadline and eligibility on the official source before applying.
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #eef2f7",
              }}
            >
              🔍 TripDoc helps you discover opportunities, but final application details should always be verified on the source website.
            </div>
          </div>
        </div>

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

          <div
            style={{
              color: "#333",
              fontSize: 16,
            }}
          >
            {program.description?.trim() ? (
              renderDescription(program.description)
            ) : (
              <p
                style={{
                  margin: 0,
                  lineHeight: 1.8,
                  color: "#555",
                }}
              >
                Full description has not been added yet. You can still use the
                official link above to check the complete opportunity details.
              </p>
            )}
          </div>
        </div>

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
              {relatedPrograms.map((item) =>
                item.slug ? (
                  <TrackedProgramLink
                    key={item.id}
                    href={`/programs/${item.slug}`}
                    programId={item.id}
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
                  </TrackedProgramLink>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>

      <StickyApplyBar title={program.title} url={program.official_url} />
    </main>
  );
}