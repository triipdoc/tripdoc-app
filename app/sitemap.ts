import type { MetadataRoute } from "next";
import { supabase } from "../lib/supabase";

type SitemapProgram = {
  slug: string | null;
  country: string | null;
  type: string | null;
  created_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://app.tripdoc.net";

  const { data } = await supabase
    .from("programs")
    .select("slug,country,type,created_at");

  const programs = (data || []).filter((p: SitemapProgram) => p.slug);

  const programUrls = programs.map((p) => ({
    url: `${baseUrl}/programs/${p.slug}`,
    lastModified: p.created_at ?? new Date().toISOString(),
  }));

  const categories = new Set<string>();
  const countries = new Set<string>();

  programs.forEach((p) => {
    if (p.type) categories.add(p.type.toLowerCase());
    if (p.country) countries.add(p.country.toLowerCase());
  });

  const categoryUrls = Array.from(categories).map((c) => ({
    url: `${baseUrl}/category/${c}`,
    lastModified: new Date().toISOString(),
  }));

  const countryUrls = Array.from(countries).map((c) => ({
    url: `${baseUrl}/country/${encodeURIComponent(c)}`,
    lastModified: new Date().toISOString(),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
    },
    ...categoryUrls,
    ...countryUrls,
    ...programUrls,
  ];
}