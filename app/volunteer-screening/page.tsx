import type { Metadata } from "next";
import { socialLinks } from "../components/socialLinks";

const SITE_URL = "https://app.tripdoc.net";
const TALLY_FORM_URL =
  "https://tally.so/embed/Xxy59Y?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

export const metadata: Metadata = {
  title: "TripDoc Verified Volunteer Route — Pre-Screening",
  description:
    "Check your readiness for verified volunteer routes in Germany and Europe, including weltwärts South-North, SCI Germany, BFD, FSJ, FÖJ, and verified short-term workcamps.",
  alternates: {
    canonical: `${SITE_URL}/volunteer-screening`,
  },
  openGraph: {
    title: "TripDoc Verified Volunteer Route — Pre-Screening",
    description:
      "TripDoc helps you understand verified volunteer routes, prepare documents, and apply through official channels.",
    url: `${SITE_URL}/volunteer-screening`,
    siteName: "TripDoc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripDoc Verified Volunteer Route — Pre-Screening",
    description:
      "Check whether your profile is suitable for verified Germany and Europe volunteer routes before you waste money, documents, or time.",
  },
};

const audienceItems = [
  "Secondary school / WAEC holders",
  "Diploma or vocational certificate holders",
  "Applicants with community service or volunteering experience",
  "People willing to learn German A1 if required",
  "Applicants interested in weltwärts, SCI Germany, BFD, FSJ, FÖJ, or verified short-term workcamps",
];

const checkItems = [
  "Age and country eligibility",
  "Passport readiness",
  "Education background",
  "Volunteer or community experience",
  "German language readiness",
  "Financial readiness for passport, visa, language test, and documents",
  "Best route recommendation",
];

const processItems = [
  "Submit the pre-screening form",
  "TripDoc reviews your profile",
  "You receive a Green, Yellow, or Red readiness score",
  "If suitable, you can request document/application support",
  "You apply only through official organisations or verified host routes",
];

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(16,32,51,0.07)] sm:p-8">
      <h2 className="text-2xl font-extrabold tracking-normal text-[#102033]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function VolunteerScreeningPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#102033]">
      <section className="bg-gradient-to-br from-[#17307a] to-[#2952d5] px-5 py-20 text-white sm:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-normal text-white/80">
              Verified volunteer routes
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              TripDoc Verified Volunteer Route — Pre-Screening
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white/90">
              Want to volunteer in Germany or Europe through verified routes?
              TripDoc helps you check whether your profile is suitable before you
              waste money, documents, or time.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#screening-form"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-extrabold !text-[#2952d5] no-underline shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 hover:!text-[#17307a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Start Pre-Screening
              </a>
              <a
                href="#process"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/35 px-6 text-sm font-extrabold text-white no-underline"
              >
                See the process
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-5">
        <div className="-mt-8 rounded-lg border border-amber-200 bg-[#fff8e5] p-5 text-[#654d08] shadow-[0_16px_45px_rgba(16,32,51,0.10)] sm:p-6">
          <h2 className="text-lg font-black text-[#654d08]">Important warning</h2>
          <p className="mt-2 text-sm font-semibold leading-7 sm:text-base">
            TripDoc does not guarantee placement, admission, visa approval, or
            travel. We only help you understand verified routes, prepare
            documents, and apply through official channels.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <SectionCard title="Who this is for">
            <ul className="grid gap-3">
              {audienceItems.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700"
                >
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2952d5]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="What we check">
            <ul className="grid gap-3">
              {checkItems.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-sm font-semibold leading-6 text-slate-700"
                >
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2f7d4f]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <section
          id="process"
          className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(16,32,51,0.07)] sm:p-8"
        >
          <div className="max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-normal text-[#102033]">
              How the process works
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              The pre-screening is designed to help you understand your readiness
              before preparing documents or applying through official volunteer
              organisations.
            </p>
          </div>

          <ol className="mt-6 grid gap-4 lg:grid-cols-5">
            {processItems.map((item, index) => (
              <li
                key={item}
                className="rounded-lg border border-slate-200 bg-[#f8fbff] p-4"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2952d5] text-sm font-black text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-bold leading-6 text-slate-700">
                  {item}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="screening-form"
          className="mt-6 scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(16,32,51,0.07)] sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-normal text-[#2952d5]">
                Pre-screening form
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-normal text-[#102033] sm:text-3xl">
                Start Pre-Screening
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Use this section to submit your profile once the official form is
                connected. TripDoc will review your readiness and help you
                understand which verified route may fit your profile.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3">
              <iframe
                src={TALLY_FORM_URL}
                title="TripDoc volunteer pre-screening form"
                loading="lazy"
                className="min-h-[900px] w-full rounded-lg border border-slate-200 bg-white"
              />
              <div className="mt-4 flex justify-center">
                <a
                  href={TALLY_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2952d5] px-5 text-sm font-extrabold text-white no-underline"
                >
                  Open form in new tab
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-slate-700 shadow-[0_10px_28px_rgba(16,32,51,0.07)] sm:p-6">
          <p className="text-sm font-bold leading-7">
            Volunteering is service, not a guaranteed job or migration shortcut.
            Do not pay anyone promising guaranteed Europe volunteer visa.
          </p>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(16,32,51,0.07)] sm:p-6">
          <h2 className="text-lg font-black text-[#102033]">
            Follow TripDoc for verified opportunities
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Get practical updates on verified opportunities, volunteer routes,
            and application safety reminders.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.ariaLabel}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold !text-[#2952d5] no-underline transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2952d5]"
              >
                {item.name}{" "}
                <span className="text-slate-500">{item.handle}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
