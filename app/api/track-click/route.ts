import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { program_id, action } = body;

    console.log("track-click payload:", { program_id, action });

    if (!program_id || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!["apply_now", "copy_link", "open_detail"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("clicks")
      .insert([
        {
          program_id,
          action,
        },
      ])
      .select();

    if (error) {
      console.error("Insert error full:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    console.log("track-click insert success:", data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Track click route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}