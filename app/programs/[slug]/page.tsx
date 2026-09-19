import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import CopyLinkButton from "./CopyLinkButton";
import StickyApplyBar from "./StickyApplyBar";
import ApplyNowButton from "./ApplyNowButton";
import ProgramImage from "../../components/ProgramImage";
import SafeMarkdown from "../../components/SafeMarkdown";
import TrackedProgramLink from "../../components/TrackedProgramLink";
import { socialLinkItems } from "../../components/socialLinks";
import { supabase } from "../../../lib/supabase";
import {
  ApplicationStep,
  isDeadlinePassed,
  isPublicProgramDetailVisible,
  isPublicProgramListVisible,
  SourceLink,
} from "../../../lib/opportunityPrograms";

const SITE_URL = "https://app.tripdoc.net";

type Program = {
  id: string;
  title: string;
  slug: string | null;
  organisation: string | null;
  country: string | null;
  type: string | null;
  funding_type: string | null;
  deadline: string | null;
  deadline_mode: string | null;
  deadline_time: string | null;
  deadline_timezone: string | null;
  official_url: string | null;
  additional_application_steps: ApplicationStep[] | null;
  image_url: string | null;
  image_alt: string | null;
  description: string | null;
  publishing_status: string | null;
  verification_status: string | null;
  availability_status: string | null;
  featured?: boolean | null;
  funding_amount: number | null;
  funding_currency: string | null;
  funding_coverage: string | null;
  applicant_costs: string | null;
  official_source_links: SourceLink[] | null;
  reviewer_name: string | null;
  verified_at: string | null;
  evidence_notes: string | null;
  sponsorship_status: string | null;
  sponsorship_evidence: string | null;
  sponsorship_source_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

type RelatedProgram = {
  id: string;
  title: string;
  slug: string | null;
  country: string | null;
  funding_type: string | null;
  type: string | null;
  verification_status: string | null;
  publishing_status?: string | null;
  availability_status?: string | null;
  deadline?: string | null;
  deadline_mode?: string | null;
};

const infoCardStyle = {
  background: "#fafafa",
  border: "1px solid #eef0f3",
  borderRadius: 12,
  padding: 16,
} as const;

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

function labelize(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDeadline(program: Pick<Program, "deadline" | "deadline_mode" | "deadline_time" | "deadline_timezone">) {
  if (program.deadline_mode === "rolling") return "Rolling applications";
  if (program.deadline_mode === "unknown" || !program.deadline) return "Not listed";

  const parts = [program.deadline];
  if (program.deadline_time) parts.push(program.deadline_time.slice(0, 5));
  if (program.deadline_timezone) parts.push(program.deadline_timezone);
  return parts.join(" ");
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount === null || amount === undefined) return null;
  return `${currency ? `${currency} ` : ""}${amount.toLocaleString("en-GB")}`;
}

function titleWithBrand(value: string) {
  return /tripdoc/i.test(value) ? value : `${value} | TripDoc`;
}

function getApplicationSteps(value: Program["additional_application_steps"]) {
  return Array.isArray(value) ? value : [];
}

function getSourceLinks(value: Program["official_source_links"]) {
  return Array.isArray(value) ? value : [];
}

async function getProgramBySlug(slug: string) {
  const { data } = await supabase
    .from("program_public_view")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data as Program | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProgramBySlug(slug);

  if (!data || !isPublicProgramDetailVisible(data)) {
    return {
      title: "Opportunity Not Found | TripDoc",
      description: "The requested opportunity could not be found on TripDoc.",
      alternates: { canonical: `${SITE_URL}/programs/${slug}` },
    };
  }

  const title = titleWithBrand(data.seo_title?.trim() || data.title);
  const description =
    data.seo_description?.trim() ||
    data.description?.replace(/[#*_`[\]()]/g, "").trim().slice(0, 160) ||
    `View ${data.title}${data.country ? ` in ${data.country}` : ""} on TripDoc.`;
  const pageUrl = `${SITE_URL}/programs/${data.slug || slug}`;

  return {
    title: { absolute: title },
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
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "TripDoc",
      type: "article",
      images: data.image_url ? [{ url: data.image_url, alt: data.image_alt || data.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.image_url ? [data.image_url] : [],
    },
  };
}

async function getRedirectedSlug(slug: string) {
  const { data } = await supabase
    .from("program_slug_redirects")
    .select("program_id")
    .eq("old_slug", slug)
    .maybeSingle();

  if (!data?.program_id) return null;

  const { data: program } = await supabase
    .from("program_public_view")
    .select("slug,publishing_status")
    .eq("id", data.program_id)
    .maybeSingle();

  if (program?.slug && program.publishing_status !== "draft") return program.slug;
  return null;
}

async function getRelatedPrograms(program: Program) {
  const relatedPrograms: RelatedProgram[] = [];

  async function addFromQuery(field: "country" | "type" | "funding_type", value?: string | null) {
    if (!value || relatedPrograms.length >= 3) return;

    const { data } = await supabase
      .from("program_public_view")
      .select("id,title,slug,country,funding_type,type,verification_status,publishing_status,availability_status,deadline,deadline_mode,deadline_time,deadline_timezone")
      .eq("publishing_status", "published")
      .neq("id", program.id)
      .eq(field, value)
      .limit(3 - relatedPrograms.length);

    for (const item of data || []) {
      if (
        isPublicProgramListVisible(item) &&
        !relatedPrograms.find((existing) => existing.id === item.id)
      ) {
        relatedPrograms.push(item);
      }
    }
  }

  await addFromQuery("country", program.country);
  await addFromQuery("type", program.type);
  await addFromQuery("funding_type", program.funding_type);

  if (relatedPrograms.length < 3) {
    const { data } = await supabase
      .from("program_public_view")
      .select("id,title,slug,country,funding_type,type,verification_status,publishing_status,availability_status,deadline,deadline_mode,deadline_time,deadline_timezone")
      .eq("publishing_status", "published")
      .neq("id", program.id)
      .order("created_at", { ascending: false })
      .limit(3 - relatedPrograms.length);

    for (const item of data || []) {
      if (
        isPublicProgramListVisible(item) &&
        !relatedPrograms.find((existing) => existing.id === item.id)
      ) {
        relatedPrograms.push(item);
      }
    }
  }

  return relatedPrograms;
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);

  if (!program) {
    const redirectedSlug = await getRedirectedSlug(slug);
    if (redirectedSlug) permanentRedirect(`/programs/${redirectedSlug}`);
  }

  if (!program || !isPublicProgramDetailVisible(program)) {
    notFound();
  }

  const relatedPrograms = await getRelatedPrograms(program);
  const programUrl = `${SITE_URL}/programs/${program.slug}`;
  const applicationSteps = getApplicationSteps(program.additional_application_steps);
  const sourceLinks = getSourceLinks(program.official_source_links);
  const requiredSteps = applicationSteps.filter((step) => step.required);
  const hasOfficialUrl = Boolean(program.official_url);
  const deadlinePassed = isDeadlinePassed(
    program.deadline,
    program.deadline_mode || "fixed_date", new Date(), program.deadline_time, program.deadline_timezone
  );
  const inactive = deadlinePassed || program.availability_status === "closed" || program.publishing_status === "archived";
  const isWeltwaertsSouthNorth =
    program.slug === "weltwaerts-south-north-volunteer-germany";
  const officialCtaLabel = inactive ? "View official source (archived or closed)" : isWeltwaertsSouthNorth
    ? "Find your country's official weltwaerts organisation"
    : "Apply Now";

  return (
    <main style={{ fontFamily: "Arial", background: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 40px" }}>
        <Link
          href="/programs"
          style={{
            display: "inline-block",
            marginBottom: 20,
            textDecoration: "none",
            color: "#0070f3",
            fontWeight: 600,
          }}
        >
          Back to programs
        </Link>

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
          {program.organisation && <span>Organisation: {program.organisation}</span>}
          {program.country && (
            <span>
              Country:{" "}
              <Link href={`/countries/${toSlug(program.country)}`} style={{ color: "#0070f3" }}>
                {program.country}
              </Link>
            </span>
          )}
          {program.type && (
            <span>
              Type:{" "}
              <Link href={`/types/${toSlug(program.type)}`} style={{ color: "#0070f3" }}>
                {program.type}
              </Link>
            </span>
          )}
          {program.funding_type && (
            <span>
              Funding:{" "}
              <Link href={`/funding/${toSlug(program.funding_type)}`} style={{ color: "#0070f3" }}>
                {program.funding_type}
              </Link>
            </span>
          )}
          <span>{formatDeadline(program)}</span>
          {deadlinePassed && <span>Deadline passed</span>}
        </div>

        {isWeltwaertsSouthNorth && (
          <div
            style={{
              marginBottom: 24,
              border: "1px solid #f0d38a",
              borderRadius: 14,
              padding: 18,
              background: "#fff8e5",
              color: "#654d08",
              lineHeight: 1.7,
              fontWeight: 650,
            }}
          >
            <strong>Important:</strong> Applicants should not contact weltwaerts
            Germany directly. Applicants must use the official weltwaerts
            organisation finder to identify the correct sending organisation or
            partner route for their home country.
          </div>
        )}

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
            <ProgramImage
              src={program.image_url}
              alt={program.image_alt || program.title}
              width={1200}
              height={675}
              sizes="(max-width: 768px) 100vw, 900px"
              priority
              borderRadius={0}
              marginBottom={0}
              style={{ height: 320 }}
            />
          </div>
        )}

        <section
          style={{
            marginBottom: 32,
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 24,
            background: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 22 }}>
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
                Availability
              </div>
              <div style={{ fontWeight: 700 }}>
                {deadlinePassed
                  ? "Closed - deadline passed"
                  : labelize(program.availability_status)}
              </div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Deadline
              </div>
              <div style={{ fontWeight: 700 }}>{formatDeadline(program)}</div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Verification
              </div>
              <div style={{ fontWeight: 700 }}>
                {labelize(program.verification_status)}
              </div>
            </div>

            <div style={infoCardStyle}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                Primary application link
              </div>
              <div style={{ fontWeight: 700 }}>
                {hasOfficialUrl ? "Available" : "Not listed"}
              </div>
            </div>
          </div>
        </section>

        {inactive && <p role="status" style={{ padding: 16, background: "#fff4e5", borderRadius: 10 }}>This listing is archived or closed. It is retained for reference; check the official source for any future call.</p>}
        <div style={{ marginBottom: 20 }}>
          {program.verification_status === "verified" ? (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#e8f7ee",
                color: "#0a7a33",
                fontWeight: 700,
              }}
            >
              Verified Opportunity
            </span>
          ) : program.verification_status === "conflicting_evidence" ? (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#fff1f2",
                color: "#be123c",
                fontWeight: 700,
              }}
            >
              Conflicting evidence
            </span>
          ) : (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#fff4e5",
                color: "#a05a00",
                fontWeight: 700,
              }}
            >
              Needs review
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
            label={officialCtaLabel}
          />

          {isWeltwaertsSouthNorth && (
            <Link
              href="/volunteer-match"
              style={{
                padding: "14px 18px",
                background: "white",
                color: "#0070f3",
                border: "1px solid #cfe3ff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Not sure which volunteer route fits your profile? Try TripDoc
              Volunteer Match.
            </Link>
          )}

          <CopyLinkButton programId={program.id} title={program.title} />

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
              fontWeight: 700,
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
              fontWeight: 700,
            }}
          >
            LinkedIn
          </a>
        </div>

        {applicationSteps.length > 0 && (
          <section
            style={{
              marginBottom: 32,
              border:
                requiredSteps.length > 0 ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 22,
              background: requiredSteps.length > 0 ? "#f8fbff" : "#fff",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: 22 }}>
              {inactive ? "Application steps from this call (for reference)" : "Application Steps"}
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {applicationSteps.map((step, index) => (
                <div
                  key={step.id || index}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #dbe7ff",
                    background: "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <strong>{step.label}</strong>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: step.required ? "#dbeafe" : "#f3f4f6",
                        color: step.required ? "#1d4ed8" : "#4b5563",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {step.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  {step.instructions && (
                    <p style={{ margin: "0 0 10px", color: "#374151", lineHeight: 1.7 }}>
                      {step.instructions}
                    </p>
                  )}
                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0070f3", fontWeight: 800 }}
                    >
                      Open step link
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          style={{
            marginBottom: 32,
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 22,
            background: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: 22 }}>
            Funding and Verification Details
          </h2>
          <div style={{ display: "grid", gap: 12, color: "#333", lineHeight: 1.7 }}>
            {formatMoney(program.funding_amount, program.funding_currency) && (
              <div>
                <strong>Confirmed amount:</strong>{" "}
                {formatMoney(program.funding_amount, program.funding_currency)}
              </div>
            )}
            {program.funding_coverage && (
              <div>
                <strong>Coverage:</strong> {program.funding_coverage}
              </div>
            )}
            {program.applicant_costs && (
              <div>
                <strong>Applicant costs:</strong> {program.applicant_costs}
              </div>
            )}
            {program.type?.toLowerCase() === "job" && (
              <div>
                <strong>Sponsorship:</strong> {labelize(program.sponsorship_status)}
                {program.sponsorship_source_url && (
                  <>
                    {" "}
                    <a
                      href={program.sponsorship_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0070f3", fontWeight: 700 }}
                    >
                      Source
                    </a>
                  </>
                )}
              </div>
            )}
            {program.evidence_notes && (
              <div>
                <strong>Evidence note:</strong> {program.evidence_notes}
              </div>
            )}
            {program.verified_at && (
              <div>
                <strong>Verified on:</strong> {formatDate(program.verified_at)}
              </div>
            )}
            {sourceLinks.length > 0 && (
              <div>
                <strong>Official sources:</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 22 }}>
                  {sourceLinks.map((source) => (
                    <li key={source.id}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0070f3", fontWeight: 700 }}
                      >
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            marginBottom: 32,
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 22,
            background: "#fcfcfc",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: 22 }}>
            Apply Safely
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              "Always apply through the official website or required application steps provided above.",
              "Never pay unofficial agents or third parties claiming guaranteed selection.",
              "Always confirm the deadline, eligibility and fees on the official source before applying.",
              "TripDoc helps you discover opportunities, but final application details should always be verified on the source website.",
            ].map((text) => (
              <div
                key={text}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #eef2f7",
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            marginBottom: 32,
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 22,
            background: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 22 }}>
            Follow TripDoc for verified opportunities
          </h2>
          <p
            style={{
              margin: "0 0 14px",
              color: "#555",
              lineHeight: 1.7,
              fontSize: 15,
            }}
          >
            Follow TripDoc for verified opportunities, application safety
            reminders, and practical updates.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {socialLinkItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                style={{
                  border: "1px solid #dbe7ff",
                  borderRadius: 10,
                  color: "#0070f3",
                  background: "#f8fbff",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "10px 12px",
                  textDecoration: "none",
                }}
              >
                {item.name}
              </a>
            ))}
          </div>
        </section>

        <section
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
          {program.description?.trim() ? (
            <SafeMarkdown content={program.description} />
          ) : (
            <p style={{ margin: 0, lineHeight: 1.8, color: "#555" }}>
              Full description has not been added yet. You can still use the
              official link above to check the complete opportunity details.
            </p>
          )}
        </section>

        {relatedPrograms.length > 0 && (
          <section
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
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ color: "#555", fontSize: 14 }}>
                      {item.country || "-"} - {item.funding_type || "-"}
                    </div>
                  </TrackedProgramLink>
                ) : null
              )}
            </div>
          </section>
        )}
      </div>

      <StickyApplyBar
        title={program.title}
        url={program.official_url}
        label={
          inactive ? "View official source" : isWeltwaertsSouthNorth ? "Find official organisation" : "Apply Now"
        }
      />
    </main>
  );
}
