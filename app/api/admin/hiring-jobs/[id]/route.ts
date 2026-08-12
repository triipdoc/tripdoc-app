import { NextRequest, NextResponse } from "next/server";
import {
  generateSlug,
  JOB_VERIFICATION_STATUSES,
  SPONSORSHIP_STATUSES,
  type JobVerificationStatus,
  type SponsorshipStatus,
} from "../../../../../lib/hiringCompanyJobs";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableText(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function normalizeBoolean(value: unknown) {
  return Boolean(value);
}

function normalizeDate(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;

  const date = new Date(`${text.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? "" : text.slice(0, 10);
}

function normalizeTimestamp(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(text);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeSponsorshipStatus(value: unknown): SponsorshipStatus {
  const status = normalizeText(value) as SponsorshipStatus;
  return SPONSORSHIP_STATUSES.includes(status) ? status : "unclear";
}

function normalizeVerificationStatus(value: unknown): JobVerificationStatus {
  const status = normalizeText(value) as JobVerificationStatus;
  return JOB_VERIFICATION_STATUSES.includes(status) ? status : "draft";
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

function buildPayload(body: Record<string, unknown>) {
  const title = normalizeText(body?.title);
  const slug = generateSlug(normalizeText(body?.slug) || title);
  const officialJobUrl = normalizeText(body?.official_job_url);
  const applicationUrl = normalizeText(body?.application_url);
  const sponsorshipSourceUrl = normalizeText(body?.sponsorship_source_url);
  const sponsorshipStatus = normalizeSponsorshipStatus(
    body?.visa_sponsorship_status
  );
  const verificationStatus = normalizeVerificationStatus(
    body?.verification_status
  );
  const postedDate = normalizeDate(body?.posted_date);
  const deadline = normalizeDate(body?.deadline);
  const lastVerified = normalizeTimestamp(body?.last_verified);

  return {
    company_id: normalizeText(body?.company_id),
    title,
    slug,
    country: normalizeNullableText(body?.country),
    city: normalizeNullableText(body?.city),
    location: normalizeNullableText(body?.location),
    employment_type: normalizeNullableText(body?.employment_type),
    work_mode: normalizeNullableText(body?.work_mode),
    salary: normalizeNullableText(body?.salary),
    salary_currency: normalizeNullableText(body?.salary_currency),
    salary_period: normalizeNullableText(body?.salary_period),
    description: normalizeNullableText(body?.description),
    eligibility: normalizeNullableText(body?.eligibility),
    experience_required: normalizeNullableText(body?.experience_required),
    language_requirements: normalizeNullableText(body?.language_requirements),
    visa_sponsorship_status: sponsorshipStatus,
    sponsorship_evidence: normalizeNullableText(body?.sponsorship_evidence),
    sponsorship_source_url: sponsorshipSourceUrl || null,
    relocation_support: normalizeBoolean(body?.relocation_support),
    work_permit_support: normalizeBoolean(body?.work_permit_support),
    official_job_url: officialJobUrl || null,
    application_url: applicationUrl || null,
    official_source: normalizeNullableText(body?.official_source),
    posted_date: postedDate,
    deadline,
    last_verified: lastVerified,
    verification_status: verificationStatus,
    verification_notes: normalizeNullableText(body?.verification_notes),
    risk_notes: normalizeNullableText(body?.risk_notes),
    is_active: body?.is_active === undefined ? true : normalizeBoolean(body?.is_active),
    is_featured: normalizeBoolean(body?.is_featured),
    updated_at: new Date().toISOString(),
  };
}

function validatePayload(payload: ReturnType<typeof buildPayload>) {
  if (!payload.company_id) return "A hiring company is required.";
  if (!payload.title) return "Job title is required.";
  if (!payload.slug) return "Slug is required.";

  const urls = [
    ["Official job URL", payload.official_job_url],
    ["Application URL", payload.application_url],
    ["Sponsorship source URL", payload.sponsorship_source_url],
  ] as const;

  for (const [label, url] of urls) {
    if (url && !isValidUrl(url)) {
      return `${label} must be a valid http/https link.`;
    }
  }

  if (payload.posted_date === "") return "Posted date is invalid.";
  if (payload.deadline === "") return "Deadline is invalid.";
  if (payload.last_verified === "") return "Last verified date is invalid.";

  if (payload.verification_status === "verified") {
    if (!payload.is_active) return "A verified job must be active.";
    if (!payload.official_job_url) {
      return "Verified jobs require an official employer or government vacancy URL.";
    }
    if (!payload.application_url) {
      return "Verified jobs require an official application URL.";
    }
    if (!payload.country && !payload.location) {
      return "Verified jobs require a country or location.";
    }
    if (
      payload.visa_sponsorship_status === "unclear" ||
      payload.visa_sponsorship_status === "none"
    ) {
      return "Verified public jobs require documented sponsorship or work-permit support status.";
    }
    if (!payload.sponsorship_evidence) {
      return "Verified jobs require concise sponsorship evidence.";
    }
    if (!payload.last_verified) {
      return "Verified jobs require a last verified date.";
    }
  }

  if (
    payload.verification_status === "verified" &&
    payload.visa_sponsorship_status === "explicit" &&
    !payload.sponsorship_source_url
  ) {
    return "Explicit sponsorship requires a sponsorship evidence source URL.";
  }

  return "";
}

async function findDuplicate(
  payload: ReturnType<typeof buildPayload>,
  excludeId: string
) {
  const slugQuery = supabaseAdmin
    .from("hiring_company_jobs")
    .select("id, title")
    .eq("company_id", payload.company_id)
    .eq("slug", payload.slug)
    .neq("id", excludeId)
    .limit(1);

  const { data: slugMatch, error: slugError } = await slugQuery;
  if (slugError) throw slugError;
  if (slugMatch && slugMatch.length > 0) return "A job with this slug already exists for this company.";

  if (payload.official_job_url) {
    const { data: urlMatch, error: urlError } = await supabaseAdmin
      .from("hiring_company_jobs")
      .select("id, title")
      .eq("company_id", payload.company_id)
      .eq("official_job_url", payload.official_job_url)
      .neq("id", excludeId)
      .limit(1);

    if (urlError) throw urlError;
    if (urlMatch && urlMatch.length > 0) {
      return "Possible duplicate: this official job URL is already listed for this company.";
    }
  }

  if (payload.title && payload.location) {
    const { data: titleMatch, error: titleError } = await supabaseAdmin
      .from("hiring_company_jobs")
      .select("id, title")
      .eq("company_id", payload.company_id)
      .ilike("title", payload.title)
      .ilike("location", payload.location)
      .neq("id", excludeId)
      .limit(1);

    if (titleError) throw titleError;
    if (titleMatch && titleMatch.length > 0) {
      return "Possible duplicate: a similar title and location already exist for this company.";
    }
  }

  return "";
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const payload = buildPayload((body || {}) as Record<string, unknown>);

    if (!id) {
      return NextResponse.json(
        { error: "Hiring job ID is required." },
        { status: 400 }
      );
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const duplicateMessage = await findDuplicate(payload, id);
    if (duplicateMessage) {
      return NextResponse.json({ error: duplicateMessage }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("hiring_company_jobs")
      .update(payload)
      .eq("id", id)
      .select("*, company:hiring_companies(id, company_name, slug, country, industry)")
      .single();

    if (error) {
      console.error("Admin hiring job PATCH error:", error);
      return NextResponse.json(
        { error: "Failed to update hiring job." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, job: data });
  } catch (error) {
    console.error("Admin hiring job PATCH server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Hiring job ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("hiring_company_jobs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Admin hiring job DELETE error:", error);
      return NextResponse.json(
        { error: "Failed to delete hiring job." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin hiring job DELETE server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
