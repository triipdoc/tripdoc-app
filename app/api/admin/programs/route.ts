import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type VerificationStatus = "verified" | "pending";
type SortOption =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc"
  | "deadline-asc"
  | "deadline-desc"
  | "featured-first";

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

export async function GET(req: NextRequest) {
  try {
    const search = normalizeText(req.nextUrl.searchParams.get("search"));
    const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInt(req.nextUrl.searchParams.get("pageSize"), 10),
      100
    );
    const sortBy = normalizeSortOption(req.nextUrl.searchParams.get("sortBy"));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("programs")
      .select("*", { count: "exact" });

    if (search) {
      const escaped = search.replace(/[%_]/g, "");
      query = query.or(
        [
          `title.ilike.%${escaped}%`,
          `slug.ilike.%${escaped}%`,
          `country.ilike.%${escaped}%`,
          `type.ilike.%${escaped}%`,
          `funding_type.ilike.%${escaped}%`,
          `verification_status.ilike.%${escaped}%`,
        ].join(",")
      );
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
      return NextResponse.json(
        { error: "Failed to load programs." },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      programs: data || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      filters: {
        search,
        sortBy,
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

    const title = normalizeText(body?.title);
    const slugInput = normalizeText(body?.slug);
    const slug = generateSlug(slugInput || title);
    const country = normalizeText(body?.country);
    const type = normalizeText(body?.type);
    const fundingType = normalizeText(body?.funding_type);
    const deadline = normalizeText(body?.deadline);
    const officialUrl = normalizeText(body?.official_url);
    const imageUrl = normalizeText(body?.image_url);
    const description = normalizeText(body?.description);
    const verificationStatus = normalizeText(
      body?.verification_status
    ) as VerificationStatus;
    const featured = Boolean(body?.featured);

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    if (!country) {
      return NextResponse.json(
        { error: "Country is required." },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json({ error: "Type is required." }, { status: 400 });
    }

    if (
      verificationStatus !== "verified" &&
      verificationStatus !== "pending"
    ) {
      return NextResponse.json(
        { error: "Verification status must be verified or pending." },
        { status: 400 }
      );
    }

    if (officialUrl && !isValidUrl(officialUrl)) {
      return NextResponse.json(
        { error: "Official URL must be a valid http/https link." },
        { status: 400 }
      );
    }

    if (imageUrl && !isValidUrl(imageUrl)) {
      return NextResponse.json(
        { error: "Image URL must be a valid http/https link." },
        { status: 400 }
      );
    }

    const { data: existingSlug, error: slugCheckError } = await supabaseAdmin
      .from("programs")
      .select("id")
      .eq("slug", slug)
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
      .from("programs")
      .insert([
        {
          title,
          slug,
          country,
          type,
          funding_type: fundingType || null,
          deadline: deadline || null,
          official_url: officialUrl || null,
          image_url: imageUrl || null,
          description: description || null,
          verification_status: verificationStatus,
          featured,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Admin programs POST error:", error);
      return NextResponse.json(
        { error: "Failed to create program." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, program: data });
  } catch (error) {
    console.error("Admin programs POST server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}