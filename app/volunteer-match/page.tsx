import type { Metadata } from "next";
import {
  isKnownVolunteerAcquisitionSource,
  parseVolunteerAcquisitionSource,
} from "../../lib/volunteerMatchMvp";
import VolunteerMatchClient from "./VolunteerMatchClient";

const SITE_URL = "https://app.tripdoc.net";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Germany Volunteer Routes: BFD, FSJ & FÖJ | TripDoc",
  },
  description:
    "Compare Germany volunteer routes including BFD, FSJ, FÖJ and weltwärts South–North. Use TripDoc’s free questionnaire and read official eligibility sources.",
  alternates: {
    canonical: `${SITE_URL}/volunteer-match`,
  },
  openGraph: {
    title: "Germany Volunteer Routes | TripDoc Volunteer Match",
    description:
      "Explore volunteer routes, understand their differences and check which routes may fit your profile.",
    url: `${SITE_URL}/volunteer-match`,
    siteName: "TripDoc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Germany Volunteer Routes | TripDoc",
    description:
      "Compare volunteer routes and use a free, rules-based questionnaire. Includes official sources and important limitations.",
  },
};

const routes = [
  {
    name: "BFD — Federal Volunteer Service",
    overview:
      "Voluntary service in Germany across social, environmental, cultural and other public-benefit settings.",
    eligibility:
      "Compulsory full-time schooling must be completed. There is no general upper age limit.",
    nextStep:
      "Find a recognised placement and ask about its application requirements and the support included.",
    source:
      "https://www.bundesfreiwilligendienst.de/bundesfreiwilligendienst/fragen-antworten",
    sourceLabel: "Official BFD questions and answers",
  },
  {
    name: "FSJ — Voluntary Social Year",
    overview:
      "A youth voluntary service focused on social engagement.",
    eligibility:
      "A route for young people under 27. Check the provider’s full participation requirements.",
    nextStep:
      "Ask the provider about available roles, language expectations and the application process.",
    source: "https://www.jugendfreiwilligendienste.de/",
    sourceLabel: "Official youth volunteer service portal",
  },
  {
    name: "FÖJ — Voluntary Ecological Year",
    overview:
      "A youth voluntary service focused on environmental protection and nature conservation.",
    eligibility:
      "A route for young people under 27. Check the provider’s full participation requirements.",
    nextStep:
      "Check the environmental project, start date and requirements with the provider.",
    source: "https://www.jugendfreiwilligendienste.de/",
    sourceLabel: "Official youth volunteer service portal",
  },
  {
    name: "weltwärts South–North",
    overview:
      "A development volunteer service offering intercultural learning through placements in Germany.",
    eligibility:
      "Generally ages 18–28, with exceptions possible for older applicants. Residence in an OECD DAC-listed country is a requirement, but not every listed country has an active sending organisation.",
    nextStep:
      "Find a participating sending organisation in your country and follow its application and selection process.",
    source: "https://www.weltwaerts.de/en/",
    sourceLabel: "Official weltwärts participation information",
  },
];

export default async function VolunteerMatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const isInitialSourceKnown =
    isKnownVolunteerAcquisitionSource(params.source);
  const initialSource = parseVolunteerAcquisitionSource(
    params.source,
    "other"
  );

  return (
    <>
      <VolunteerMatchClient
        initialSource={initialSource}
        isInitialSourceKnown={isInitialSourceKnown}
      />

      <section
        aria-labelledby="volunteer-guide-heading"
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 sm:p-8">
          <h2
            id="volunteer-guide-heading"
            className="text-2xl font-bold sm:text-3xl"
          >
            Understanding volunteer routes in Germany
          </h2>

          <p className="mt-4 leading-7 text-slate-700">
            TripDoc Volunteer Match is a starting point for exploring
            routes that may fit your profile. Use the questionnaire
            alongside the overview below, then confirm the details with
            the organisation responsible for the placement.
          </p>

          <p className="mt-3 text-sm text-slate-600">
            Sources for this overview checked on{" "}
            <time dateTime="2026-09-13">13 September 2026</time>.
            This date applies to the overview below, not to a review
            of every questionnaire rule or available placement.
          </p>

          <h3 className="mt-8 text-xl font-semibold">
            Compare four volunteer routes
          </h3>

          <p className="mt-3 leading-7 text-slate-700">
            This is an introductory comparison, not a complete
            eligibility checklist.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {routes.map((route) => (
              <article
                key={route.name}
                className="rounded-xl border border-slate-200 p-5"
              >
                <h4 className="text-lg font-semibold">
                  {route.name}
                </h4>

                <p className="mt-3 leading-7 text-slate-700">
                  {route.overview}
                </p>

                <p className="mt-3 leading-7 text-slate-700">
                  <strong>Starting eligibility: </strong>
                  {route.eligibility}
                </p>

                <p className="mt-3 leading-7 text-slate-700">
                  <strong>Next step: </strong>
                  {route.nextStep}
                </p>

                <a
                  href={route.source}
                  className="mt-4 inline-block font-medium text-blue-700 underline underline-offset-4"
                >
                  {route.sourceLabel}
                </a>
              </article>
            ))}
          </div>

          <h3 className="mt-8 text-xl font-semibold">
            What about SCI options?
          </h3>

          <p className="mt-3 leading-7 text-slate-700">
            If your questionnaire result includes an SCI option,
            check the exact project and organising body before
            proceeding. This overview does not establish a common
            age limit, funding package or immigration route for
            SCI options.
          </p>

          <h3 className="mt-8 text-xl font-semibold">
            What does a TripDoc match mean?
          </h3>

          <p className="mt-3 leading-7 text-slate-700">
            A result is a rules-based indication of a route worth
            investigating. It is not an offer from a host organisation,
            confirmation of an available place or a prediction of
            your chances of selection.
          </p>

          <p className="mt-3 leading-7 text-slate-700">
            TripDoc does not guarantee placement, funding, admission
            or visa approval. Read the linked official information
            and obtain confirmation from the responsible organisation
            before making commitments.
          </p>

          <h3 className="mt-8 text-xl font-semibold">
            Questions to ask before accepting a placement
          </h3>

          <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-slate-700">
            <li>
              Is the organisation accepting applications from people
              with my citizenship and country of residence?
            </li>
            <li>
              What language level is required, and what evidence
              should I provide?
            </li>
            <li>
              What are the duties, start date and service duration?
            </li>
            <li>
              What allowance, accommodation, meals, insurance and
              travel support are included in writing?
            </li>
            <li>
              What costs would I personally need to cover?
            </li>
            <li>
              Which documents must I obtain from the organisation,
              and which requirements must I confirm with the
              responsible authorities?
            </li>
          </ul>

          <p className="mt-6 leading-7 text-slate-700">
            For example, BFD guidance says that pocket money is
            agreed with the placement and that accommodation and
            meals may be provided. Do not assume that every BFD
            placement includes free housing or all living costs.{" "}
            <a
              href="https://www.bundesfreiwilligendienst.de/bundesfreiwilligendienst/fragen-antworten"
              className="font-medium text-blue-700 underline underline-offset-4"
            >
              Read the official BFD benefits guidance.
            </a>
          </p>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-xl font-semibold">
              Found information that needs correcting?
            </h3>

            <p className="mt-3 leading-7 text-slate-700">
              Contact TripDoc with the page address, the statement
              concerned and an official source showing the issue.{" "}
              <a
                href="/contact"
                className="font-medium text-blue-700 underline underline-offset-4"
              >
                Contact TripDoc.
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}