import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireAdmin } from "../../../../lib/requireAdmin";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req); if (denied) return denied;
  if (Number(req.headers.get("content-length")) > 4500000) return NextResponse.json({ error: "Choose an image under 4 MB." }, { status: 413 });
  try {
    const form = await req.formData(); const file = form.get("file");
    if (!(file instanceof File) || file.size > 4 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      return NextResponse.json({ error: "Choose a JPEG, PNG, WebP or AVIF under 4 MB." }, { status: 400 });
    }
    const input = Buffer.from(await file.arrayBuffer());
    // Decode and re-encode rather than trusting extension/MIME or storing SVG/HTML.
    const output = await sharp(input, { limitInputPixels: 40000000 }).rotate().resize({ width: 1600, height: 1000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const path = `programs/${crypto.randomUUID()}.webp`;
    const { error } = await supabaseAdmin.storage.from("program-images").upload(path, output, { contentType: "image/webp", upsert: false });
    if (error) return NextResponse.json({ error: "Image upload failed. Check the program-images storage bucket configuration." }, { status: 500 });
    const { data } = supabaseAdmin.storage.from("program-images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch { return NextResponse.json({ error: "Could not read this image. Try a smaller JPEG, PNG or WebP." }, { status: 400 }); }
}
