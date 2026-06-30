"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type VerificationStatus = "verified" | "pending" | "draft";

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
  verification_status: VerificationStatus | null;
  created_at: string | null;
};

type CompanyForm = {
  company_name: string;
  slug: string;
  country: string;
  industry: string;
  hiring_type: string;
  description: string;
  careers_url: string;
  logo_url: string;
  source_url: string;
  verification_notes: string;
  last_verified_at: string;
  visa_sponsorship: boolean;
  relocation_support: boolean;
  graduate_program: boolean;
  featured: boolean;
  verification_status: VerificationStatus;
};

type FormErrors = {
  company_name?: string;
  slug?: string;
  careers_url?: string;
  logo_url?: string;
  source_url?: string;
  last_verified_at?: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

const emptyForm: CompanyForm = {
  company_name: "",
  slug: "",
  country: "",
  industry: "",
  hiring_type: "",
  description: "",
  careers_url: "",
  logo_url: "",
  source_url: "",
  verification_notes: "",
  last_verified_at: "",
  visa_sponsorship: false,
  relocation_support: false,
  graduate_program: false,
  featured: false,
  verification_status: "verified",
};

const verificationStatusOptions: VerificationStatus[] = [
  "verified",
  "pending",
  "draft",
];

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

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function companyToForm(company: HiringCompany): CompanyForm {
  return {
    company_name: company.company_name || "",
    slug: company.slug || generateSlug(company.company_name || ""),
    country: company.country || "",
    industry: company.industry || "",
    hiring_type: company.hiring_type || "",
    description: company.description || "",
    careers_url: company.careers_url || "",
    logo_url: company.logo_url || "",
    source_url: company.source_url || "",
    verification_notes: company.verification_notes || "",
    last_verified_at: toDateInputValue(company.last_verified_at),
    visa_sponsorship: Boolean(company.visa_sponsorship),
    relocation_support: Boolean(company.relocation_support),
    graduate_program: Boolean(company.graduate_program),
    featured: Boolean(company.featured),
    verification_status: company.verification_status || "draft",
  };
}

function buildPayload(form: CompanyForm) {
  return {
    company_name: form.company_name.trim(),
    slug: generateSlug(form.slug || form.company_name),
    country: form.country.trim(),
    industry: form.industry.trim(),
    hiring_type: form.hiring_type.trim(),
    description: form.description.trim(),
    careers_url: form.careers_url.trim(),
    logo_url: form.logo_url.trim(),
    source_url: form.source_url.trim(),
    verification_notes: form.verification_notes.trim(),
    last_verified_at: form.last_verified_at,
    visa_sponsorship: form.visa_sponsorship,
    relocation_support: form.relocation_support,
    graduate_program: form.graduate_program,
    featured: form.featured,
    verification_status: form.verification_status,
  };
}

function validateForm(form: CompanyForm) {
  const errors: FormErrors = {};
  const slug = generateSlug(form.slug || form.company_name);

  if (!form.company_name.trim()) {
    errors.company_name = "Company name is required.";
  }

  if (!slug) {
    errors.slug = "Slug is required.";
  }

  if (form.careers_url.trim() && !isValidUrl(form.careers_url)) {
    errors.careers_url = "Careers URL must be a valid http/https link.";
  }

  if (form.logo_url.trim() && !isValidUrl(form.logo_url)) {
    errors.logo_url = "Logo URL must be a valid http/https link.";
  }

  if (form.source_url.trim() && !isValidUrl(form.source_url)) {
    errors.source_url = "Source URL must be a valid http/https link.";
  }

  if (
    form.last_verified_at.trim() &&
    Number.isNaN(new Date(`${form.last_verified_at}T00:00:00`).getTime())
  ) {
    errors.last_verified_at = "Last verified date is invalid.";
  }

  return errors;
}

function statusBadgeStyle(status?: VerificationStatus | null) {
  if (status === "verified") {
    return {
      background: "#edf8f0",
      color: "#1f6b37",
    };
  }

  if (status === "pending") {
    return {
      background: "#fff7e6",
      color: "#8a5a00",
    };
  }

  return {
    background: "#f1f5f9",
    color: "#475569",
  };
}

export default function HiringCompaniesAdminPage() {
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [companies, setCompanies] = useState<HiringCompany[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const loadCompanies = async ({
    searchValue = search,
    statusValue = statusFilter,
  }: {
    searchValue?: string;
    statusValue?: string;
  } = {}) => {
    try {
      setCompaniesLoading(true);

      const params = new URLSearchParams({
        search: searchValue,
        status: statusValue,
      });

      const res = await fetch(
        `/api/admin/hiring-companies?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: { companies?: HiringCompany[]; error?: string } =
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
      console.error("Hiring companies fetch failed:", error);
      setNotice({ type: "error", message: "Could not load hiring companies." });
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadCompanies({ searchValue: search, statusValue: statusFilter });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search, statusFilter]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
    setFormErrors({});
  }

  function updateForm<K extends keyof CompanyForm>(
    key: K,
    value: CompanyForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCompanyNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      company_name: value,
      slug: !editingId && !slugTouched ? generateSlug(value) : prev.slug,
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    updateForm("slug", generateSlug(value));
  }

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
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
        ? `/api/admin/hiring-companies/${editingId}`
        : "/api/admin/hiring-companies";

      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload(form)),
      });

      const result: { company?: HiringCompany; error?: string } =
        await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Could not save hiring company.",
        });
        return;
      }

      setNotice({
        type: "success",
        message: editingId
          ? "Hiring company updated."
          : "Hiring company created.",
      });
      resetForm();
      await loadCompanies({ searchValue: search, statusValue: statusFilter });
    } catch (error) {
      console.error("Hiring company save failed:", error);
      setNotice({ type: "error", message: "Could not save hiring company." });
    } finally {
      setLoading(false);
    }
  }

  function startEdit(company: HiringCompany) {
    setForm(companyToForm(company));
    setEditingId(company.id);
    setSlugTouched(true);
    setFormErrors({});
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateCompany(
    company: HiringCompany,
    updates: Partial<CompanyForm>
  ) {
    setQuickActionId(company.id);
    setNotice(null);

    try {
      const mergedForm = {
        ...companyToForm(company),
        ...updates,
      };

      const res = await fetch(`/api/admin/hiring-companies/${company.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload(mergedForm)),
      });

      const result: { error?: string } = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Could not update hiring company.",
        });
        return;
      }

      await loadCompanies({ searchValue: search, statusValue: statusFilter });
    } catch (error) {
      console.error("Hiring company quick update failed:", error);
      setNotice({ type: "error", message: "Could not update hiring company." });
    } finally {
      setQuickActionId(null);
    }
  }

  async function deleteCompany(company: HiringCompany) {
    const confirmed = window.confirm(
      `Delete ${company.company_name}? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteLoadingId(company.id);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/hiring-companies/${company.id}`, {
        method: "DELETE",
      });

      const result: { error?: string } = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Could not delete hiring company.",
        });
        return;
      }

      if (editingId === company.id) {
        resetForm();
      }

      setNotice({ type: "success", message: "Hiring company deleted." });
      await loadCompanies({ searchValue: search, statusValue: statusFilter });
    } catch (error) {
      console.error("Hiring company delete failed:", error);
      setNotice({ type: "error", message: "Could not delete hiring company." });
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
          <h1 style={{ marginBottom: 12 }}>Hiring Companies Admin</h1>
          <p style={{ color: "#666", marginTop: 0 }}>
            Add, edit, and verify company career pages for the public hiring hub.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/manage-tripdoc" style={secondaryButtonStyle}>
            Program Admin
          </Link>
          <Link
            href="/hiring-companies"
            target="_blank"
            rel="noreferrer"
            style={secondaryButtonStyle}
          >
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
        onSubmit={saveCompany}
        style={{
          display: "grid",
          gap: 14,
          maxWidth: 860,
          marginBottom: 34,
          ...sectionCardStyle,
        }}
      >
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>
            {editingId ? "Edit Hiring Company" : "Add Hiring Company"}
          </h2>
          <p style={{ color: "#666", marginTop: 0, marginBottom: 10 }}>
            Company name and slug are required. All other fields can be refined
            over time.
          </p>
        </div>

        <div>
          <input
            placeholder="Company name"
            value={form.company_name}
            onChange={(event) => handleCompanyNameChange(event.target.value)}
            style={inputStyle}
          />
          {formErrors.company_name && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.company_name}
            </div>
          )}
        </div>

        <div>
          <input
            placeholder="Slug"
            value={form.slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            style={inputStyle}
          />
          {formErrors.slug && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.slug}
            </div>
          )}
          <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
            Public card slug: {form.slug || "company-slug"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <input
            placeholder="Country"
            value={form.country}
            onChange={(event) => updateForm("country", event.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Industry"
            value={form.industry}
            onChange={(event) => updateForm("industry", event.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Hiring type"
            value={form.hiring_type}
            onChange={(event) => updateForm("hiring_type", event.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <input
            placeholder="Careers URL"
            value={form.careers_url}
            onChange={(event) => updateForm("careers_url", event.target.value)}
            style={inputStyle}
          />
          {formErrors.careers_url && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.careers_url}
            </div>
          )}
        </div>

        <div>
          <input
            placeholder="Logo URL"
            value={form.logo_url}
            onChange={(event) => updateForm("logo_url", event.target.value)}
            style={inputStyle}
          />
          {formErrors.logo_url && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.logo_url}
            </div>
          )}
        </div>

        <div>
          <input
            placeholder="Official source URL"
            value={form.source_url}
            onChange={(event) => updateForm("source_url", event.target.value)}
            style={inputStyle}
          />
          {formErrors.source_url && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.source_url}
            </div>
          )}
        </div>

        <div>
          <label
            style={{
              display: "block",
              color: "#555",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Last verified date
          </label>
          <input
            type="date"
            value={form.last_verified_at}
            onChange={(event) =>
              updateForm("last_verified_at", event.target.value)
            }
            style={inputStyle}
          />
          {formErrors.last_verified_at && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.last_verified_at}
            </div>
          )}
        </div>

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(event) => updateForm("description", event.target.value)}
          style={{
            ...inputStyle,
            minHeight: 150,
            resize: "vertical",
            lineHeight: 1.6,
          }}
        />

        <textarea
          placeholder="Verification notes"
          value={form.verification_notes}
          onChange={(event) =>
            updateForm("verification_notes", event.target.value)
          }
          style={{
            ...inputStyle,
            minHeight: 110,
            resize: "vertical",
            lineHeight: 1.6,
          }}
        />

        <select
          value={form.verification_status}
          onChange={(event) =>
            updateForm(
              "verification_status",
              event.target.value as VerificationStatus
            )
          }
          style={inputStyle}
        >
          {verificationStatusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          {[
            {
              key: "visa_sponsorship" as const,
              label: "Visa sponsorship signal",
            },
            {
              key: "relocation_support" as const,
              label: "Relocation support signal",
            },
            {
              key: "graduate_program" as const,
              label: "Graduate program",
            },
            {
              key: "featured" as const,
              label: "Featured",
            },
          ].map((item) => (
            <label
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(form[item.key])}
                onChange={(event) => updateForm(item.key, event.target.checked)}
              />
              {item.label}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 16px",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontWeight: 700,
            }}
          >
            {loading
              ? "Saving..."
              : editingId
              ? "Update Company"
              : "Create Company"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={secondaryButtonStyle}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 12,
          }}
        >
          <input
            placeholder="Search by company name, country, or industry"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={inputStyle}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All statuses</option>
            {verificationStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>All Hiring Companies</h2>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 16 }}>
        Showing {companies.length} hiring compan
        {companies.length === 1 ? "y" : "ies"}
      </p>

      {companiesLoading ? (
        <div style={{ ...sectionCardStyle, color: "#666" }}>
          Loading hiring companies...
        </div>
      ) : companies.length === 0 ? (
        <div style={{ ...sectionCardStyle, color: "#666" }}>
          No hiring companies found for the current filters.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {companies.map((company) => {
            const isQuickUpdating = quickActionId === company.id;
            const isDeleting = deleteLoadingId === company.id;
            const badgeStyle = statusBadgeStyle(company.verification_status);

            return (
              <div
                key={company.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 16,
                  background: "#fafafa",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={`${company.company_name} logo`}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        objectFit: "contain",
                        background: "#fff",
                        padding: 6,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "#eef5ff",
                        display: "grid",
                        placeItems: "center",
                        color: "#2952d5",
                        fontWeight: 800,
                        fontSize: 20,
                      }}
                    >
                      {company.company_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: "0 0 6px 0" }}>
                      {company.company_name}
                    </h3>
                    <div style={{ color: "#666", fontSize: 14 }}>
                      {company.country || "-"} / {company.industry || "-"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      textTransform: "capitalize",
                      ...badgeStyle,
                    }}
                  >
                    {company.verification_status || "draft"}
                  </span>
                  {company.featured && (
                    <span style={smallBadgeStyle}>Featured</span>
                  )}
                  {company.visa_sponsorship && (
                    <span style={smallBadgeStyle}>Visa sponsorship signal</span>
                  )}
                  {company.relocation_support && (
                    <span style={smallBadgeStyle}>Relocation support signal</span>
                  )}
                  {company.graduate_program && (
                    <span style={smallBadgeStyle}>Graduate program</span>
                  )}
                  {company.hiring_type && (
                    <span style={smallBadgeStyle}>{company.hiring_type}</span>
                  )}
                </div>

                <p>
                  <strong>Slug:</strong> {company.slug || "-"}
                </p>
                <p>
                  <strong>Careers URL:</strong>{" "}
                  {company.careers_url ? (
                    <a href={company.careers_url} target="_blank" rel="noreferrer">
                      {company.careers_url}
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
                <p>
                  <strong>Official source:</strong>{" "}
                  {company.source_url ? (
                    <a href={company.source_url} target="_blank" rel="noreferrer">
                      {company.source_url}
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
                <p>
                  <strong>Last verified:</strong>{" "}
                  {formatDate(company.last_verified_at)}
                </p>
                <p>
                  <strong>Created:</strong> {formatDate(company.created_at)}
                </p>
                {company.verification_notes && (
                  <p style={{ color: "#444", lineHeight: 1.6 }}>
                    <strong>Verification notes:</strong>{" "}
                    {company.verification_notes}
                  </p>
                )}
                {company.description && (
                  <p style={{ color: "#444", lineHeight: 1.6 }}>
                    {company.description}
                  </p>
                )}

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => startEdit(company)}
                    style={{
                      padding: "10px 14px",
                      background: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      updateCompany(company, {
                        featured: !company.featured,
                      })
                    }
                    disabled={isQuickUpdating || isDeleting}
                    style={secondaryButtonStyle}
                  >
                    {company.featured ? "Unfeature" : "Feature"}
                  </button>

                  <button
                    onClick={() =>
                      updateCompany(company, {
                        visa_sponsorship: !company.visa_sponsorship,
                      })
                    }
                    disabled={isQuickUpdating || isDeleting}
                    style={secondaryButtonStyle}
                  >
                    {company.visa_sponsorship
                      ? "Remove Visa Signal"
                      : "Add Visa Signal"}
                  </button>

                  <button
                    onClick={() =>
                      updateCompany(company, {
                        relocation_support: !company.relocation_support,
                      })
                    }
                    disabled={isQuickUpdating || isDeleting}
                    style={secondaryButtonStyle}
                  >
                    {company.relocation_support
                      ? "Remove Relocation Signal"
                      : "Add Relocation Signal"}
                  </button>

                  <button
                    onClick={() =>
                      updateCompany(company, {
                        graduate_program: !company.graduate_program,
                      })
                    }
                    disabled={isQuickUpdating || isDeleting}
                    style={secondaryButtonStyle}
                  >
                    {company.graduate_program
                      ? "Remove Graduate"
                      : "Add Graduate"}
                  </button>

                  <button
                    onClick={() => deleteCompany(company)}
                    disabled={isDeleting || isQuickUpdating}
                    style={{
                      padding: "10px 14px",
                      background: "#c62828",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor:
                        isDeleting || isQuickUpdating
                          ? "not-allowed"
                          : "pointer",
                      opacity: isDeleting || isQuickUpdating ? 0.7 : 1,
                    }}
                  >
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

const smallBadgeStyle = {
  display: "inline-block",
  padding: "6px 10px",
  background: "#eef5ff",
  color: "#1745aa",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
} as const;
