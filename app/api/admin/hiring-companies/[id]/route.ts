import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

type VerificationStatus = "verified" | "pending" | "draft";

const VERIFICATION_STATUSES: VerificationStatus[] = [
  "verified",
  "pending",
  "draft",
];

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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableText(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function normalizeTimestamp(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(text);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeVerificationStatus(value: unknown): VerificationStatus {
  const status = normalizeText(value) as VerificationStatus;
  return VERIFICATION_STATUSES.includes(status) ? status : "draft";
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    const companyName = normalizeText(body?.company_name);
    const slug = generateSlug(normalizeText(body?.slug) || companyName);
    const careersUrl = normalizeText(body?.careers_url);
    const logoUrl = normalizeText(body?.logo_url);
    const sourceUrl = normalizeText(body?.source_url);
    const lastVerifiedAt = normalizeTimestamp(body?.last_verified_at);
    const verificationStatus = normalizeVerificationStatus(
      body?.verification_status
    );

    if (!id) {
      return NextResponse.json(
        { error: "Hiring company ID is required." },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    if (careersUrl && !isValidUrl(careersUrl)) {
      return NextResponse.json(
        { error: "Careers URL must be a valid http/https link." },
        { status: 400 }
      );
    }

    if (logoUrl && !isValidUrl(logoUrl)) {
      return NextResponse.json(
        { error: "Logo URL must be a valid http/https link." },
        { status: 400 }
      );
    }

    if (sourceUrl && !isValidUrl(sourceUrl)) {
      return NextResponse.json(
        { error: "Source URL must be a valid http/https link." },
        { status: 400 }
      );
    }

    if (lastVerifiedAt === "") {
      return NextResponse.json(
        { error: "Last verified date is invalid." },
        { status: 400 }
      );
    }

    const { data: existingSlug, error: slugCheckError } = await supabaseAdmin
      .from("hiring_companies")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .limit(1);

    if (slugCheckError) {
      return NextResponse.json(
        { error: "Failed to validate slug." },
        { status: 500 }
      );
    }

    if (existingSlug && existingSlug.length > 0) {
      return NextResponse.json(
        { error: "This slug already exists." },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("hiring_companies")
      .update({
        company_name: companyName,
        slug,
        country: normalizeNullableText(body?.country),
        industry: normalizeNullableText(body?.industry),
        hiring_type: normalizeNullableText(body?.hiring_type),
        description: normalizeNullableText(body?.description),
        careers_url: careersUrl || null,
        logo_url: logoUrl || null,
        source_url: sourceUrl || null,
        verification_notes: normalizeNullableText(body?.verification_notes),
        last_verified_at: lastVerifiedAt,
        visa_sponsorship: Boolean(body?.visa_sponsorship),
        relocation_support: Boolean(body?.relocation_support),
        graduate_program: Boolean(body?.graduate_program),
        featured: Boolean(body?.featured),
        verification_status: verificationStatus,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Admin hiring company PATCH error:", error);
      return NextResponse.json(
        { error: "Failed to update hiring company." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, company: data });
  } catch (error) {
    console.error("Admin hiring company PATCH server error:", error);
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
        { error: "Hiring company ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("hiring_companies")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Admin hiring company DELETE error:", error);
      return NextResponse.json(
        { error: "Failed to delete hiring company." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin hiring company DELETE server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
