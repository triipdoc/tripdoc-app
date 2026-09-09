import type { MetadataRoute } from "next";
import { supabase } from "../lib/supabase";

type SitemapProgram = {
  slug: string | null;
  country: string | null;
  type: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://app.tripdoc.net";

  const { data, error } = await supabase
    .from("programs")
    .select("slug,country,type");

  if (error) {
    throw new Error(`Failed to generate sitemap: ${error.message}`);
  }

  const programs = (data || []).filter(
    (p: SitemapProgram) => p.slug
  );

  const programUrls = programs.map((p) => ({
    url: `${baseUrl}/programs/${p.slug}`,
  }));

  const categories = new Set<string>();
  const countries = new Set<string>();

  programs.forEach((p) => {
    if (p.type) categories.add(p.type.toLowerCase());
    if (p.country) countries.add(p.country.toLowerCase());
  });

  const categoryUrls = Array.from(categories).map((c) => ({
    url: `${baseUrl}/category/${encodeURIComponent(c)}`,
  }));

  const countryUrls = Array.from(countries).map((c) => ({
    url: `${baseUrl}/country/${encodeURIComponent(c)}`,
  }));

  return [
    { url: baseUrl },
    { url: `${baseUrl}/hiring-companies` },
    { url: `${baseUrl}/volunteer-match` },
    ...categoryUrls,
    ...countryUrls,
    ...programUrls,
  ];
}