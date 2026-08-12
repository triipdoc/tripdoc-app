"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  formatDisplayDate,
  formatSalary,
  generateSlug,
  getSponsorshipLabel,
  JOB_VERIFICATION_STATUSES,
  SPONSORSHIP_STATUSES,
  sponsorshipStatusLabels,
  type HiringCompanyJob,
  type JobVerificationStatus,
  type SponsorshipStatus,
} from "../../../lib/hiringCompanyJobs";

type HiringCompanyOption = {
  id: string;
  company_name: string;
  slug: string;
  country: string | null;
  industry: string | null;
};

type JobForm = {
  company_id: string;
  title: string;
  slug: string;
  country: string;
  city: string;
  location: string;
  employment_type: string;
  work_mode: string;
  salary: string;
  salary_currency: string;
  salary_period: string;
  description: string;
  eligibility: string;
  experience_required: string;
  language_requirements: string;
  visa_sponsorship_status: SponsorshipStatus;
  sponsorship_evidence: string;
  sponsorship_source_url: string;
  relocation_support: boolean;
  work_permit_support: boolean;
  official_job_url: string;
  application_url: string;
  official_source: string;
  posted_date: string;
  deadline: string;
  last_verified: string;
  verification_status: JobVerificationStatus;
  verification_notes: string;
  risk_notes: string;
  is_active: boolean;
  is_featured: boolean;
};

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

type FormErrors = Partial<Record<keyof JobForm, string>>;

const emptyForm: JobForm = {
  company_id: "",
  title: "",
  slug: "",
  country: "",
  city: "",
  location: "",
  employment_type: "",
  work_mode: "",
  salary: "",
  salary_currency: "",
  salary_period: "",
  description: "",
  eligibility: "",
  experience_required: "",
  language_requirements: "",
  visa_sponsorship_status: "unclear",
  sponsorship_evidence: "",
  sponsorship_source_url: "",
  relocation_support: false,
  work_permit_support: false,
  official_job_url: "",
  application_url: "",
  official_source: "",
  posted_date: "",
  deadline: "",
  last_verified: "",
  verification_status: "draft",
  verification_notes: "",
  risk_notes: "",
  is_active: true,
  is_featured: false,
};

const sectionCardStyle = {
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: 24,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
} as const;

const inputStyle = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "100%",
  background: "#fff",
} as const;

const secondaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: 600,
  textDecoration: "none",
} as const;

const primaryButtonStyle = {
  padding: "10px 14px",
  background: "#1976d2",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
} as const;

function cleanValue(value?: string | null) {
  return value?.trim() || "";
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function jobToForm(job: HiringCompanyJob): JobForm {
  return {
    company_id: job.company_id || "",
    title: job.title || "",
    slug: job.slug || generateSlug(job.title || ""),
    country: job.country || "",
    city: job.city || "",
    location: job.location || "",
    employment_type: job.employment_type || "",
    work_mode: job.work_mode || "",
    salary: job.salary || "",
    salary_currency: job.salary_currency || "",
    salary_period: job.salary_period || "",
    description: job.description || "",
    eligibility: job.eligibility || "",
    experience_required: job.experience_required || "",
    language_requirements: job.language_requirements || "",
    visa_sponsorship_status: job.visa_sponsorship_status || "unclear",
    sponsorship_evidence: job.sponsorship_evidence || "",
    sponsorship_source_url: job.sponsorship_source_url || "",
    relocation_support: Boolean(job.relocation_support),
    work_permit_support: Boolean(job.work_permit_support),
    official_job_url: job.official_job_url || "",
    application_url: job.application_url || "",
    official_source: job.official_source || "",
    posted_date: toDateInputValue(job.posted_date),
    deadline: toDateInputValue(job.deadline),
    last_verified: toDateInputValue(job.last_verified),
    verification_status: job.verification_status || "draft",
    verification_notes: job.verification_notes || "",
    risk_notes: job.risk_notes || "",
    is_active: job.is_active !== false,
    is_featured: Boolean(job.is_featured),
  };
}

function buildPayload(form: JobForm) {
  return {
    ...form,
    title: form.title.trim(),
    slug: generateSlug(form.slug || form.title),
    country: form.country.trim(),
    city: form.city.trim(),
    location: form.location.trim(),
    employment_type: form.employment_type.trim(),
    work_mode: form.work_mode.trim(),
    salary: form.salary.trim(),
    salary_currency: form.salary_currency.trim(),
    salary_period: form.salary_period.trim(),
    description: form.description.trim(),
    eligibility: form.eligibility.trim(),
    experience_required: form.experience_required.trim(),
    language_requirements: form.language_requirements.trim(),
    sponsorship_evidence: form.sponsorship_evidence.trim(),
    sponsorship_source_url: form.sponsorship_source_url.trim(),
    official_job_url: form.official_job_url.trim(),
    application_url: form.application_url.trim(),
    official_source: form.official_source.trim(),
    verification_notes: form.verification_notes.trim(),
    risk_notes: form.risk_notes.trim(),
  };
}

function validateForm(form: JobForm) {
  const errors: FormErrors = {};
  const slug = generateSlug(form.slug || form.title);

  if (!form.company_id) errors.company_id = "Select an existing hiring company.";
  if (!form.title.trim()) errors.title = "Job title is required.";
  if (!slug) errors.slug = "Slug is required.";

  if (form.official_job_url && !isValidUrl(form.official_job_url)) {
    errors.official_job_url = "Official job URL must be a valid http/https link.";
  }
  if (form.application_url && !isValidUrl(form.application_url)) {
    errors.application_url = "Application URL must be a valid http/https link.";
  }
  if (form.sponsorship_source_url && !isValidUrl(form.sponsorship_source_url)) {
    errors.sponsorship_source_url =
      "Sponsorship source URL must be a valid http/https link.";
  }

  if (form.verification_status === "verified") {
    if (!form.is_active) errors.is_active = "A verified job must be active.";
    if (!form.official_job_url.trim()) {
      errors.official_job_url =
        "Verified jobs require an official employer or government vacancy URL.";
    }
    if (!form.application_url.trim()) {
      errors.application_url = "Verified jobs require an official application URL.";
    }
    if (!form.country.trim() && !form.location.trim()) {
      errors.country = "Verified jobs require a country or location.";
    }
    if (
      form.visa_sponsorship_status === "unclear" ||
      form.visa_sponsorship_status === "none"
    ) {
      errors.visa_sponsorship_status =
        "Verified public jobs require documented sponsorship or work-permit support status.";
    }
    if (!form.sponsorship_evidence.trim()) {
      errors.sponsorship_evidence =
        "Verified jobs require concise sponsorship evidence.";
    }
    if (!form.last_verified.trim()) {
      errors.last_verified = "Verified jobs require a last verified date.";
    }
  }

  if (
    form.verification_status === "verified" &&
    form.visa_sponsorship_status === "explicit" &&
    !form.sponsorship_source_url.trim()
  ) {
    errors.sponsorship_source_url =
      "Explicit sponsorship requires a sponsorship evidence source URL.";
  }

  return errors;
}

function statusBadgeStyle(status?: JobVerificationStatus | null) {
  if (status === "verified") return { background: "#edf8f0", color: "#1f6b37" };
  if (status === "pending") return { background: "#fff7e6", color: "#8a5a00" };
  if (status === "expired") return { background: "#fff3f3", color: "#b42318" };
  return { background: "#f1f5f9", color: "#475569" };
}

function getCompanyName(job: HiringCompanyJob) {
  return job.company?.company_name || "Company not loaded";
}

function getLocation(job: HiringCompanyJob) {
  return (
    cleanValue(job.location) ||
    [cleanValue(job.city), cleanValue(job.country)].filter(Boolean).join(", ")
  );
}

export default function HiringJobsAdminPage() {
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [companies, setCompanies] = useState<HiringCompanyOption[]>([]);
  const [jobs, setJobs] = useState<HiringCompanyJob[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sponsorshipFilter, setSponsorshipFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [sort, setSort] = useState("deadline-asc");

  const countries = useMemo(() => {
    return Array.from(
      new Set(jobs.map((job) => cleanValue(job.country)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const possibleDuplicate = useMemo(() => {
    if (!form.company_id || !form.title.trim()) return null;
    const normalizedTitle = form.title.trim().toLowerCase();
    const normalizedLocation = form.location.trim().toLowerCase();
    const normalizedUrl = form.official_job_url.trim().toLowerCase();

    return jobs.find((job) => {
      if (job.id === editingId || job.company_id !== form.company_id) return false;

      const sameUrl =
        normalizedUrl && cleanValue(job.official_job_url).toLowerCase() === normalizedUrl;
      const sameTitleLocation =
        normalizedLocation &&
        cleanValue(job.title).toLowerCase() === normalizedTitle &&
        cleanValue(job.location).toLowerCase() === normalizedLocation;

      return Boolean(sameUrl || sameTitleLocation);
    });
  }, [editingId, form.company_id, form.location, form.official_job_url, form.title, jobs]);

  async function loadCompanies() {
    try {
      const res = await fetch("/api/admin/hiring-companies?search=&status=all", {
        method: "GET",
        cache: "no-store",
      });
      const result: { companies?: HiringCompanyOption[]; error?: string } =
        await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Could not load hiring companies.",
        });
        return;
      }

      setCompanies(result.companies || []);
    } catch (error) {
      console.error("Hiring companies options fetch failed:", error);
      setNotice({ type: "error", message: "Could not load hiring companies." });
    }
  }

  async function loadJobs() {
    try {
      setJobsLoading(true);
      const params = new URLSearchParams({
        search,
        country: countryFilter,
        company_id: companyFilter,
        sponsorship_status: sponsorshipFilter,
        verification_status: verificationFilter,
        sort,
      });

      const res = await fetch(`/api/admin/hiring-jobs?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const result: { jobs?: HiringCompanyJob[]; error?: string } =
        await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Could not load hiring jobs.",
        });
        return;
      }

      setJobs(result.jobs || []);
    } catch (error) {
      console.error("Hiring jobs fetch failed:", error);
      setNotice({ type: "error", message: "Could not load hiring jobs." });
    } finally {
      setJobsLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadJobs();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search, countryFilter, companyFilter, sponsorshipFilter, verificationFilter, sort]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
    setFormErrors({});
  }

  function updateForm<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: !editingId && !slugTouched ? generateSlug(value) : prev.slug,
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    updateForm("slug", generateSlug(value));
  }

  async function saveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setNotice({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const endpoint = editingId
        ? `/api/admin/hiring-jobs/${editingId}`
        : "/api/admin/hiring-jobs";

      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form)),
      });
      const result: { job?: HiringCompanyJob; error?: string } = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Could not save hiring job.",
        });
        return;
      }

      setNotice({
        type: "success",
        message: editingId ? "Hiring job updated." : "Hiring job created.",
      });
      resetForm();
      await loadJobs();
    } catch (error) {
      console.error("Hiring job save failed:", error);
      setNotice({ type: "error", message: "Could not save hiring job." });
    } finally {
      setLoading(false);
    }
  }

  function startEdit(job: HiringCompanyJob) {
    setForm(jobToForm(job));
    setEditingId(job.id);
    setSlugTouched(true);
    setFormErrors({});
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateJob(job: HiringCompanyJob, updates: Partial<JobForm>) {
    setQuickActionId(job.id);
    setNotice(null);

    try {
      const mergedForm = { ...jobToForm(job), ...updates };
      const res = await fetch(`/api/admin/hiring-jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(mergedForm)),
      });
      const result: { error?: string } = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Could not update hiring job.",
        });
        return;
      }

      await loadJobs();
    } catch (error) {
      console.error("Hiring job quick update failed:", error);
      setNotice({ type: "error", message: "Could not update hiring job." });
    } finally {
      setQuickActionId(null);
    }
  }

  async function deleteJob(job: HiringCompanyJob) {
    const confirmed = window.confirm(
      `Delete ${job.title}? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteLoadingId(job.id);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/hiring-jobs/${job.id}`, {
        method: "DELETE",
      });
      const result: { error?: string } = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Could not delete hiring job.",
        });
        return;
      }

      if (editingId === job.id) resetForm();

      setNotice({ type: "success", message: "Hiring job deleted." });
      await loadJobs();
    } catch (error) {
      console.error("Hiring job delete failed:", error);
      setNotice({ type: "error", message: "Could not delete hiring job." });
    } finally {
      setDeleteLoadingId(null);
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 12 }}>Hiring Jobs Admin</h1>
          <p style={{ color: "#666", marginTop: 0 }}>
            Manage individually verified open jobs linked to hiring companies.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/manage-tripdoc" style={secondaryButtonStyle}>
            Program Admin
          </Link>
          <Link href="/manage-tripdoc/hiring-companies" style={secondaryButtonStyle}>
            Hiring Companies
          </Link>
          <Link href="/hiring-companies" target="_blank" rel="noreferrer" style={secondaryButtonStyle}>
            View Public Page
          </Link>
          <button
            onClick={async () => {
              await fetch("/api/admin-logout", { method: "POST" });
              window.location.href = "/manage-tripdoc/login";
            }}
            style={secondaryButtonStyle}
          >
            Logout
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            borderRadius: 10,
            border:
              notice.type === "success"
                ? "1px solid #b7dfc2"
                : "1px solid #efb7b7",
            background: notice.type === "success" ? "#edf8f0" : "#fff3f3",
            color: notice.type === "success" ? "#1f6b37" : "#b42318",
            fontWeight: 600,
          }}
        >
          {notice.message}
        </div>
      )}

      <form
        onSubmit={saveJob}
        style={{
          display: "grid",
          gap: 14,
          maxWidth: 980,
          marginBottom: 34,
          ...sectionCardStyle,
        }}
      >
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>
            {editingId ? "Edit Hiring Job" : "Add Hiring Job"}
          </h2>
          <p style={{ color: "#666", marginTop: 0, marginBottom: 10 }}>
            Use only official employer or government vacancy sources. Do not add
            third-party blog, social, or generic recruiter posts as the primary
            source.
          </p>
        </div>

        <FieldError message={formErrors.company_id} />
        <select
          value={form.company_id}
          onChange={(event) => updateForm("company_id", event.target.value)}
          style={inputStyle}
        >
          <option value="">Select hiring company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.company_name}
            </option>
          ))}
        </select>

        <div style={gridStyle}>
          <div>
            <input
              placeholder="Job title"
              value={form.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              style={inputStyle}
            />
            <FieldError message={formErrors.title} />
          </div>
          <div>
            <input
              placeholder="Slug"
              value={form.slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              style={inputStyle}
            />
            <FieldError message={formErrors.slug} />
            <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
              Public job slug: {form.slug || "job-slug"}
            </div>
          </div>
        </div>

        {possibleDuplicate && (
          <div style={warningBoxStyle}>
            Possible duplicate found: {possibleDuplicate.title}. Review before
            saving; TripDoc does not silently delete duplicates.
          </div>
        )}

        <div style={gridStyle}>
          <input placeholder="Country" value={form.country} onChange={(event) => updateForm("country", event.target.value)} style={inputStyle} />
          <input placeholder="City" value={form.city} onChange={(event) => updateForm("city", event.target.value)} style={inputStyle} />
          <input placeholder="Location" value={form.location} onChange={(event) => updateForm("location", event.target.value)} style={inputStyle} />
          <input placeholder="Employment type" value={form.employment_type} onChange={(event) => updateForm("employment_type", event.target.value)} style={inputStyle} />
          <input placeholder="Work mode" value={form.work_mode} onChange={(event) => updateForm("work_mode", event.target.value)} style={inputStyle} />
          <input placeholder="Experience required" value={form.experience_required} onChange={(event) => updateForm("experience_required", event.target.value)} style={inputStyle} />
        </div>
        <FieldError message={formErrors.country} />

        <div style={gridStyle}>
          <input placeholder="Salary" value={form.salary} onChange={(event) => updateForm("salary", event.target.value)} style={inputStyle} />
          <input placeholder="Salary currency" value={form.salary_currency} onChange={(event) => updateForm("salary_currency", event.target.value)} style={inputStyle} />
          <input placeholder="Salary period" value={form.salary_period} onChange={(event) => updateForm("salary_period", event.target.value)} style={inputStyle} />
        </div>

        <div style={gridStyle}>
          <div>
            <input placeholder="Official job URL" value={form.official_job_url} onChange={(event) => updateForm("official_job_url", event.target.value)} style={inputStyle} />
            <FieldError message={formErrors.official_job_url} />
          </div>
          <div>
            <input placeholder="Application URL" value={form.application_url} onChange={(event) => updateForm("application_url", event.target.value)} style={inputStyle} />
            <FieldError message={formErrors.application_url} />
          </div>
          <input placeholder="Official source label or URL" value={form.official_source} onChange={(event) => updateForm("official_source", event.target.value)} style={inputStyle} />
        </div>

        <div style={gridStyle}>
          <div>
            <select
              value={form.visa_sponsorship_status}
              onChange={(event) => updateForm("visa_sponsorship_status", event.target.value as SponsorshipStatus)}
              style={inputStyle}
            >
              {SPONSORSHIP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {sponsorshipStatusLabels[status]}
                </option>
              ))}
            </select>
            <FieldError message={formErrors.visa_sponsorship_status} />
          </div>
          <div>
            <input placeholder="Sponsorship source URL" value={form.sponsorship_source_url} onChange={(event) => updateForm("sponsorship_source_url", event.target.value)} style={inputStyle} />
            <FieldError message={formErrors.sponsorship_source_url} />
          </div>
        </div>

        {form.visa_sponsorship_status === "approved_sponsor_only" && (
          <div style={warningBoxStyle}>
            Being listed on a sponsor register does not prove this vacancy offers
            sponsorship. Do not market this role as confirmed visa sponsorship.
          </div>
        )}

        <textarea
          placeholder="Sponsorship evidence"
          value={form.sponsorship_evidence}
          onChange={(event) => updateForm("sponsorship_evidence", event.target.value)}
          style={textareaStyle}
        />
        <FieldError message={formErrors.sponsorship_evidence} />

        <textarea placeholder="Description" value={form.description} onChange={(event) => updateForm("description", event.target.value)} style={textareaStyle} />
        <textarea placeholder="Eligibility" value={form.eligibility} onChange={(event) => updateForm("eligibility", event.target.value)} style={textareaStyle} />
        <textarea placeholder="Language requirements" value={form.language_requirements} onChange={(event) => updateForm("language_requirements", event.target.value)} style={textareaStyle} />

        <div style={gridStyle}>
          <label style={dateLabelStyle}>
            Posted date
            <input type="date" value={form.posted_date} onChange={(event) => updateForm("posted_date", event.target.value)} style={inputStyle} />
          </label>
          <label style={dateLabelStyle}>
            Deadline
            <input type="date" value={form.deadline} onChange={(event) => updateForm("deadline", event.target.value)} style={inputStyle} />
          </label>
          <label style={dateLabelStyle}>
            Last verified
            <input type="date" value={form.last_verified} onChange={(event) => updateForm("last_verified", event.target.value)} style={inputStyle} />
            <FieldError message={formErrors.last_verified} />
          </label>
        </div>

        <textarea placeholder="Verification notes" value={form.verification_notes} onChange={(event) => updateForm("verification_notes", event.target.value)} style={textareaStyle} />
        <textarea placeholder="Risk notes" value={form.risk_notes} onChange={(event) => updateForm("risk_notes", event.target.value)} style={textareaStyle} />

        <select
          value={form.verification_status}
          onChange={(event) => updateForm("verification_status", event.target.value as JobVerificationStatus)}
          style={inputStyle}
        >
          {JOB_VERIFICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <div style={checkboxGridStyle}>
          {[
            ["relocation_support", "Relocation support"] as const,
            ["work_permit_support", "Work-permit support"] as const,
            ["is_active", "Active"] as const,
            ["is_featured", "Featured"] as const,
          ].map(([key, label]) => (
            <label key={key} style={checkboxStyle}>
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(event) => updateForm(key, event.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
        <FieldError message={formErrors.is_active} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...primaryButtonStyle,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : editingId ? "Update Job" : "Create Job"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
        <div style={{ ...gridStyle, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input placeholder="Search by title, country, city, or location" value={search} onChange={(event) => setSearch(event.target.value)} style={inputStyle} />
          <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} style={inputStyle}>
            <option value="all">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} style={inputStyle}>
            <option value="all">All companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.company_name}</option>
            ))}
          </select>
          <select value={sponsorshipFilter} onChange={(event) => setSponsorshipFilter(event.target.value)} style={inputStyle}>
            <option value="all">All sponsorship statuses</option>
            {SPONSORSHIP_STATUSES.map((status) => (
              <option key={status} value={status}>{sponsorshipStatusLabels[status]}</option>
            ))}
          </select>
          <select value={verificationFilter} onChange={(event) => setVerificationFilter(event.target.value)} style={inputStyle}>
            <option value="all">All verification statuses</option>
            {JOB_VERIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} style={inputStyle}>
            <option value="deadline-asc">Deadline soonest</option>
            <option value="deadline-desc">Deadline latest</option>
            <option value="featured-first">Featured first</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>All Hiring Jobs</h2>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 16 }}>
        Showing {jobs.length} hiring job{jobs.length === 1 ? "" : "s"}
      </p>

      {jobsLoading ? (
        <div style={{ ...sectionCardStyle, color: "#666" }}>Loading hiring jobs...</div>
      ) : jobs.length === 0 ? (
        <div style={{ ...sectionCardStyle, color: "#666" }}>
          No hiring jobs found for the current filters.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {jobs.map((job) => {
            const isQuickUpdating = quickActionId === job.id;
            const isDeleting = deleteLoadingId === job.id;
            const badgeStyle = statusBadgeStyle(job.verification_status);
            const salary = formatSalary(job);
            const companySlug = job.company?.slug;
            const publicJobUrl = companySlug
              ? `/hiring-companies/${companySlug}/jobs/${job.slug}`
              : "";

            return (
              <div
                key={job.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 16,
                  background: "#fafafa",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: "0 0 6px 0" }}>{job.title}</h3>
                    <div style={{ color: "#666", fontSize: 14 }}>
                      {getCompanyName(job)} / {getLocation(job) || "Location not listed"}
                    </div>
                  </div>
                  <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 8, fontWeight: 700, fontSize: 13, textTransform: "capitalize", ...badgeStyle }}>
                    {job.verification_status || "draft"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={smallBadgeStyle}>{getSponsorshipLabel(job.visa_sponsorship_status)}</span>
                  {job.is_featured && <span style={smallBadgeStyle}>Featured</span>}
                  {job.is_active ? <span style={smallBadgeStyle}>Active</span> : <span style={mutedBadgeStyle}>Inactive</span>}
                  {job.relocation_support && <span style={smallBadgeStyle}>Relocation support</span>}
                  {job.work_permit_support && <span style={smallBadgeStyle}>Work-permit support</span>}
                </div>

                <p><strong>Slug:</strong> {job.slug || "-"}</p>
                <p><strong>Country:</strong> {job.country || "-"}</p>
                <p><strong>Employment:</strong> {job.employment_type || "-"} / {job.work_mode || "-"}</p>
                <p><strong>Salary:</strong> {salary || "Salary not stated"}</p>
                <p><strong>Deadline:</strong> {formatDisplayDate(job.deadline) || "-"}</p>
                <p><strong>Last verified:</strong> {formatDisplayDate(job.last_verified) || "-"}</p>
                <p><strong>Official job URL:</strong>{" "}
                  {job.official_job_url ? <a href={job.official_job_url} target="_blank" rel="noreferrer">{job.official_job_url}</a> : "-"}
                </p>
                <p><strong>Application URL:</strong>{" "}
                  {job.application_url ? <a href={job.application_url} target="_blank" rel="noreferrer">{job.application_url}</a> : "-"}
                </p>
                {job.sponsorship_evidence && (
                  <p style={{ color: "#444", lineHeight: 1.6 }}>
                    <strong>Sponsorship evidence:</strong> {job.sponsorship_evidence}
                  </p>
                )}
                {job.description && (
                  <p style={{ color: "#444", lineHeight: 1.6 }}>{job.description}</p>
                )}

                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => startEdit(job)} style={primaryButtonStyle}>Edit</button>
                  {publicJobUrl && (
                    <Link href={publicJobUrl} target="_blank" rel="noreferrer" style={secondaryButtonStyle}>View Public Job</Link>
                  )}
                  <button onClick={() => updateJob(job, { is_featured: !job.is_featured })} disabled={isQuickUpdating || isDeleting} style={secondaryButtonStyle}>
                    {job.is_featured ? "Unfeature" : "Feature"}
                  </button>
                  <button onClick={() => updateJob(job, { is_active: !job.is_active })} disabled={isQuickUpdating || isDeleting} style={secondaryButtonStyle}>
                    {job.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => updateJob(job, { verification_status: "verified", is_active: true })} disabled={isQuickUpdating || isDeleting} style={secondaryButtonStyle}>
                    Mark Verified
                  </button>
                  <button onClick={() => updateJob(job, { verification_status: "expired", is_active: false })} disabled={isQuickUpdating || isDeleting} style={secondaryButtonStyle}>
                    Mark Expired
                  </button>
                  <button onClick={() => deleteJob(job)} disabled={isDeleting || isQuickUpdating} style={{ padding: "10px 14px", background: "#c62828", color: "white", border: "none", borderRadius: 8, cursor: isDeleting || isQuickUpdating ? "not-allowed" : "pointer", opacity: isDeleting || isQuickUpdating ? 0.7 : 1 }}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>{message}</div>;
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
} as const;

const checkboxGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 10,
} as const;

const checkboxStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 600,
} as const;

const textareaStyle = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
  lineHeight: 1.6,
} as const;

const dateLabelStyle = {
  display: "grid",
  gap: 6,
  color: "#555",
  fontSize: 13,
  fontWeight: 700,
} as const;

const warningBoxStyle = {
  background: "#fff8e5",
  border: "1px solid #efd38a",
  borderRadius: 10,
  color: "#654d08",
  fontWeight: 700,
  lineHeight: 1.6,
  padding: "12px 14px",
} as const;

const smallBadgeStyle = {
  display: "inline-block",
  padding: "6px 10px",
  background: "#eef5ff",
  color: "#1745aa",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
} as const;

const mutedBadgeStyle = {
  ...smallBadgeStyle,
  background: "#f1f5f9",
  color: "#475569",
} as const;
