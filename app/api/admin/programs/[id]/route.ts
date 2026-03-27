import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

type VerificationStatus = "verified" | "pending";

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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    if (!id) {
      return NextResponse.json(
        { error: "Program ID is required." },
        { status: 400 }
      );
    }

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
      .from("programs")
      .update({
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
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Admin program PATCH error:", error);
      return NextResponse.json(
        { error: "Failed to update program." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, program: data });
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
      return NextResponse.json(
        { error: "Program ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("programs").delete().eq("id", id);

    if (error) {
      console.error("Admin program DELETE error:", error);
      return NextResponse.json(
        { error: "Failed to delete program." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin program DELETE server error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}