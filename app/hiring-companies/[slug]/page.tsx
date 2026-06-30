import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

const SITE_URL = "https://app.tripdoc.net";

type HiringCompany = {
  id: string;
  company_name: string;
  slug: string;
  country: string | null;
  industry: string | null;
  hiring_type: string | null;
  description: string | null;
  careers_url: string | null;
  logo_url: string | null;
  source_url: string | null;
  verification_notes: string | null;
  last_verified_at: string | null;
  visa_sponsorship: boolean | null;
  relocation_support: boolean | null;
  graduate_program: boolean | null;
  featured: boolean | null;
  verification_status: string | null;
  created_at: string | null;
};

type Badge = {
  label: string;
  tone: "primary" | "featured" | "neutral";
};

export const dynamic = "force-dynamic";

function cleanValue(value?: string | null) {
  return value?.trim() || "";
}

function formatVerifiedDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCompanyMeta(company: HiringCompany) {
  const meta = [
    cleanValue(company.country),
    cleanValue(company.industry),
    cleanValue(company.hiring_type),
  ].filter(Boolean);

  return meta.join(" / ") || "Verified global hiring company";
}

function getBadges(company: HiringCompany) {
  const badges: Badge[] = [];
  const hiringType = cleanValue(company.hiring_type);

  if (company.featured) badges.push({ label: "Featured", tone: "featured" });
  if (hiringType) badges.push({ label: hiringType, tone: "neutral" });
  if (company.visa_sponsorship) {
    badges.push({ label: "Visa sponsorship signal", tone: "primary" });
  }
  if (company.relocation_support) {
    badges.push({ label: "Relocation support signal", tone: "primary" });
  }
  if (company.graduate_program) {
    badges.push({ label: "Graduate program", tone: "primary" });
  }

  return badges;
}

async function getVerifiedCompany(slug: string) {
  const { data, error } = await supabase
    .from("hiring_companies")
    .select("*")
    .eq("slug", slug)
    .eq("verification_status", "verified")
    .maybeSingle();

  if (error) {
    console.error("Hiring company detail page error:", error.message);
    return null;
  }

  return (data as HiringCompany | null) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await getVerifiedCompany(slug);
  const pageUrl = `${SITE_URL}/hiring-companies/${encodeURIComponent(slug)}`;

  if (!company) {
    return {
      title: "Hiring Company Not Found | TripDoc",
      description: "The requested hiring company could not be found on TripDoc.",
      alternates: {
        canonical: pageUrl,
      },
    };
  }

  const title = `${company.company_name} Hiring Information 2026 | TripDoc`;
  const description = `View verified hiring information for ${company.company_name}, including country, industry, hiring support signals, career page, and verification notes.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/hiring-companies/${encodeURIComponent(
        company.slug
      )}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hiring-companies/${encodeURIComponent(company.slug)}`,
      siteName: "TripDoc",
      type: "article",
      images: company.logo_url
        ? [{ url: company.logo_url, alt: `${company.company_name} logo` }]
        : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: company.logo_url ? [company.logo_url] : [],
    },
  };
}

export default async function HiringCompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getVerifiedCompany(slug);

  if (!company) {
    notFound();
  }

  const description =
    cleanValue(company.description) ||
    "Visit the official company career page to review current roles, eligibility, and hiring support details.";
  const lastVerified = formatVerifiedDate(company.last_verified_at);
  const verificationNotes = cleanValue(company.verification_notes);
  const sourceUrl = cleanValue(company.source_url);
  const careersUrl = cleanValue(company.careers_url);
  const badges = getBadges(company);

  return (
    <main style={styles.pageShell}>
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <Link href="/hiring-companies" style={styles.backLink}>
            &larr; Back to hiring companies
          </Link>

          <div style={styles.heroContent}>
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`${company.company_name} logo`}
                style={styles.logo}
              />
            ) : (
              <div style={styles.logoFallback} aria-hidden="true">
                {cleanValue(company.company_name).charAt(0).toUpperCase() || "T"}
              </div>
            )}

            <div style={styles.heroText}>
              <p style={styles.eyebrow}>Verified hiring company profile</p>
              <h1 style={styles.heading}>{company.company_name}</h1>
              <p style={styles.heroMeta}>{getCompanyMeta(company)}</p>

              {badges.length > 0 ? (
                <div style={styles.badges} aria-label="Hiring support signals">
                  {badges.map((badge) => (
                    <span
                      key={badge.label}
                      style={{
                        ...styles.badge,
                        ...(badge.tone === "featured"
                          ? styles.featuredBadge
                          : badge.tone === "primary"
                          ? styles.primaryBadge
                          : styles.neutralBadge),
                      }}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section style={styles.content}>
        <div style={styles.ctaBar}>
          {careersUrl ? (
            <a
              href={careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.primaryButton}
            >
              Visit official careers page
            </a>
          ) : (
            <span style={styles.disabledButton}>Careers page not listed</span>
          )}

          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.secondaryButton}
            >
              View verification source
            </a>
          ) : null}

          <Link href="/hiring-companies" style={styles.secondaryButton}>
            Back to hiring companies
          </Link>
        </div>

        <p style={styles.disclaimer}>
          TripDoc does not guarantee jobs, visa sponsorship, relocation support,
          or hiring outcomes. Users must verify open roles, eligibility, visa
          support, salary, and relocation details directly on the official company
          career page before applying.
        </p>

        <div style={styles.grid}>
          <div style={styles.mainColumn}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Company Overview</h2>
              <p style={styles.description}>{description}</p>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Verification Details</h2>

              <div style={styles.detailList}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Last verified</span>
                  <strong style={styles.detailValue}>
                    {lastVerified || "Not listed"}
                  </strong>
                </div>

                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Official source</span>
                  {sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.inlineLink}
                    >
                      View source
                    </a>
                  ) : (
                    <strong style={styles.detailValue}>Not listed</strong>
                  )}
                </div>

                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Careers page</span>
                  {careersUrl ? (
                    <a
                      href={careersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.inlineLink}
                    >
                      Open careers page
                    </a>
                  ) : (
                    <strong style={styles.detailValue}>Not listed</strong>
                  )}
                </div>
              </div>

              {verificationNotes ? (
                <div style={styles.noteBox}>
                  <span style={styles.detailLabel}>Verification note</span>
                  <p style={styles.noteText}>{verificationNotes}</p>
                </div>
              ) : null}
            </section>
          </div>

          <aside style={styles.sideColumn}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Hiring Snapshot</h2>

              <div style={styles.snapshotGrid}>
                <div style={styles.snapshotItem}>
                  <span style={styles.detailLabel}>Country</span>
                  <strong style={styles.detailValue}>
                    {cleanValue(company.country) || "Global"}
                  </strong>
                </div>

                <div style={styles.snapshotItem}>
                  <span style={styles.detailLabel}>Industry</span>
                  <strong style={styles.detailValue}>
                    {cleanValue(company.industry) || "Not listed"}
                  </strong>
                </div>

                <div style={styles.snapshotItem}>
                  <span style={styles.detailLabel}>Hiring type</span>
                  <strong style={styles.detailValue}>
                    {cleanValue(company.hiring_type) || "Not listed"}
                  </strong>
                </div>
              </div>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Support Signals</h2>

              <div style={styles.signalList}>
                <div style={styles.signalItem}>
                  <span style={styles.signalDot(company.visa_sponsorship)} />
                  <span>Visa sponsorship signal</span>
                  <strong>
                    {company.visa_sponsorship ? "Listed" : "Not listed"}
                  </strong>
                </div>

                <div style={styles.signalItem}>
                  <span style={styles.signalDot(company.relocation_support)} />
                  <span>Relocation support signal</span>
                  <strong>
                    {company.relocation_support ? "Listed" : "Not listed"}
                  </strong>
                </div>

                <div style={styles.signalItem}>
                  <span style={styles.signalDot(company.graduate_program)} />
                  <span>Graduate program</span>
                  <strong>
                    {company.graduate_program ? "Listed" : "Not listed"}
                  </strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
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
  heroContent: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
  },
  logo: {
    background: "white",
    border: "1px solid rgba(255, 255, 255, 0.34)",
    borderRadius: 8,
    boxShadow: "0 18px 48px rgba(8, 19, 52, 0.22)",
    height: 96,
    objectFit: "contain",
    padding: 14,
    width: 96,
  },
  logoFallback: {
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.14)",
    border: "1px solid rgba(255, 255, 255, 0.24)",
    borderRadius: 8,
    boxShadow: "0 18px 48px rgba(8, 19, 52, 0.18)",
    color: "white",
    display: "flex",
    fontSize: 42,
    fontWeight: 900,
    height: 96,
    justifyContent: "center",
    width: 96,
  },
  heroText: {
    flex: "1 1 320px",
    minWidth: 0,
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
    fontSize: "clamp(38px, 6vw, 64px)",
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1.05,
    margin: 0,
    overflowWrap: "anywhere",
  },
  heroMeta: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 18,
    fontWeight: 650,
    lineHeight: 1.55,
    margin: "16px 0 0",
  },
  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },
  badge: {
    borderRadius: 999,
    display: "inline-flex",
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.2,
    padding: "8px 11px",
  },
  featuredBadge: {
    background: "#fff4c7",
    border: "1px solid #ffe08a",
    color: "#6f5100",
  },
  primaryBadge: {
    background: "rgba(255, 255, 255, 0.16)",
    border: "1px solid rgba(255, 255, 255, 0.28)",
    color: "white",
  },
  neutralBadge: {
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    color: "#17307a",
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
  description: {
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
    fontSize: 15,
    fontWeight: 850,
    overflowWrap: "anywhere",
    textDecoration: "none",
  },
  noteBox: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    marginTop: 14,
    padding: 14,
  },
  noteText: {
    color: "#405166",
    fontSize: 15,
    lineHeight: 1.65,
    margin: "8px 0 0",
    whiteSpace: "pre-line",
  },
  snapshotGrid: {
    display: "grid",
    gap: 12,
  },
  snapshotItem: {
    background: "#f8fbff",
    border: "1px solid #dce6f5",
    borderRadius: 8,
    display: "grid",
    gap: 6,
    padding: 14,
  },
  signalList: {
    display: "grid",
    gap: 12,
  },
  signalItem: {
    alignItems: "center",
    background: "#f8fbff",
    border: "1px solid #dce6f5",
    borderRadius: 8,
    color: "#405166",
    display: "grid",
    fontSize: 14,
    fontWeight: 700,
    gap: 10,
    gridTemplateColumns: "10px minmax(0, 1fr) auto",
    padding: 14,
  },
  signalDot: (active?: boolean | null): CSSProperties => ({
    background: active ? "#2f7d4f" : "#b7c1ce",
    borderRadius: 999,
    display: "inline-block",
    height: 10,
    width: 10,
  }),
} as const;
