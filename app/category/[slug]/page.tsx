import { permanentRedirect } from "next/navigation";
import { browseRouteSlug } from "../../../lib/browseUrls";

export default async function LegacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/types/${browseRouteSlug(slug)}`);
}
