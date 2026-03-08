import type { MetadataRoute } from "next";
import { supabase } from "../lib/supabase";

type SitemapProgram = {
  slug: string | null;
  created_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await supabase
    .from("programs")
    .select("slug, created_at");

  const programs =
    ((data as SitemapProgram[] | null) ?? [])
      .filter((p) => p.slug)
      .map((p) => ({
        url: `https://app.tripdoc.net/programs/${p.slug}`,
        lastModified: p.created_at ?? new Date().toISOString(),
      }));

  return [
    {
      url: "https://app.tripdoc.net",
      lastModified: new Date().toISOString(),
    },
    ...programs,
  ];
}