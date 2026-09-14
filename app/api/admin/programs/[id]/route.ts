import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import {
  generateOpportunitySlug,
  isPublicProgramDetailVisible,
  validateProgramAdminPayload,
} from "../../../../../lib/opportunityPrograms";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function changedFields(previous: Record<string, unknown>, next: Record<string, unknown>) {
  return Object.keys(next).filter((key) => {
    return JSON.stringify(previous[key] ?? null) !== JSON.stringify(next[key] ?? null);
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    if (!id) {
      return NextResponse.json({ error: "Program ID is required." }, { status: 400 });
    }

    const { data: existingProgram, error: existingError } = await supabaseAdmin
      .from("programs")
      .select("*")
      .eq("id", id)
      .single();

    if (existingError || !existingProgram) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 });
    }

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
      .neq("id", id)
      .limit(1);

    if (slugCheckError) {
      return NextResponse.json({ error: "Failed to validate slug." }, { status: 500 });
    }

    if (existingSlug && existingSlug.length > 0) {
      return NextResponse.json({ error: "This slug already exists." }, { status: 409 });
    }

    const writePayload = toProgramWritePayload(payload);
    const fields = changedFields(existingProgram, writePayload);

    const { data, error } = await supabaseAdmin
      .from("programs")
      .update(writePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Admin program PATCH error:", error);
      return NextResponse.json({ error: "Failed to update program." }, { status: 500 });
    }

    if (
      existingProgram.slug &&
      existingProgram.slug !== payload.slug &&
      isPublicProgramDetailVisible(existingProgram)
    ) {
      await supabaseAdmin.from("program_slug_redirects").upsert(
        {
          old_slug: existingProgram.slug,
          program_id: id,
        },
        { onConflict: "old_slug" }
      );
    }

    if (fields.length > 0) {
      await supabaseAdmin.from("program_change_history").insert({
        program_id: id,
        actor: "tripdoc-admin",
        action: "update",
        changed_fields: fields,
        previous_values: Object.fromEntries(
          fields.map((field) => [field, existingProgram[field] ?? null])
        ),
        new_values: Object.fromEntries(fields.map((field) => [field, writePayload[field]])),
      });
    }

    return NextResponse.json({ success: true, program: data, warnings });
  } catch (error) {
    console.error("Admin program PATCH server error:", error);
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
      return NextResponse.json({ error: "Program ID is required." }, { status: 400 });
    }

    const { data: existingProgram } = await supabaseAdmin
      .from("programs")
      .select("*")
      .eq("id", id)
      .single();

    if (existingProgram) {
      await supabaseAdmin.from("program_change_history").insert({
        program_id: id,
        actor: "tripdoc-admin",
        action: "delete",
        changed_fields: Object.keys(existingProgram),
        previous_values: existingProgram,
      });
    }

    const { error } = await supabaseAdmin.from("programs").delete().eq("id", id);

    if (error) {
      console.error("Admin program DELETE error:", error);
      return NextResponse.json({ error: "Failed to delete program." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin program DELETE server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
