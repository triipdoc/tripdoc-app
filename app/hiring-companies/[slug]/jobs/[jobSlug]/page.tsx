import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cleanText,
  formatDisplayDate,
  formatSalary,
  getSponsorshipLabel,
  getTodayDateString,
  PUBLIC_SPONSORSHIP_STATUSES,
  type HiringCompanyJob,
  type SponsorshipStatus,
} from "../../../../../lib/hiringCompanyJobs";
import { supabase } from "../../../../../lib/supabase";

const SITE_URL = "https://app.tripdoc.net";

type HiringCompany = {
  id: string;
  company_name: string;
  slug: string;
  country: string | null;
  industry: string | null;
  careers_url: string | null;
  verification_status: string | null;
};

export const dynamic = "force-dynamic";

function isUrl(value?: string | null) {
  const text = cleanText(value);
  if (!text) return false;

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getLocation(job: HiringCompanyJob) {
  return (
    cleanText(job.location) ||
    [cleanText(job.city), cleanText(job.country)].filter(Boolean).join(", ")
  );
}

function getSeoTitleFragment(status?: SponsorshipStatus | null) {
  if (status === "explicit") return "Visa Sponsorship Information";
  if (status === "work_permit_support") return "Work Permit Support Information";
  if (status === "conditional") return "Conditional Sponsorship Information";
  return "Hiring Information";
}

async function getVerifiedCompany(slug: string) {
  const { data, error } = await supabase
    .from("hiring_companies")
    .select("id, company_name, slug, country, industry, careers_url, verification_status")
    .eq("slug", slug)
    .eq("verification_status", "verified")
    .maybeSingle();

  if (error) {
    console.error("Hiring job company fetch error:", error.message);
    return null;
  }

  return (data as HiringCompany | null) || null;
}

async function getVerifiedJob(companyId: string, slug: string) {
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("hiring_company_jobs")
    .select("*")
    .eq("company_id", companyId)
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .in("visa_sponsorship_status", PUBLIC_SPONSORSHIP_STATUSES)
    .not("last_verified", "is", null)
    .or(`deadline.is.null,deadline.gte.${today}`)
    .maybeSingle();

  if (error) {
    console.error("Hiring job detail fetch error:", error.message);
    return null;
  }

  return (data as HiringCompanyJob | null) || null;
}

async function getPageData(companySlug: string, jobSlug: string) {
  const company = await getVerifiedCompany(companySlug);
  if (!company) return null;

  const job = await getVerifiedJob(company.id, jobSlug);
  if (!job) return null;

  return { company, job };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; jobSlug: string }>;
}): Promise<Metadata> {
  const { slug, jobSlug } = await params;
  const pageUrl = `${SITE_URL}/hiring-companies/${encodeURIComponent(
    slug
  )}/jobs/${encodeURIComponent(jobSlug)}`;
  const pageData = await getPageData(slug, jobSlug);

  if (!pageData) {
    return {
      title: "Hiring Job Not Found | TripDoc",
      description: "The requested hiring job could not be found on TripDoc.",
      alternates: { canonical: pageUrl },
    };
  }

  const { company, job } = pageData;
  const title = `${job.title} at ${company.company_name} - ${getSeoTitleFragment(
    job.visa_sponsorship_status
  )} | TripDoc`;
  const description = `View verified hiring information for ${job.title} at ${company.company_name}, including location, eligibility, official application link, and sponsorship evidence.`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "TripDoc",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function HiringCompanyJobPage({
  params,
}: {
  params: Promise<{ slug: string; jobSlug: string }>;
}) {
  const { slug, jobSlug } = await params;
  const pageData = await getPageData(slug, jobSlug);

  if (!pageData) {
    notFound();
  }

  const { company, job } = pageData;
  const location = getLocation(job);
  const salary = formatSalary(job);
  const deadline = formatDisplayDate(job.deadline);
  const postedDate = formatDisplayDate(job.posted_date);
  const lastVerified = formatDisplayDate(job.last_verified);
  const applicationUrl = cleanText(job.application_url) || cleanText(job.official_job_url);
  const sponsorshipLabel = getSponsorshipLabel(job.visa_sponsorship_status);
  const companyUrl = `/hiring-companies/${encodeURIComponent(company.slug)}`;

  return (
    <main style={styles.pageShell}>
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <Link href={companyUrl} style={styles.backLink}>
            &larr; Back to {company.company_name}
          </Link>

          <p style={styles.eyebrow}>Verified open job</p>
          <h1 style={styles.heading}>{job.title}</h1>
          <p style={styles.heroMeta}>
            {company.company_name}
            {location ? ` / ${location}` : ""}
            {cleanText(job.employment_type)
              ? ` / ${cleanText(job.employment_type)}`
              : ""}
          </p>

          <div style={styles.heroBadges}>
            <span style={styles.heroBadge}>{sponsorshipLabel}</span>
            {job.is_featured ? <span style={styles.featuredBadge}>Featured</span> : null}
            <span style={styles.heroBadge}>Verified</span>
          </div>
        </div>
      </section>

      <section style={styles.content}>
        <div style={styles.ctaBar}>
          {applicationUrl ? (
            <a
              href={applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.primaryButton}
            >
              Apply on official website
            </a>
          ) : (
            <span style={styles.disabledButton}>Official application link missing</span>
          )}

          <Link href={companyUrl} style={styles.secondaryButton}>
            Back to company
          </Link>

          <Link href="/hiring-companies" style={styles.secondaryButton}>
            Back to hiring companies
          </Link>
        </div>

        <p style={styles.disclaimer}>
          TripDoc verifies information against official sources but does not
          guarantee employment, visa sponsorship, work permits or hiring outcomes.
          Immigration eligibility may depend on the applicant, occupation, salary
          and applicable immigration rules. Always confirm the latest requirements
          with the employer and relevant immigration authority before applying.
        </p>

        <div style={styles.grid}>
          <div style={styles.mainColumn}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Sponsorship Status</h2>
              <p style={styles.statusText}>{sponsorshipLabel}</p>
              {job.visa_sponsorship_status === "approved_sponsor_only" ? (
                <p style={styles.warningText}>
                  This employer appears on an official sponsor register, but
                  TripDoc has not confirmed sponsorship for this specific vacancy.
                </p>
              ) : null}
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Sponsorship Evidence</h2>
              <p style={styles.bodyText}>
                {cleanText(job.sponsorship_evidence) ||
                  "Sponsorship evidence has not been listed for this role."}
              </p>
              {job.sponsorship_source_url ? (
                <a
                  href={job.sponsorship_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.inlineLink}
                >
                  View sponsorship evidence source
                </a>
              ) : null}
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>About the Role</h2>
              <p style={styles.bodyText}>
                {cleanText(job.description) ||
                  "TripDoc has not added a role summary yet. Review the official job page before applying."}
              </p>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Key Eligibility</h2>
              <p style={styles.bodyText}>
                {cleanText(job.eligibility) || "Eligibility details are not listed."}
              </p>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Language Requirements</h2>
              <p style={styles.bodyText}>
                {cleanText(job.language_requirements) ||
                  "Language requirements are not listed."}
              </p>
            </section>
          </div>

          <aside style={styles.sideColumn}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Job Snapshot</h2>
              <div style={styles.detailList}>
                <Detail label="Company" value={company.company_name} />
                <Detail label="Country" value={cleanText(job.country) || cleanText(company.country) || "Not listed"} />
                <Detail label="Location" value={location || "Not listed"} />
                <Detail label="Employment type" value={cleanText(job.employment_type) || "Not listed"} />
                <Detail label="Work mode" value={cleanText(job.work_mode) || "Not listed"} />
                <Detail label="Salary" value={salary || "Salary not stated"} />
                <Detail label="Experience" value={cleanText(job.experience_required) || "Not listed"} />
                <Detail label="Posted" value={postedDate || "Not listed"} />
                <Detail label="Application deadline" value={deadline || "Not listed"} />
              </div>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Verification Details</h2>
              <div style={styles.detailList}>
                <Detail label="Verification status" value={job.verification_status || "draft"} />
                <Detail label="Last verified" value={lastVerified || "Not listed"} />
                <Detail label="Official source" value={cleanText(job.official_source) || "Not listed"} />
              </div>

              {job.official_job_url ? (
                <a
                  href={job.official_job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.inlineLink}
                >
                  Open official job page
                </a>
              ) : null}

              {isUrl(job.official_source) ? (
                <a
                  href={job.official_source || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.inlineLink}
                >
                  Open official source
                </a>
              ) : null}

              {job.verification_notes ? (
                <p style={styles.noteText}>{job.verification_notes}</p>
              ) : null}
            </section>

            {job.risk_notes ? (
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>Risk Notes</h2>
                <p style={styles.bodyText}>{job.risk_notes}</p>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <strong style={styles.detailValue}>{value}</strong>
    </div>
  );
}

const styles = {
  pageShell: {
    background: "#f6f8fc",
    color: "#102033",
    minHeight: "100vh",
  },
  hero: {
    background: "linear-gradient(135deg, #17307a 0%, #2952d5 100%)",
    color: "white",
    padding: "94px 20px 84px",
    width: "100%",
  },
  heroInner: {
    margin: "0 auto",
    maxWidth: 1100,
  },
  backLink: {
    color: "rgba(255, 255, 255, 0.88)",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 28,
    textDecoration: "none",
  },
  eyebrow: {
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: 13,
    fontWeight: 850,
    letterSpacing: 0,
    margin: "0 0 12px",
    textTransform: "uppercase",
  },
  heading: {
    color: "white",
    fontSize: "clamp(36px, 6vw, 64px)",
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1.05,
    margin: 0,
    maxWidth: 920,
    overflowWrap: "anywhere",
  },
  heroMeta: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 18,
    fontWeight: 650,
    lineHeight: 1.55,
    margin: "16px 0 0",
  },
  heroBadges: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },
  heroBadge: {
    background: "rgba(255, 255, 255, 0.16)",
    border: "1px solid rgba(255, 255, 255, 0.28)",
    borderRadius: 999,
    color: "white",
    display: "inline-flex",
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.2,
    padding: "8px 11px",
  },
  featuredBadge: {
    background: "#fff4c7",
    border: "1px solid #ffe08a",
    borderRadius: 999,
    color: "#6f5100",
    display: "inline-flex",
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.2,
    padding: "8px 11px",
  },
  content: {
    margin: "0 auto",
    maxWidth: 1100,
    padding: "0 16px 72px",
  },
  ctaBar: {
    alignItems: "stretch",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 16px 45px rgba(16, 32, 51, 0.1)",
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: -32,
    padding: 16,
  },
  primaryButton: {
    alignItems: "center",
    background: "#2952d5",
    border: "1px solid #2952d5",
    borderRadius: 8,
    color: "white",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 850,
    justifyContent: "center",
    minHeight: 46,
    padding: "0 18px",
    textDecoration: "none",
  },
  secondaryButton: {
    alignItems: "center",
    background: "white",
    border: "1px solid #cfdced",
    borderRadius: 8,
    color: "#2952d5",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 850,
    justifyContent: "center",
    minHeight: 46,
    padding: "0 18px",
    textDecoration: "none",
  },
  disabledButton: {
    alignItems: "center",
    background: "#f0f3f8",
    border: "1px solid #dbe2ec",
    borderRadius: 8,
    color: "#66768a",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 850,
    justifyContent: "center",
    minHeight: 46,
    padding: "0 18px",
  },
  disclaimer: {
    background: "#fff8e5",
    border: "1px solid #efd38a",
    borderRadius: 8,
    color: "#654d08",
    fontSize: 14,
    fontWeight: 650,
    lineHeight: 1.65,
    margin: "24px 0",
    padding: "14px 16px",
  },
  grid: {
    alignItems: "start",
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  },
  mainColumn: {
    display: "grid",
    gap: 20,
  },
  sideColumn: {
    display: "grid",
    gap: 20,
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 10px 28px rgba(16, 32, 51, 0.07)",
    padding: 24,
  },
  sectionTitle: {
    color: "#102033",
    fontSize: 22,
    fontWeight: 850,
    lineHeight: 1.2,
    margin: "0 0 16px",
  },
  statusText: {
    color: "#1745aa",
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.4,
    margin: 0,
  },
  warningText: {
    background: "#fff8e5",
    border: "1px solid #efd38a",
    borderRadius: 8,
    color: "#654d08",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.6,
    margin: "14px 0 0",
    padding: 12,
  },
  bodyText: {
    color: "#405166",
    fontSize: 16,
    lineHeight: 1.75,
    margin: 0,
    whiteSpace: "pre-line",
  },
  detailList: {
    display: "grid",
    gap: 12,
  },
  detailItem: {
    background: "#f8fbff",
    border: "1px solid #dce6f5",
    borderRadius: 8,
    display: "grid",
    gap: 6,
    padding: 14,
  },
  detailLabel: {
    color: "#5b6b7e",
    display: "block",
    fontSize: 12,
    fontWeight: 850,
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#102033",
    fontSize: 15,
    fontWeight: 850,
    overflowWrap: "anywhere",
  },
  inlineLink: {
    color: "#2952d5",
    display: "inline-flex",
    fontSize: 15,
    fontWeight: 850,
    marginTop: 14,
    overflowWrap: "anywhere",
    textDecoration: "none",
  },
  noteText: {
    background: "#f8fbff",
    border: "1px solid #dce6f5",
    borderRadius: 8,
    color: "#405166",
    fontSize: 15,
    lineHeight: 1.65,
    margin: "14px 0 0",
    padding: 12,
    whiteSpace: "pre-line",
  },
} as const;
