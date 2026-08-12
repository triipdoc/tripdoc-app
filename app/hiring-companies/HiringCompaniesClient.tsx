"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  cleanText,
  formatDisplayDate,
  formatSalary,
  getSponsorshipLabel,
  isConfirmedSponsorshipStatus,
  isPublicActiveJob,
  sortPublicJobs,
  type HiringCompanyJob,
  type SponsorshipStatus,
} from "../../lib/hiringCompanyJobs";

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

type ActiveView = "companies" | "jobs";

type HiringCompaniesClientProps = {
  initialCompanies: HiringCompany[];
  initialJobs: HiringCompanyJob[];
  errorMessage?: string;
  jobsErrorMessage?: string;
};

const supportFilters: { label: string; value: HiringSupportFilter }[] = [
  { label: "All", value: "all" },
  { label: "Visa sponsorship signal", value: "visa_sponsorship" },
  { label: "Relocation support signal", value: "relocation_support" },
  { label: "Graduate program", value: "graduate_program" },
];

const sponsorshipFilters: { label: string; value: "all" | SponsorshipStatus }[] = [
  { label: "All sponsorship signals", value: "all" },
  { label: "Explicit sponsorship", value: "explicit" },
  { label: "Work-permit support", value: "work_permit_support" },
  { label: "Conditional sponsorship", value: "conditional" },
  { label: "Approved sponsor only", value: "approved_sponsor_only" },
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
  return formatDisplayDate(value);
}

function getJobCompany(job: HiringCompanyJob) {
  return job.company || null;
}

function getJobCompanyName(job: HiringCompanyJob) {
  return getJobCompany(job)?.company_name || "Hiring company";
}

function getJobCompanySlug(job: HiringCompanyJob) {
  return getJobCompany(job)?.slug || "";
}

function getJobLocation(job: HiringCompanyJob) {
  const location = cleanText(job.location);
  if (location) return location;

  return [cleanText(job.city), cleanText(job.country)].filter(Boolean).join(", ");
}

function getJobUrl(job: HiringCompanyJob) {
  const companySlug = getJobCompanySlug(job);

  return companySlug
    ? `/hiring-companies/${encodeURIComponent(companySlug)}/jobs/${encodeURIComponent(
        job.slug
      )}`
    : "/hiring-companies";
}

export default function HiringCompaniesClient({
  initialCompanies,
  initialJobs,
  errorMessage = "",
  jobsErrorMessage = "",
}: HiringCompaniesClientProps) {
  const [activeView, setActiveView] = useState<ActiveView>("companies");
  const [countryFilter, setCountryFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [supportFilter, setSupportFilter] = useState<HiringSupportFilter>("all");
  const [jobCountryFilter, setJobCountryFilter] = useState("all");
  const [jobCompanyFilter, setJobCompanyFilter] = useState("all");
  const [jobSearch, setJobSearch] = useState("");
  const [sponsorshipFilter, setSponsorshipFilter] = useState<
    "all" | SponsorshipStatus
  >("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");

  const countries = useMemo(
    () => getUniqueOptions(initialCompanies, "country"),
    [initialCompanies]
  );
  const industries = useMemo(
    () => getUniqueOptions(initialCompanies, "industry"),
    [initialCompanies]
  );
  const activeJobs = useMemo(
    () => sortPublicJobs(initialJobs.filter(isPublicActiveJob)),
    [initialJobs]
  );
  const jobCountsByCompany = useMemo(() => {
    const counts = new Map<
      string,
      { total: number; confirmedSponsorship: number }
    >();

    activeJobs.forEach((job) => {
      const current = counts.get(job.company_id) || {
        total: 0,
        confirmedSponsorship: 0,
      };

      current.total += 1;

      if (isConfirmedSponsorshipStatus(job.visa_sponsorship_status)) {
        current.confirmedSponsorship += 1;
      }

      counts.set(job.company_id, current);
    });

    return counts;
  }, [activeJobs]);
  const jobCountries = useMemo(() => {
    return Array.from(
      new Set(activeJobs.map((job) => cleanText(job.country)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [activeJobs]);
  const jobCompanies = useMemo(() => {
    return Array.from(
      new Map(
        activeJobs
          .map((job) => getJobCompany(job))
          .filter(Boolean)
          .map((company) => [company!.id, company!] as const)
      ).values()
    ).sort((a, b) => a.company_name.localeCompare(b.company_name));
  }, [activeJobs]);
  const employmentTypes = useMemo(() => {
    return Array.from(
      new Set(
        activeJobs.map((job) => cleanText(job.employment_type)).filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [activeJobs]);
  const workModes = useMemo(() => {
    return Array.from(
      new Set(activeJobs.map((job) => cleanText(job.work_mode)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [activeJobs]);

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

  const filteredJobs = useMemo(() => {
    const searchTerm = jobSearch.trim().toLowerCase();

    return activeJobs.filter((job) => {
      const company = getJobCompany(job);
      const searchable = [
        job.title,
        company?.company_name,
        job.country,
        job.city,
        job.location,
        job.employment_type,
        job.work_mode,
      ]
        .map((value) => cleanText(value).toLowerCase())
        .join(" ");

      const matchesCountry =
        jobCountryFilter === "all" || cleanText(job.country) === jobCountryFilter;
      const matchesCompany =
        jobCompanyFilter === "all" || job.company_id === jobCompanyFilter;
      const matchesSearch = !searchTerm || searchable.includes(searchTerm);
      const matchesSponsorship =
        sponsorshipFilter === "all" ||
        job.visa_sponsorship_status === sponsorshipFilter;
      const matchesEmploymentType =
        employmentTypeFilter === "all" ||
        cleanText(job.employment_type) === employmentTypeFilter;
      const matchesWorkMode =
        workModeFilter === "all" || cleanText(job.work_mode) === workModeFilter;

      return (
        matchesCountry &&
        matchesCompany &&
        matchesSearch &&
        matchesSponsorship &&
        matchesEmploymentType &&
        matchesWorkMode
      );
    });
  }, [
    activeJobs,
    employmentTypeFilter,
    jobCompanyFilter,
    jobCountryFilter,
    jobSearch,
    sponsorshipFilter,
    workModeFilter,
  ]);

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

        <div className="viewSwitcher" aria-label="Hiring companies view">
          <button
            type="button"
            className={activeView === "companies" ? "active" : ""}
            onClick={() => setActiveView("companies")}
          >
            Companies
          </button>
          <button
            type="button"
            className={activeView === "jobs" ? "active" : ""}
            onClick={() => setActiveView("jobs")}
          >
            Verified Jobs
          </button>
        </div>

        {activeView === "companies" ? (
          <>
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
              const jobCount = jobCountsByCompany.get(company.id);
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

                  <div className="jobCountBox">
                    <strong>Verified open jobs: {jobCount?.total || 0}</strong>
                    {jobCount?.confirmedSponsorship ? (
                      <span>
                        {jobCount.confirmedSponsorship} verified sponsorship job
                        {jobCount.confirmedSponsorship === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>

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
          </>
        ) : (
          <>
            <div className="filterPanel" aria-label="Verified job filters">
              <div className="selectGrid jobSelectGrid">
                <label>
                  Search jobs
                  <input
                    value={jobSearch}
                    onChange={(event) => setJobSearch(event.target.value)}
                    placeholder="Search by job title, company, or location"
                  />
                </label>

                <label>
                  Country
                  <select
                    value={jobCountryFilter}
                    onChange={(event) => setJobCountryFilter(event.target.value)}
                  >
                    <option value="all">All countries</option>
                    {jobCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Company
                  <select
                    value={jobCompanyFilter}
                    onChange={(event) => setJobCompanyFilter(event.target.value)}
                  >
                    <option value="all">All companies</option>
                    {jobCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Sponsorship status
                  <select
                    value={sponsorshipFilter}
                    onChange={(event) =>
                      setSponsorshipFilter(
                        event.target.value as "all" | SponsorshipStatus
                      )
                    }
                  >
                    {sponsorshipFilters.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Employment type
                  <select
                    value={employmentTypeFilter}
                    onChange={(event) =>
                      setEmploymentTypeFilter(event.target.value)
                    }
                  >
                    <option value="all">All employment types</option>
                    {employmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Work mode
                  <select
                    value={workModeFilter}
                    onChange={(event) => setWorkModeFilter(event.target.value)}
                  >
                    <option value="all">All work modes</option>
                    {workModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="resultsHeader">
              <p>
                Showing <strong>{filteredJobs.length}</strong> of{" "}
                <strong>{activeJobs.length}</strong> verified open jobs
              </p>
              <button
                type="button"
                onClick={() => {
                  setJobCountryFilter("all");
                  setJobCompanyFilter("all");
                  setJobSearch("");
                  setSponsorshipFilter("all");
                  setEmploymentTypeFilter("all");
                  setWorkModeFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>

            <p className="disclaimer">
              Important: TripDoc verifies job records against official sources,
              but users must confirm the role is still open, sponsorship wording,
              eligibility, salary, and relocation or work-permit support directly
              with the official employer page before applying.
            </p>

            {jobsErrorMessage ? (
              <div className="state">{jobsErrorMessage}</div>
            ) : filteredJobs.length === 0 ? (
              <div className="state">
                No verified open jobs match these filters yet.
              </div>
            ) : (
              <div className="jobGrid">
                {filteredJobs.map((job) => {
                  const companyName = getJobCompanyName(job);
                  const location = getJobLocation(job);
                  const salary = formatSalary(job);
                  const deadline = formatDisplayDate(job.deadline);
                  const lastVerified = formatDisplayDate(job.last_verified);
                  const sponsorshipLabel = getSponsorshipLabel(
                    job.visa_sponsorship_status
                  );

                  return (
                    <article className="jobCard" key={job.id}>
                      <div>
                        <p className="jobCompany">{companyName}</p>
                        <h2>{job.title}</h2>
                        <p className="jobMeta">
                          {[location, cleanText(job.employment_type)]
                            .filter(Boolean)
                            .join(" / ") || cleanText(job.country)}
                        </p>
                      </div>

                      <div className="jobInfoGrid">
                        <div>
                          <span>Salary</span>
                          <strong>{salary || "Salary not stated"}</strong>
                        </div>

                        {deadline ? (
                          <div>
                            <span>Deadline</span>
                            <strong>{deadline}</strong>
                          </div>
                        ) : null}

                        {lastVerified ? (
                          <div>
                            <span>Last verified</span>
                            <strong>{lastVerified}</strong>
                          </div>
                        ) : null}
                      </div>

                      <div className="badges" aria-label="Job verification badges">
                        <span
                          className={`sponsorshipBadge ${
                            job.visa_sponsorship_status || "unclear"
                          }`}
                        >
                          {sponsorshipLabel}
                        </span>
                        <span>Verified</span>
                      </div>

                      <Link className="detailsLink" href={getJobUrl(job)}>
                        View job
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </>
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

        .viewSwitcher {
          background: white;
          border: 1px solid #dce6f5;
          border-radius: 999px;
          display: flex;
          gap: 6px;
          margin: 28px auto 0;
          max-width: 360px;
          padding: 6px;
        }

        .viewSwitcher button {
          background: transparent;
          border: 0;
          border-radius: 999px;
          color: #526174;
          cursor: pointer;
          flex: 1;
          font: inherit;
          font-size: 14px;
          font-weight: 850;
          min-height: 42px;
          padding: 0 16px;
          transition:
            background 160ms ease,
            color 160ms ease;
        }

        .viewSwitcher button:hover,
        .viewSwitcher button.active {
          background: #eef5ff;
          color: #1745aa;
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

        .jobSelectGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        label,
        .supportFilter > span {
          color: #26384d;
          display: grid;
          font-size: 13px;
          font-weight: 800;
          gap: 8px;
        }

        input,
        select {
          appearance: none;
          background: #f9fbff;
          border: 1px solid #cfdced;
          border-radius: 8px;
          color: #13263b;
          font: inherit;
          font-weight: 650;
          min-height: 48px;
          padding: 0 14px;
          width: 100%;
        }

        select {
          background:
            linear-gradient(45deg, transparent 50%, #526174 50%) calc(100% - 18px)
              50% / 7px 7px no-repeat,
            linear-gradient(135deg, #526174 50%, transparent 50%) calc(100% - 13px)
              50% / 7px 7px no-repeat,
            #f9fbff;
          padding: 0 42px 0 14px;
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

        .jobCountBox {
          background: #f8fbff;
          border: 1px solid #dce6f5;
          border-radius: 8px;
          color: #405166;
          display: grid;
          gap: 6px;
          font-size: 13px;
          margin: 0 0 16px;
          padding: 12px;
        }

        .jobCountBox strong {
          color: #102033;
          font-weight: 900;
        }

        .jobCountBox span {
          color: #1745aa;
          font-weight: 850;
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

        .jobGrid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .jobCard {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 28px rgba(16, 32, 51, 0.07);
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 22px;
        }

        .jobCompany {
          color: #2952d5;
          font-size: 13px;
          font-weight: 900;
          margin: 0 0 8px;
          text-transform: uppercase;
        }

        .jobMeta {
          color: #5b6b7e;
          font-size: 14px;
          font-weight: 650;
          line-height: 1.4;
          margin: 8px 0 0;
        }

        .jobInfoGrid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }

        .jobInfoGrid div {
          background: #f8fbff;
          border: 1px solid #dce6f5;
          border-radius: 8px;
          display: grid;
          gap: 5px;
          padding: 12px;
        }

        .jobInfoGrid span {
          color: #5b6b7e;
          font-size: 12px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .jobInfoGrid strong {
          color: #102033;
          font-size: 14px;
          font-weight: 850;
          overflow-wrap: anywhere;
        }

        .sponsorshipBadge.explicit {
          background: #edf8f0;
          border-color: #b7dfc2;
          color: #1f6b37;
        }

        .sponsorshipBadge.work_permit_support {
          background: #eef5ff;
          border-color: #c8dbff;
          color: #1745aa;
        }

        .sponsorshipBadge.conditional {
          background: #fff7e6;
          border-color: #f3d29b;
          color: #8a5a00;
        }

        .sponsorshipBadge.approved_sponsor_only {
          background: #f1f5f9;
          border-color: #d7dee8;
          color: #475569;
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
          .companyGrid,
          .jobGrid {
            grid-template-columns: 1fr;
          }

          .selectGrid,
          .jobSelectGrid {
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
