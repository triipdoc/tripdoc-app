import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const { data, error } = await supabase
      .from("programs")
      .select("id, title, slug, country, type")
      .or(`title.ilike.%${q}%,country.ilike.%${q}%,type.ilike.%${q}%`)
      .eq("verification_status", "verified")
      .limit(8);

    if (error) {
      console.error("Search suggestion error:", error.message);
      return NextResponse.json({ suggestions: [] }, { status: 500 });
    }

    return NextResponse.json({
      suggestions: data ?? [],
    });
  } catch (error) {
    console.error("Unexpected search suggestion error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}