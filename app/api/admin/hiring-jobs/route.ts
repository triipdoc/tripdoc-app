import { NextRequest, NextResponse } from "next/server";
import {
  generateSlug,
  JOB_VERIFICATION_STATUSES,
  SPONSORSHIP_STATUSES,
  type JobVerificationStatus,
  type SponsorshipStatus,
} from "../../../../lib/hiringCompanyJobs";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

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
    if (!payload.is_active) {
      return "A verified job must be active.";
    }

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
  excludeId?: string
) {
  let slugQuery = supabaseAdmin
    .from("hiring_company_jobs")
    .select("id, title")
    .eq("company_id", payload.company_id)
    .eq("slug", payload.slug)
    .limit(1);

  if (excludeId) slugQuery = slugQuery.neq("id", excludeId);

  const { data: slugMatch, error: slugError } = await slugQuery;
  if (slugError) throw slugError;
  if (slugMatch && slugMatch.length > 0) return "A job with this slug already exists for this company.";

  if (payload.official_job_url) {
    let urlQuery = supabaseAdmin
      .from("hiring_company_jobs")
      .select("id, title")
      .eq("company_id", payload.company_id)
      .eq("official_job_url", payload.official_job_url)
      .limit(1);

    if (excludeId) urlQuery = urlQuery.neq("id", excludeId);

    const { data: urlMatch, error: urlError } = await urlQuery;
    if (urlError) throw urlError;
    if (urlMatch && urlMatch.length > 0) {
      return "Possible duplicate: this official job URL is already listed for this company.";
    }
  }

  if (payload.title && payload.location) {
    let titleQuery = supabaseAdmin
      .from("hiring_company_jobs")
      .select("id, title")
      .eq("company_id", payload.company_id)
      .ilike("title", payload.title)
      .ilike("location", payload.location)
      .limit(1);

    if (excludeId) titleQuery = titleQuery.neq("id", excludeId);

    const { data: titleMatch, error: titleError } = await titleQuery;
    if (titleError) throw titleError;
    if (titleMatch && titleMatch.length > 0) {
      return "Possible duplicate: a similar title and location already exist for this company.";
    }
  }

  return "";
}

export async function GET(req: NextRequest) {
  try {
    const search = normalizeText(req.nextUrl.searchParams.get("search"));
    const country = normalizeText(req.nextUrl.searchParams.get("country"));
    const companyId = normalizeText(req.nextUrl.searchParams.get("company_id"));
    const sponsorshipStatus = normalizeText(
      req.nextUrl.searchParams.get("sponsorship_status")
    );
    const verificationStatus = normalizeText(
      req.nextUrl.searchParams.get("verification_status")
    );
    const sort = normalizeText(req.nextUrl.searchParams.get("sort"));

    let query = supabaseAdmin
      .from("hiring_company_jobs")
      .select(
        "*, company:hiring_companies(id, company_name, slug, country, industry)"
      );

    if (search) {
      const escaped = search.replace(/[%,_]/g, "");
      query = query.or(
        [
          `title.ilike.%${escaped}%`,
          `country.ilike.%${escaped}%`,
          `city.ilike.%${escaped}%`,
          `location.ilike.%${escaped}%`,
        ].join(",")
      );
    }

    if (country && country !== "all") query = query.eq("country", country);
    if (companyId && companyId !== "all") query = query.eq("company_id", companyId);
    if (sponsorshipStatus && sponsorshipStatus !== "all") {
      query = query.eq("visa_sponsorship_status", sponsorshipStatus);
    }
    if (verificationStatus && verificationStatus !== "all") {
      query = query.eq("verification_status", verificationStatus);
    }

    if (sort === "deadline-desc") {
      query = query.order("deadline", { ascending: false, nullsFirst: false });
    } else if (sort === "deadline-asc") {
      query = query.order("deadline", { ascending: true, nullsFirst: false });
    } else if (sort === "featured-first") {
      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Admin hiring jobs GET error:", error);
      return NextResponse.json(
        { error: "Failed to load hiring jobs." },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs: data || [] });
  } catch (error) {
    console.error("Admin hiring jobs GET server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const payload = buildPayload((body || {}) as Record<string, unknown>);
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const duplicateMessage = await findDuplicate(payload);
    if (duplicateMessage) {
      return NextResponse.json({ error: duplicateMessage }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("hiring_company_jobs")
      .insert([payload])
      .select("*, company:hiring_companies(id, company_name, slug, country, industry)")
      .single();

    if (error) {
      console.error("Admin hiring job POST error:", error);
      return NextResponse.json(
        { error: "Failed to create hiring job." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, job: data });
  } catch (error) {
    console.error("Admin hiring job POST server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
