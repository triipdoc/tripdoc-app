import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  availabilityStatusValues,
  generateOpportunitySlug,
  publishingStatusValues,
  validateProgramAdminPayload,
  verificationStatusValues,
} from "../../../../lib/opportunityPrograms";

type SortOption =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc"
  | "deadline-asc"
  | "deadline-desc"
  | "featured-first";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function normalizeSortOption(value: string | null): SortOption {
  switch (value) {
    case "oldest":
    case "title-asc":
    case "title-desc":
    case "deadline-asc":
    case "deadline-desc":
    case "featured-first":
    case "newest":
      return value;
    default:
      return "newest";
  }
}

function normalizeFilter(value: string | null, allowed: readonly string[]) {
  if (!value || value === "all") return null;
  return allowed.includes(value) ? value : null;
}

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeCountry(value: string) {
  const raw = value.trim().toLowerCase();

  const map: Record<string, string> = {
    uk: "United Kingdom",
    "u.k.": "United Kingdom",
    britain: "United Kingdom",
    england: "United Kingdom",
    usa: "United States",
    us: "United States",
    "u.s.a.": "United States",
    "u.s.": "United States",
    worldwide: "Global",
    international: "Global",
    global: "Global",
    "all round": "Global",
    commonwealth: "Multiple Countries",
    "commonwealth countries": "Multiple Countries",
    multiple: "Multiple Countries",
    multicountry: "Multiple Countries",
    "multi country": "Multiple Countries",
  };

  return map[raw] || toTitleCase(value);
}

function normalizeType(value: string) {
  const raw = value.trim().toLowerCase();

  const map: Record<string, string> = {
    scholarship: "Scholarship",
    scholarships: "Scholarship",
    internship: "Internship",
    internships: "Internship",
    fellowship: "Fellowship",
    fellowships: "Fellowship",
    research: "Research",
    job: "Job",
    jobs: "Job",
    volunteer: "Volunteer",
    volunteering: "Volunteer",
    conference: "Conference",
    grant: "Grant",
    grants: "Grant",
    programme: "Programme",
    program: "Programme",
    "exchange program": "Exchange Program",
    "exchange programme": "Exchange Program",
    training: "Training",
    "paid internship": "Internship",
    "research scientist intern": "Internship",
    "paid student programme": "Programme",
    "paid student program": "Programme",
    "daad scholarship fully": "Scholarship",
  };

  return map[raw] || toTitleCase(value);
}

function normalizeFunding(value: string) {
  const raw = value.trim().toLowerCase();

  const map: Record<string, string> = {
    "full funded": "Fully Funded",
    "fully funded": "Fully Funded",
    "fully-funded": "Fully Funded",
    "partial funded": "Partially Funded",
    "partially funded": "Partially Funded",
    funded: "Funded",
    paid: "Paid",
    unpaid: "Unpaid",
    stipend: "Stipend",
    "paid internship": "Paid",
    "paid professional program": "Paid",
    "paid professional programme": "Paid",
    "tuition waiver": "Tuition Waiver",
  };

  return map[raw] || toTitleCase(value);
}

function normalizeProgramBody(body: Record<string, unknown> | null) {
  return {
    ...(body || {}),
    country: normalizeText(body?.country)
      ? normalizeCountry(normalizeText(body?.country))
      : "",
    type: normalizeText(body?.type) ? normalizeType(normalizeText(body?.type)) : "",
    funding_type: normalizeText(body?.funding_type)
      ? normalizeFunding(normalizeText(body?.funding_type))
      : "",
  };
}

function toProgramWritePayload(payload: ReturnType<typeof validateProgramAdminPayload>["payload"]) {
  return {
    title: payload.title,
    slug: payload.slug,
    organisation: payload.organisation,
    country: payload.country,
    type: payload.type,
    funding_type: payload.funding_type,
    deadline: payload.deadline,
    deadline_mode: payload.deadline_mode,
    deadline_time: payload.deadline_time,
    deadline_timezone: payload.deadline_timezone,
    official_url: payload.official_url,
    additional_application_steps: payload.additional_application_steps,
    image_url: payload.image_url,
    image_alt: payload.image_alt,
    description: payload.description,
    publishing_status: payload.publishing_status,
    verification_status: payload.verification_status,
    availability_status: payload.availability_status,
    featured: payload.featured,
    funding_amount: payload.funding_amount,
    funding_currency: payload.funding_currency,
    funding_coverage: payload.funding_coverage,
    applicant_costs: payload.applicant_costs,
    official_source_links: payload.official_source_links,
    reviewer_name: payload.reviewer_name,
    verified_at: payload.verified_at,
    evidence_notes: payload.evidence_notes,
    private_reviewer_notes: payload.private_reviewer_notes,
    sponsorship_status: payload.sponsorship_status,
    sponsorship_evidence: payload.sponsorship_evidence,
    sponsorship_source_url: payload.sponsorship_source_url,
    seo_title: payload.seo_title,
    seo_description: payload.seo_description,
  };
}

export async function GET(req: NextRequest) {
  try {
    const search = normalizeText(req.nextUrl.searchParams.get("search"));
    const publishingStatus = normalizeFilter(
      req.nextUrl.searchParams.get("publishingStatus"),
      publishingStatusValues
    );
    const verificationStatus = normalizeFilter(
      req.nextUrl.searchParams.get("verificationStatus"),
      verificationStatusValues
    );
    const availabilityStatus = normalizeFilter(
      req.nextUrl.searchParams.get("availabilityStatus"),
      availabilityStatusValues
    );
    const deadlineView = normalizeText(req.nextUrl.searchParams.get("deadlineView"));
    const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInt(req.nextUrl.searchParams.get("pageSize"), 10),
      100
    );
    const sortBy = normalizeSortOption(req.nextUrl.searchParams.get("sortBy"));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin.from("programs").select("*", { count: "exact" });

    if (search) {
      const escaped = search.replace(/[%_]/g, "");
      query = query.or(
        [
          `title.ilike.%${escaped}%`,
          `slug.ilike.%${escaped}%`,
          `organisation.ilike.%${escaped}%`,
          `country.ilike.%${escaped}%`,
          `type.ilike.%${escaped}%`,
          `funding_type.ilike.%${escaped}%`,
          `verification_status.ilike.%${escaped}%`,
          `publishing_status.ilike.%${escaped}%`,
          `availability_status.ilike.%${escaped}%`,
        ].join(",")
      );
    }

    if (publishingStatus) query = query.eq("publishing_status", publishingStatus);
    if (verificationStatus) query = query.eq("verification_status", verificationStatus);
    if (availabilityStatus) query = query.eq("availability_status", availabilityStatus);

    if (deadlineView === "expired") {
      query = query.lt("deadline", new Date().toISOString().slice(0, 10));
    }

    switch (sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "title-asc":
        query = query.order("title", { ascending: true });
        break;
      case "title-desc":
        query = query.order("title", { ascending: false });
        break;
      case "deadline-asc":
        query = query.order("deadline", { ascending: true, nullsFirst: false });
        break;
      case "deadline-desc":
        query = query.order("deadline", { ascending: false, nullsFirst: false });
        break;
      case "featured-first":
        query = query
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Admin programs GET error:", error);
      return NextResponse.json({ error: "Failed to load programs." }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      programs: data || [],
      pagination: { page, pageSize, total, totalPages },
      filters: {
        search,
        sortBy,
        publishingStatus: publishingStatus || "all",
        verificationStatus: verificationStatus || "all",
        availabilityStatus: availabilityStatus || "all",
        deadlineView: deadlineView || "all",
      },
    });
  } catch (error) {
    console.error("Admin programs GET server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const normalizedBody = normalizeProgramBody(body);
    const validation = validateProgramAdminPayload(normalizedBody);
    const { payload, errors, warnings } = validation;
    payload.slug = payload.slug || generateOpportunitySlug(payload.title);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(" "), warnings },
        { status: 400 }
      );
    }

    const { data: existingSlug, error: slugCheckError } = await supabaseAdmin
      .from("programs")
      .select("id")
      .eq("slug", payload.slug)
      .limit(1);

    if (slugCheckError) {
      return NextResponse.json({ error: "Failed to validate slug." }, { status: 500 });
    }

    if (existingSlug && existingSlug.length > 0) {
      return NextResponse.json({ error: "This slug already exists." }, { status: 409 });
    }

    if (payload.country) {
      const { data: possibleDuplicates } = await supabaseAdmin
        .from("programs")
        .select("id,title,slug")
        .ilike("title", payload.title)
        .eq("country", payload.country)
        .limit(3);

      if (possibleDuplicates && possibleDuplicates.length > 0) {
        warnings.push("Possible duplicate opportunity found with the same title and country.");
      }
    }

    const writePayload = toProgramWritePayload(payload);

    const { data, error } = await supabaseAdmin
      .from("programs")
      .insert([writePayload])
      .select()
      .single();

    if (error) {
      console.error("Admin programs POST error:", error);
      return NextResponse.json({ error: "Failed to create program." }, { status: 500 });
    }

    await supabaseAdmin.from("program_change_history").insert({
      program_id: data.id,
      actor: "tripdoc-admin",
      action: "create",
      changed_fields: Object.keys(writePayload),
      new_values: writePayload,
    });

    return NextResponse.json({ success: true, program: data, warnings });
  } catch (error) {
    console.error("Admin programs POST server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
