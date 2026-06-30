import type { Metadata } from "next";
import { supabase } from "../../lib/supabase";
import HiringCompaniesClient, {
  type HiringCompany,
} from "./HiringCompaniesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "2026 Global Hiring Companies by Country | TripDoc",
  description:
    "Explore verified global hiring companies by country, industry, visa sponsorship, relocation support, and graduate program availability.",
};

export default async function HiringCompaniesPage() {
  const { data, error } = await supabase
    .from("hiring_companies")
    .select("*")
    .eq("verification_status", "verified")
    .order("featured", { ascending: false })
    .order("company_name", { ascending: true });

  if (error) {
    console.error("Hiring companies page error:", error.message);
  }

  return (
    <HiringCompaniesClient
      initialCompanies={(data || []) as HiringCompany[]}
      errorMessage={error ? "We could not load hiring companies right now." : ""}
    />
  );
}
