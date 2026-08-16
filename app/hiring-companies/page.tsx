import type { Metadata } from "next";
import {
  getTodayDateString,
  PUBLIC_SPONSORSHIP_STATUSES,
  type HiringCompanyJob,
} from "../../lib/hiringCompanyJobs";
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
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("hiring_companies")
    .select("*")
    .eq("verification_status", "verified")
    .order("featured", { ascending: false })
    .order("company_name", { ascending: true });

  if (error) {
    console.error("Hiring companies page error:", error.message);
  }

  const { data: jobsData, error: jobsError } = await supabase
    .from("hiring_company_jobs")
    .select(
      "*, company:hiring_companies(id, company_name, slug, country, industry, careers_url)"
    )
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .in("visa_sponsorship_status", PUBLIC_SPONSORSHIP_STATUSES)
    .not("last_verified", "is", null)
    .or(`deadline.is.null,deadline.gte.${today}`)
    .order("is_featured", { ascending: false })
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (jobsError) {
    console.error("Hiring company jobs page error:", jobsError.message);
  }

  return (
    <HiringCompaniesClient
      initialCompanies={(data || []) as HiringCompany[]}
      initialJobs={(jobsData || []) as HiringCompanyJob[]}
      errorMessage={error ? "We could not load hiring companies right now." : ""}
      jobsErrorMessage={
        jobsError ? "We could not load verified open jobs right now." : ""
      }
    />
  );
}
