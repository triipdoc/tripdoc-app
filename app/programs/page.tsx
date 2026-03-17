import { supabase } from "../../lib/supabase";
import ProgramsClient from "./ProgramsClient";

type Program = {
  id: string;
  title: string;
  slug: string | null;
  country: string | null;
  type: string | null;
  funding_type: string | null;
  deadline: string | null;
  official_url: string | null;
  image_url: string | null;
  verification_status: string | null;
  created_at?: string | null;
  featured?: boolean | null;
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() || "";

  let query = supabase
    .from("programs")
    .select("*")
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,country.ilike.%${q}%,type.ilike.%${q}%,funding_type.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Programs page error:", error.message);
  }

  const programs = (data || []) as Program[];

  return (
    <ProgramsClient
      initialPrograms={programs}
      searchQuery={q}
      showBackLink={true}
    />
  );
}