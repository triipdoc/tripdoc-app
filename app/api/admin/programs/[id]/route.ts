import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { requireAdmin } from "../../../../../lib/requireAdmin";
import { normalizeProgramBody } from "../../../../../lib/normalizeProgramBody";
import { validateProgramAdminPayload } from "../../../../../lib/opportunityPrograms";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, context: Context) {
  const denied = await requireAdmin(req); if (denied) return denied;
  const { id } = await context.params;
  const [{ data: program, error }, { data: history, error: historyError }] = await Promise.all([
    supabaseAdmin.from("programs").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("program_change_history").select("id,actor,action,changed_fields,previous_values,new_values,created_at").eq("program_id", id).order("created_at", { ascending: false }).limit(30),
  ]);
  if (error || historyError) return NextResponse.json({ error: "Could not load this record or its history. Check that the upgrade migration has been applied." }, { status: 500 });
  if (!program) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  return NextResponse.json({ program, history });
}
export async function PATCH(req: NextRequest, context: Context) {
  const denied = await requireAdmin(req); if (denied) return denied;
  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { data: existing, error: loadError } = await supabaseAdmin.from("programs").select("*").eq("id", id).maybeSingle();
  if (loadError) return NextResponse.json({ error: "Could not load opportunity." }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  if (body.admin_version !== existing.admin_version) return NextResponse.json({ error: "This opportunity changed in another session. Copy your edits, reload the record, and merge them before saving." }, { status: 409 });
  const { payload, errors, warnings } = validateProgramAdminPayload(normalizeProgramBody({ ...existing, ...body }));
  // Existing URLs remain stable, including through draft/archive transitions.
  if (existing.slug && payload.slug !== existing.slug) errors.push("Existing URLs are locked. Contact a developer if a redirect is required.");
  if (errors.length) return NextResponse.json({ error: errors.join(" "), warnings }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("programs").update(payload).eq("id", id).eq("admin_version", body.admin_version).select().maybeSingle();
  if (error) {
    console.error("Admin opportunity update:", error.code);
    return NextResponse.json({ error: "Update failed. Check the migration and record validation; no changes were saved." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Another editor saved this record first. Reload it before saving." }, { status: 409 });
  return NextResponse.json({ success: true, program: data, warnings });
}
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req); if (denied) return denied;
  return NextResponse.json({ error: "Use Archive to retain the opportunity URL and history." }, { status: 405 });
}
