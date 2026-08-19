import type { Metadata } from "next";
import { isKnownVolunteerAcquisitionSource, parseVolunteerAcquisitionSource } from "../../lib/volunteerMatchMvp";
import VolunteerMatchClient from "./VolunteerMatchClient";

const SITE_URL = "https://app.tripdoc.net";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TripDoc Volunteer Match | Germany Volunteer Route Assessment",
  description:
    "Answer a quick 5-step check and receive transparent, rules-based assessments for verified Germany volunteer routes including weltwärts, BFD, FSJ, FÖJ, and SCI.",
  alternates: {
    canonical: `${SITE_URL}/volunteer-match`,
  },
  openGraph: {
    title: "TripDoc Volunteer Match",
    description:
      "Check which verified Germany volunteer routes may fit your profile before preparing documents or applying.",
    url: `${SITE_URL}/volunteer-match`,
    siteName: "TripDoc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripDoc Volunteer Match",
    description:
      "Get a transparent rules-based volunteer route assessment through a quick 5-step check without creating an account.",
  },
};

export default async function VolunteerMatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const isInitialSourceKnown = isKnownVolunteerAcquisitionSource(params.source);
  const initialSource = parseVolunteerAcquisitionSource(params.source, "other");

  return (
    <VolunteerMatchClient
      initialSource={initialSource}
      isInitialSourceKnown={isInitialSourceKnown}
    />
  );
}

