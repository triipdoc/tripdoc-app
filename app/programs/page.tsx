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

const PAGE_SIZE = 24;

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    country?: string;
    funding?: string;
    page?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};

  const q = params.q?.trim() || "";
  const type = params.type?.trim() || "all";
  const country = params.country?.trim() || "all";
  const funding = params.funding?.trim() || "all";
  const currentPage = Math.max(Number(params.page || "1"), 1);

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("programs")
    .select(
      "id,title,slug,country,type,funding_type,deadline,official_url,image_url,verification_status,created_at,featured",
      { count: "exact" }
    )
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,country.ilike.%${q}%,type.ilike.%${q}%,funding_type.ilike.%${q}%`
    );
  }

  if (type !== "all") {
    query = query.eq("type", type);
  }

  if (country !== "all") {
    query = query.eq("country", country);
  }

  if (funding !== "all") {
    query = query.eq("funding_type", funding);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Programs page error:", error.message);
  }

  const programs = (data || []) as Program[];
  const totalPrograms = count || 0;
  const totalPages = Math.max(Math.ceil(totalPrograms / PAGE_SIZE), 1);

  return (
    <ProgramsClient
      initialPrograms={programs}
      searchQuery={q}
      selectedType={type}
      selectedCountry={country}
      selectedFunding={funding}
      showBackLink={true}
      currentPage={currentPage}
      totalPages={totalPages}
      totalPrograms={totalPrograms}
    />
  );
}