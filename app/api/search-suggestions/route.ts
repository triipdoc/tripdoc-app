import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { isPublicProgramListVisible } from "../../../lib/opportunityPrograms";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const { data, error } = await supabase
      .from("program_public_view")
      .select("id,title,slug,country,type,publishing_status,availability_status,deadline,deadline_mode,deadline_time,deadline_timezone")
      .or(`title.ilike.%${q}%,country.ilike.%${q}%,type.ilike.%${q}%`)
      .eq("publishing_status", "published")
      .limit(8);

    if (error) {
      console.error("Search suggestion error:", error.message);
      return NextResponse.json({ suggestions: [] }, { status: 500 });
    }

    return NextResponse.json({
      suggestions: (data ?? []).filter((program) => isPublicProgramListVisible(program)),
    });
  } catch (error) {
    console.error("Unexpected search suggestion error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
