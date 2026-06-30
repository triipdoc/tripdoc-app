"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type HiringCompany = {
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

type HiringSupportFilter =
  | "all"
  | "visa_sponsorship"
  | "relocation_support"
  | "graduate_program";

type HiringCompaniesClientProps = {
  initialCompanies: HiringCompany[];
  errorMessage?: string;
};

const supportFilters: { label: string; value: HiringSupportFilter }[] = [
  { label: "All", value: "all" },
  { label: "Visa sponsorship signal", value: "visa_sponsorship" },
  { label: "Relocation support signal", value: "relocation_support" },
  { label: "Graduate program", value: "graduate_program" },
];

function cleanValue(value?: string | null) {
  return value?.trim() || "";
}

function getUniqueOptions(companies: HiringCompany[], key: "country" | "industry") {
  return Array.from(
    new Set(companies.map((company) => cleanValue(company[key])).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function getCompanyInitial(name: string) {
  return cleanValue(name).charAt(0).toUpperCase() || "T";
}

function getCompanyMeta(company: HiringCompany) {
  const country = cleanValue(company.country);
  const industry = cleanValue(company.industry);

  return [country, industry].filter(Boolean).join(" / ") || "Global hiring company";
}

function getBadges(company: HiringCompany) {
  const badges: string[] = [];
  const hiringType = cleanValue(company.hiring_type);

  if (company.featured) badges.push("Featured");
  if (hiringType) badges.push(hiringType);
  if (company.visa_sponsorship) badges.push("Visa sponsorship signal");
  if (company.relocation_support) badges.push("Relocation support signal");
  if (company.graduate_program) badges.push("Graduate program");

  return badges;
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

export default function HiringCompaniesClient({
  initialCompanies,
  errorMessage = "",
}: HiringCompaniesClientProps) {
  const [countryFilter, setCountryFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [supportFilter, setSupportFilter] = useState<HiringSupportFilter>("all");

  const countries = useMemo(
    () => getUniqueOptions(initialCompanies, "country"),
    [initialCompanies]
  );
  const industries = useMemo(
    () => getUniqueOptions(initialCompanies, "industry"),
    [initialCompanies]
  );

  const filteredCompanies = useMemo(() => {
    return initialCompanies.filter((company) => {
      const matchesCountry =
        countryFilter === "all" || cleanValue(company.country) === countryFilter;
      const matchesIndustry =
        industryFilter === "all" || cleanValue(company.industry) === industryFilter;
      const matchesSupport =
        supportFilter === "all" ? true : Boolean(company[supportFilter]);

      return matchesCountry && matchesIndustry && matchesSupport;
    });
  }, [initialCompanies, countryFilter, industryFilter, supportFilter]);

  return (
    <main className="pageShell">
      <section className="hero">
        <div className="heroInner">
          <p className="eyebrow">2026 global hiring companies by country</p>
          <h1>Find companies hiring international talent.</h1>
          <p className="heroCopy">
            Browse verified company career pages by country, industry, and hiring
            support. Use TripDoc as a starting point for finding employers with
            international roles, graduate programs, visa sponsorship signals, and
            relocation support signals.
          </p>
        </div>
      </section>

      <section className="content">
        <div className="statsGrid" aria-label="Hiring company statistics">
          <div className="stat">
            <strong>{initialCompanies.length}</strong>
            <span>Verified companies</span>
          </div>
          <div className="stat">
            <strong>{countries.length}</strong>
            <span>Countries</span>
          </div>
          <div className="stat">
            <strong>{industries.length}</strong>
            <span>Industries</span>
          </div>
        </div>

        <div className="filterPanel" aria-label="Hiring company filters">
          <div className="selectGrid">
            <label>
              Country
              <select
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
              >
                <option value="all">All countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Industry
              <select
                value={industryFilter}
                onChange={(event) => setIndustryFilter(event.target.value)}
              >
                <option value="all">All industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="supportFilter">
            <span>Hiring support</span>
            <div className="supportButtons">
              {supportFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={supportFilter === filter.value ? "active" : ""}
                  onClick={() => setSupportFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="resultsHeader">
          <p>
            Showing <strong>{filteredCompanies.length}</strong> of{" "}
            <strong>{initialCompanies.length}</strong> verified companies
          </p>
          <button
            type="button"
            onClick={() => {
              setCountryFilter("all");
              setIndustryFilter("all");
              setSupportFilter("all");
            }}
          >
            Clear filters
          </button>
        </div>

        <p className="disclaimer">
          Important: Users must verify visa sponsorship, open roles, eligibility, and
          relocation support directly on the official company career page before
          applying.
        </p>

        {errorMessage ? (
          <div className="state">{errorMessage}</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="state">No verified hiring companies match these filters yet.</div>
        ) : (
          <div className="companyGrid">
            {filteredCompanies.map((company) => {
              const badges = getBadges(company);
              const description =
                cleanValue(company.description) ||
                "Visit the official company career page to review current roles, eligibility, and hiring support details.";
              const verifiedDate = formatVerifiedDate(company.last_verified_at);
              const verificationNote = cleanValue(company.verification_notes);
              const detailUrl = `/hiring-companies/${encodeURIComponent(
                company.slug
              )}`;

              return (
                <article className="companyCard" key={company.id}>
                  <div className="cardTop">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={`${company.company_name} logo`}
                        className="logo"
                      />
                    ) : (
                      <div className="logoFallback" aria-hidden="true">
                        {getCompanyInitial(company.company_name)}
                      </div>
                    )}

                    <div className="cardTitle">
                      <h2>
                        <Link className="companyNameLink" href={detailUrl}>
                          {company.company_name}
                        </Link>
                      </h2>
                      <p>{getCompanyMeta(company)}</p>
                    </div>
                  </div>

                  <p className="description">{description}</p>

                  {badges.length > 0 ? (
                    <div className="badges" aria-label="Company hiring support">
                      {badges.map((badge) => (
                        <span key={badge}>{badge}</span>
                      ))}
                    </div>
                  ) : null}

                  {(company.source_url || verifiedDate || verificationNote) && (
                    <div className="verificationBox">
                      {verifiedDate && (
                        <p>
                          <strong>Last verified:</strong> {verifiedDate}
                        </p>
                      )}
                      {verificationNote && (
                        <p>
                          <strong>Verification note:</strong> {verificationNote}
                        </p>
                      )}
                      {company.source_url && (
                        <a
                          href={company.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Official source
                        </a>
                      )}
                    </div>
                  )}

                  <div className="cardActions">
                    <Link className="detailsLink" href={detailUrl}>
                      View details
                    </Link>

                    {company.careers_url ? (
                      <a
                        className="careersLink"
                        href={company.careers_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View careers page
                      </a>
                    ) : (
                      <span className="missingLink">Career page not listed</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <style jsx>{`
        .pageShell {
          background: #f6f8fc;
          color: #102033;
          min-height: 100vh;
        }

        .hero {
          background: linear-gradient(135deg, #17307a 0%, #2952d5 100%);
          color: white;
          padding: 104px 20px 96px;
          width: 100%;
        }

        .heroInner,
        .content {
          margin: 0 auto;
          max-width: 1100px;
        }

        .heroInner {
          text-align: center;
        }

        .eyebrow {
          color: rgba(255, 255, 255, 0.84);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0;
          margin: 0 0 14px;
          text-transform: uppercase;
        }

        h1 {
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1.05;
          margin: 0 auto;
          max-width: 880px;
        }

        .heroCopy {
          color: rgba(255, 255, 255, 0.92);
          font-size: 18px;
          font-weight: 500;
          line-height: 1.65;
          margin: 22px auto 0;
          max-width: 800px;
        }

        .content {
          padding: 0 16px 72px;
        }

        .statsGrid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: -44px;
        }

        .stat {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 16px 45px rgba(16, 32, 51, 0.1);
          padding: 22px;
          text-align: center;
        }

        .stat strong {
          color: #2952d5;
          display: block;
          font-size: 34px;
          font-weight: 900;
          line-height: 1;
        }

        .stat span {
          color: #526174;
          display: block;
          font-size: 14px;
          font-weight: 750;
          margin-top: 8px;
        }

        .filterPanel {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          display: grid;
          gap: 18px;
          margin: 28px 0 16px;
          padding: 18px;
        }

        .selectGrid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        label,
        .supportFilter > span {
          color: #26384d;
          display: grid;
          font-size: 13px;
          font-weight: 800;
          gap: 8px;
        }

        select {
          appearance: none;
          background:
            linear-gradient(45deg, transparent 50%, #526174 50%) calc(100% - 18px)
              50% / 7px 7px no-repeat,
            linear-gradient(135deg, #526174 50%, transparent 50%) calc(100% - 13px)
              50% / 7px 7px no-repeat,
            #f9fbff;
          border: 1px solid #cfdced;
          border-radius: 8px;
          color: #13263b;
          font: inherit;
          font-weight: 650;
          min-height: 48px;
          padding: 0 42px 0 14px;
          width: 100%;
        }

        .supportButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 8px;
        }

        .supportButtons button,
        .resultsHeader button {
          border: 1px solid #cfdced;
          border-radius: 8px;
          cursor: pointer;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          min-height: 42px;
          padding: 0 14px;
        }

        .supportButtons button {
          background: #f9fbff;
          color: #26384d;
        }

        .supportButtons button.active {
          background: #2952d5;
          border-color: #2952d5;
          color: white;
        }

        .resultsHeader {
          align-items: center;
          display: flex;
          gap: 14px;
          justify-content: space-between;
          margin: 0 0 14px;
        }

        .resultsHeader p {
          color: #526174;
          font-size: 14px;
          font-weight: 700;
          margin: 0;
        }

        .resultsHeader strong {
          color: #102033;
          font-weight: 900;
        }

        .resultsHeader button {
          background: white;
          color: #2952d5;
        }

        .disclaimer {
          background: #fff8e5;
          border: 1px solid #efd38a;
          border-radius: 8px;
          color: #654d08;
          font-size: 14px;
          font-weight: 650;
          line-height: 1.6;
          margin: 0 0 24px;
          padding: 14px 16px;
        }

        .companyGrid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .companyCard {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 28px rgba(16, 32, 51, 0.07);
          display: flex;
          flex-direction: column;
          min-height: 310px;
          padding: 22px;
        }

        .cardTop {
          align-items: center;
          display: flex;
          gap: 14px;
          min-width: 0;
        }

        .logo,
        .logoFallback {
          border: 1px solid #dce6f5;
          border-radius: 8px;
          flex: 0 0 auto;
          height: 54px;
          width: 54px;
        }

        .logo {
          background: white;
          object-fit: contain;
          padding: 8px;
        }

        .logoFallback {
          align-items: center;
          background: #eef5ff;
          color: #2952d5;
          display: flex;
          font-size: 22px;
          font-weight: 900;
          justify-content: center;
        }

        .cardTitle {
          min-width: 0;
        }

        h2 {
          color: #102033;
          font-size: 20px;
          font-weight: 850;
          line-height: 1.2;
          margin: 0;
          overflow-wrap: anywhere;
        }

        .companyNameLink {
          color: inherit;
          text-decoration: none;
        }

        .companyNameLink:hover {
          color: #2952d5;
        }

        .cardTitle p {
          color: #5b6b7e;
          font-size: 14px;
          font-weight: 650;
          line-height: 1.4;
          margin: 6px 0 0;
        }

        .description {
          color: #405166;
          font-size: 15px;
          line-height: 1.65;
          margin: 18px 0;
        }

        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0 0 14px;
        }

        .badges span {
          background: #eef5ff;
          border: 1px solid #d6e7ff;
          border-radius: 999px;
          color: #1745aa;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.2;
          padding: 7px 10px;
        }

        .verificationBox {
          background: #f8fbff;
          border: 1px solid #dce6f5;
          border-radius: 8px;
          color: #405166;
          font-size: 13px;
          line-height: 1.55;
          margin: 0 0 18px;
          padding: 12px;
        }

        .verificationBox p {
          margin: 0 0 8px;
        }

        .verificationBox p:last-of-type {
          margin-bottom: 0;
        }

        .verificationBox a {
          color: #2952d5;
          display: inline-flex;
          font-weight: 850;
          margin-top: 8px;
          text-decoration: none;
        }

        .cardActions {
          display: grid;
          gap: 10px;
          margin-top: auto;
        }

        .detailsLink,
        .careersLink,
        .missingLink {
          align-items: center;
          border-radius: 8px;
          display: inline-flex;
          font-size: 14px;
          font-weight: 850;
          justify-content: center;
          min-height: 44px;
          text-decoration: none;
          width: 100%;
        }

        .detailsLink {
          background: white;
          border: 1px solid #cfdced;
          color: #2952d5;
        }

        .detailsLink:hover {
          background: #f8fbff;
          border-color: #9fb8e8;
        }

        .careersLink {
          background: #2952d5;
          color: white;
        }

        .careersLink:hover {
          background: #17307a;
        }

        .missingLink {
          background: #f0f3f8;
          color: #66768a;
        }

        .state {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #526174;
          font-size: 16px;
          font-weight: 750;
          padding: 32px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .hero {
            padding: 88px 20px 84px;
          }

          .statsGrid,
          .companyGrid {
            grid-template-columns: 1fr;
          }

          .selectGrid {
            grid-template-columns: 1fr;
          }

          .statsGrid {
            margin-top: -36px;
          }
        }

        @media (max-width: 560px) {
          .hero {
            padding: 78px 18px 74px;
          }

          .content {
            padding-left: 14px;
            padding-right: 14px;
          }

          .heroCopy {
            font-size: 16px;
          }

          .resultsHeader {
            align-items: stretch;
            flex-direction: column;
          }

          .resultsHeader button {
            width: 100%;
          }

          .supportButtons {
            display: grid;
            grid-template-columns: 1fr;
          }

          .supportButtons button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
