"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  buildVolunteerMatchSummary,
  educationOptions,
  englishLevelOptions,
  experienceEvidenceOptions,
  germanLevelOptions,
  getOrganisationConnectionStatus,
  getVerdictClassName,
  passportOptions,
  preparationReadinessOptions,
  projectInterestOptions,
  shouldAskAccessibilityAgeException,
  shouldAskGermanA1Readiness,
  shouldAskVolunteerAcquisitionSource,
  shouldAskVolunteerExperienceDetails,
  volunteerExperienceTypeOptions,
  volunteerHumanReviewSubmissionSchema,
  volunteerMatchQuestionSections,
  volunteerMatchResponseSchema,
  volunteerMatchSourceOptions,
  organisationConnectionOptions,
  VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION,
  type VolunteerMatchPublicResult,
  type VolunteerMatchResponse,
} from "../../lib/volunteerMatchMvp";
import type {
  AcquisitionSource,
  OrganisationConnectionStatus,
  VolunteerExperienceType,
  VolunteerQuestionnaireAnswers,
} from "../../lib/volunteerMatchSchemas";
import {
  getVolunteerCountryName,
  parseVolunteerCountryCode,
  volunteerCountryOptions,
} from "../../lib/volunteerMatchCountries";

const startYears = Array.from({ length: 7 }, (_, index) => 2026 + index);

type FormAnswers = VolunteerQuestionnaireAnswers;

let volunteerMatchViewTrackedForBrowserLoad = false;

type HumanReviewFormState = {
  name: string;
  email: string;
  whatsapp: string;
  preferredContactMethod: "email" | "whatsapp" | "either";
  note: string;
  website: string;
  consentToContact: boolean;
};

function createInitialAnswers(initialSource: AcquisitionSource): FormAnswers {
  return {
    age: 23,
    citizenship: "",
    residenceCountry: "",
    educationLevel: "secondary_school",
    completedCompulsorySchooling: true,
    germanLevel: "none",
    willingToLearnGerman: true,
    englishLevel: "working",
    passportReadiness: "none",
    volunteerExperienceType: "none",
    hasVolunteerExperience: false,
    volunteerExperienceMonths: 0,
    experienceEvidence: ["none"],
    preferredStartYear: 2027,
    preparationReadiness: "needs_guidance",
    hasSendingOrganisationConnection: null,
    organisationConnectionStatus: "unsure",
    projectInterestAreas: ["social"],
    mayNeedAccessibilityAgeException: false,
    acquisitionSource: initialSource,
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Not listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function getSectionErrors(
  answers: FormAnswers,
  sectionIndex: number,
  privacyNoticeAccepted: boolean
) {
  const section = volunteerMatchQuestionSections[sectionIndex];
  const sectionFields = section.fields as readonly string[];
  const errors: string[] = [];

  if (sectionFields.includes("age") && (answers.age < 13 || answers.age > 100)) {
    errors.push("Enter an age between 13 and 100.");
  }
  if (sectionFields.includes("citizenship") && !parseVolunteerCountryCode(answers.citizenship)) {
    errors.push("Select your citizenship country from the country list.");
  }
  if (sectionFields.includes("residenceCountry") && !parseVolunteerCountryCode(answers.residenceCountry)) {
    errors.push("Select your current country of residence from the country list.");
  }
  if (sectionFields.includes("completedCompulsorySchooling") && !answers.completedCompulsorySchooling) {
    errors.push("You can continue, but most listed routes expect completed compulsory schooling.");
  }
  if (sectionFields.includes("volunteerExperienceType") && shouldAskVolunteerExperienceDetails(answers) && answers.volunteerExperienceMonths < 1) {
    errors.push("Add at least 1 month of volunteer or community experience.");
  }
  if (sectionFields.includes("projectInterestAreas") && answers.projectInterestAreas.length === 0) {
    errors.push("Choose at least one volunteer interest area.");
  }
  if (sectionFields.includes("privacyNoticeAccepted") && !privacyNoticeAccepted) {
    errors.push("Confirm the TripDoc Volunteer Match notice before matching.");
  }

  return errors;
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-black text-[#26384d]">{label}</label>
      {hint ? <p className="m-0 text-sm font-semibold leading-6 text-slate-500">{hint}</p> : null}
      {children}
    </div>
  );
}


function CountryField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (countryCode: string) => void;
}) {
  const [displayValue, setDisplayValue] = useState(() =>
    value ? getVolunteerCountryName(value) : ""
  );
  const datalistId = `${id}-country-options`;

  function commitCountry(inputValue: string) {
    const countryCode = parseVolunteerCountryCode(inputValue);

    if (countryCode) {
      onChange(countryCode);
      setDisplayValue(getVolunteerCountryName(countryCode));
      return;
    }

    if (!inputValue.trim()) {
      onChange("");
      setDisplayValue("");
    }
  }

  return (
    <FieldGroup label={label} hint="Start typing, then choose the matching country from the list.">
      <input
        className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold"
        list={datalistId}
        value={displayValue}
        onBlur={(event) => commitCountry(event.target.value)}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDisplayValue(nextValue);
          const countryCode = parseVolunteerCountryCode(nextValue);
          if (countryCode) onChange(countryCode);
        }}
        placeholder="Search country"
      />
      <datalist id={datalistId}>
        {volunteerCountryOptions.map((country) => (
          <option key={country.code} value={country.name}>
            {country.code}
          </option>
        ))}
      </datalist>
    </FieldGroup>
  );
}
function ResultList({
  title,
  emptyText,
  items,
  limit,
}: {
  title: string;
  emptyText: string;
  items: { conditionId: string; message: string; sourceUrl?: string }[];
  limit?: number;
}) {
  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;

  return (
    <div className="rounded-lg border border-blue-100 bg-[#f8fbff] p-4">
      <h3 className="m-0 text-sm font-black text-[#102033]">{title}</h3>
      {visibleItems.length === 0 ? (
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 grid gap-2 p-0">
          {visibleItems.map((item) => (
            <li key={`${title}-${item.conditionId}`} className="list-none text-sm font-semibold leading-6 text-slate-600">
              <span>{item.message}</span>
              {item.sourceUrl ? (
                <a className="ml-2 font-black text-[#2952d5] no-underline" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Source
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const dimensionLabels = [
  ["profileFit", "Profile fit"],
  ["routeFit", "Route fit"],
  ["placementAvailability", "Placement availability"],
  ["residenceVisaFeasibility", "Residence/visa feasibility"],
] as const;

function getDimensionStatusClass(status: string) {
  if (status === "Looks compatible") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (status === "Weak fit") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "Needs verification") {
    return "border-amber-200 bg-[#fff8e5] text-[#654d08]";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

function DimensionStatusGrid({
  statuses,
}: {
  statuses: VolunteerMatchPublicResult["dimensionStatuses"];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {dimensionLabels.map(([key, label]) => {
        const status = statuses[key];

        return (
          <div key={key} className={`rounded-lg border p-3 ${getDimensionStatusClass(status)}`}>
            <span className="block text-xs font-black uppercase">{label}</span>
            <strong className="mt-1 block text-sm font-black">{status}</strong>
          </div>
        );
      })}
    </div>
  );
}

function MatchSummaryCard({
  results,
}: {
  results: VolunteerMatchPublicResult[];
}) {
  const summary = buildVolunteerMatchSummary(results);

  return (
    <div data-volunteer-screenshot="overall-summary" className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_12px_35px_rgba(16,32,51,0.08)] sm:p-6">
      <p className="m-0 text-sm font-black uppercase text-[#2952d5]">Your Volunteer Match</p>
      <h2 className="mt-2 text-3xl font-black text-[#102033]">{summary.headline}</h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-blue-100 bg-[#f8fbff] p-4">
          <span className="text-xs font-black uppercase text-slate-500">Best route to explore</span>
          <strong className="mt-2 block text-base font-black text-[#102033]">
            {summary.bestRoute?.routeName || "No route returned"}
          </strong>
          {summary.bestRoute ? (
            <small className="mt-1 block font-bold text-slate-500">{summary.bestRoute.verdict}</small>
          ) : null}
        </div>
        <div className="rounded-lg border border-blue-100 bg-[#f8fbff] p-4">
          <span className="text-xs font-black uppercase text-slate-500">Also worth considering</span>
          <strong className="mt-2 block text-base font-black text-[#102033]">
            {summary.alsoWorthConsidering?.routeName || "No second route stood out"}
          </strong>
          {summary.alsoWorthConsidering ? (
            <small className="mt-1 block font-bold text-slate-500">{summary.alsoWorthConsidering.verdict}</small>
          ) : null}
        </div>
        <div className="rounded-lg border border-blue-100 bg-[#f8fbff] p-4">
          <span className="text-xs font-black uppercase text-slate-500">Other routes</span>
          <strong className="mt-2 block text-base font-black leading-6 text-[#102033]">
            {summary.otherRoutesText}
          </strong>
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  sessionId,
}: {
  result: VolunteerMatchPublicResult;
  sessionId: string;
}) {
  async function trackOpportunityClick(programId: string) {
    try {
      await fetch("/api/volunteer-match/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          eventName: "matching_opportunity_clicked",
          sessionId,
          routeId: result.routeId,
          programId,
        }),
      });
    } catch (error) {
      console.error("Volunteer opportunity click tracking failed:", error);
    }
  }

  const importantGapItems =
    result.blockers.length > 0 ? result.blockers : result.humanReviewReasons;
  const nextStepItems =
    result.nextSteps.length > 0
      ? result.nextSteps
      : result.humanReviewReasons;
  const hasDetailedExplanation =
    result.reasons.length > 4 ||
    importantGapItems.length > 4 ||
    nextStepItems.length > 4 ||
    result.unresolvedNotes.length > 0;
  const verdictClass = getVerdictClassName(result.verdict);

  return (
    <article data-volunteer-route-card className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(16,32,51,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="m-0 text-xs font-black uppercase text-[#2952d5]">Verified route assessment</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#102033]">{result.routeName}</h2>
        </div>
        <span className={`inline-flex rounded-full px-3 py-2 text-xs font-black ${
          verdictClass === "strong"
            ? "border border-green-200 bg-green-50 text-green-800"
            : verdictClass === "potential"
              ? "border border-blue-200 bg-blue-50 text-blue-800"
              : verdictClass === "weak"
                ? "border border-red-200 bg-red-50 text-red-800"
                : "border border-amber-200 bg-amber-50 text-amber-800"
        }`}>
          {result.verdict}
        </span>
      </div>

      <div className="mt-4">
        <DimensionStatusGrid statuses={result.dimensionStatuses} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ResultList
          title="Why it may fit"
          emptyText="No strong fit signals were found yet from the current answers."
          items={result.reasons}
          limit={4}
        />
        <ResultList
          title="Important gaps"
          emptyText="No major profile-level eligibility issue was identified from your answers."
          items={importantGapItems}
          limit={4}
        />
        <ResultList
          title="Recommended next steps"
          emptyText="No extra preparation step was generated for this route."
          items={nextStepItems}
          limit={4}
        />
      </div>

      {hasDetailedExplanation ? (
        <details className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-black text-[#2952d5]">
            See detailed explanation
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ResultList
              title="All fit signals"
              emptyText="No additional fit signals were generated."
              items={result.reasons}
            />
            <ResultList
              title="All gaps or verification points"
              emptyText="No additional gaps were generated."
              items={importantGapItems}
            />
            <ResultList
              title="All recommended steps"
              emptyText="No additional next steps were generated."
              items={nextStepItems}
            />
          </div>
          {result.unresolvedNotes.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-[#fff8e5] p-4 text-sm font-semibold leading-6 text-[#654d08]">
              <strong className="block font-black">Still needs verification</strong>
              <ul className="mt-2 grid gap-2 p-0">
                {result.unresolvedNotes.map((note) => (
                  <li className="list-none" key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </details>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-blue-100 bg-[#f8fbff] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <strong className="text-sm font-black text-[#102033]">Official source</strong>
          <span className="text-sm font-semibold text-slate-600">{result.source.sourceTitle}</span>
          <span className="text-sm font-semibold text-slate-600">Last verified: {formatDate(result.source.lastVerifiedAt)}</span>
        </div>
        <a className="font-black text-[#2952d5] no-underline" href={result.source.sourceUrl} target="_blank" rel="noopener noreferrer">
          View source
        </a>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="m-0 text-sm font-black text-[#102033]">Relevant TripDoc opportunities</h3>
        {result.linkedOpportunities.length === 0 ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-sm font-semibold leading-6 text-slate-600">TripDoc is still verifying current placements for this route.</p>
            <a className="font-black text-[#2952d5] no-underline" href={result.source.sourceUrl} target="_blank" rel="noopener noreferrer">
              Use official route source
            </a>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {result.linkedOpportunities.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/programs/${opportunity.slug}`}
                onClick={() => trackOpportunityClick(opportunity.id)}
                className="grid gap-1 rounded-lg border border-blue-100 bg-[#f8fbff] p-3 font-black text-[#102033] no-underline"
              >
                <span>{opportunity.title}</span>
                <small className="font-bold text-slate-500">
                  {[opportunity.country, opportunity.type, opportunity.fundingType].filter(Boolean).join(" / ") || "Verified opportunity"}
                </small>
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function VolunteerMatchClient({
  initialSource,
  isInitialSourceKnown,
}: {
  initialSource: AcquisitionSource;
  isInitialSourceKnown: boolean;
}) {
  const [answers, setAnswers] = useState<FormAnswers>(() => createInitialAnswers(initialSource));
  const [activeSection, setActiveSection] = useState(0);
  const [privacyNoticeAccepted, setPrivacyNoticeAccepted] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchResult, setMatchResult] = useState<VolunteerMatchResponse | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [showHumanReview, setShowHumanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState<HumanReviewFormState>({
    name: "",
    email: "",
    whatsapp: "",
    preferredContactMethod: "email",
    note: "",
    website: "",
    consentToContact: false,
  });
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const viewTrackedRef = useRef(false);

  const currentSection = volunteerMatchQuestionSections[activeSection];
  const progress = Math.round(((activeSection + 1) / volunteerMatchQuestionSections.length) * 100);
  const shouldAskSource = shouldAskVolunteerAcquisitionSource(isInitialSourceKnown);
  const hasExperienceDetails = shouldAskVolunteerExperienceDetails(answers);
  const experienceType = answers.volunteerExperienceType || "none";
  const organisationConnectionStatus = getOrganisationConnectionStatus(answers);

  useEffect(() => {
    if (viewTrackedRef.current || volunteerMatchViewTrackedForBrowserLoad) return;

    const viewKey =
      typeof window !== "undefined" && "sessionStorage" in window
        ? `tripdoc:volunteer-match-viewed:${window.location.pathname}:${window.location.search}:${Math.floor(
            window.performance.timeOrigin
          )}`
        : "";

    if (viewKey) {
      try {
        if (window.sessionStorage.getItem(viewKey)) return;
        window.sessionStorage.setItem(viewKey, "1");
      } catch {
        // If sessionStorage is unavailable, the in-memory guard still prevents render duplicates.
      }
    }

    viewTrackedRef.current = true;
    volunteerMatchViewTrackedForBrowserLoad = true;

    fetch("/api/volunteer-match/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName: "volunteer_match_viewed",
        acquisitionSource: initialSource,
      }),
    }).catch((error) => {
      console.error("Volunteer Match view tracking failed:", error);
    });
  }, [initialSource]);

  function updateAnswer<K extends keyof FormAnswers>(key: K, value: FormAnswers[K]) {
    setAnswers((current) => {
      const next = { ...current, [key]: value } as FormAnswers;

      if (key === "age" && !shouldAskAccessibilityAgeException(Number(value))) {
        next.mayNeedAccessibilityAgeException = false;
      }

      if (key === "germanLevel" && !shouldAskGermanA1Readiness(value as FormAnswers["germanLevel"])) {
        next.willingToLearnGerman = true;
      }

      return next;
    });
  }

  function updateExperienceType(value: VolunteerExperienceType) {
    setAnswers((current) => ({
      ...current,
      volunteerExperienceType: value,
      hasVolunteerExperience: value !== "none",
      volunteerExperienceMonths:
        value === "none" ? 0 : Math.max(current.volunteerExperienceMonths, 1),
      experienceEvidence: value === "none" ? ["none"] : current.experienceEvidence,
    }));
  }

  function updateOrganisationConnectionStatus(value: OrganisationConnectionStatus) {
    setAnswers((current) => ({
      ...current,
      organisationConnectionStatus: value,
      hasSendingOrganisationConnection:
        value === "yes" ? true : value === "no" ? false : null,
    }));
  }

  function scrollToQuestionnaire() {
    document
      .getElementById("volunteer-match-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goNext() {
    const errors = getSectionErrors(answers, activeSection, privacyNoticeAccepted);
    const blockingErrors = errors.filter((error) => !error.startsWith("You can continue"));
    setFormErrors(errors);
    if (blockingErrors.length > 0) return;
    setFormErrors([]);
    setActiveSection((current) => Math.min(current + 1, volunteerMatchQuestionSections.length - 1));
  }

  function goBack() {
    setFormErrors([]);
    setActiveSection((current) => Math.max(current - 1, 0));
  }

  async function submitMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = getSectionErrors(answers, activeSection, privacyNoticeAccepted);
    const blockingErrors = errors.filter((error) => !error.startsWith("You can continue"));
    setFormErrors(errors);
    setSubmitError("");
    if (blockingErrors.length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/volunteer-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, privacyNoticeAccepted }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(payload?.error || "Could not complete the match.");
        return;
      }
      const parsed = volunteerMatchResponseSchema.parse(payload);
      setMatchResult(parsed);
      requestAnimationFrame(() => {
        document.getElementById("volunteer-match-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      console.error("Volunteer match submit failed:", error);
      setSubmitError("Could not complete the match. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function openHumanReview() {
    setShowHumanReview(true);
    setReviewMessage("");
    setReviewError("");
    if (!matchResult?.sessionId) return;
    try {
      await fetch("/api/volunteer-match/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ eventName: "human_review_clicked", sessionId: matchResult.sessionId }),
      });
    } catch (error) {
      console.error("Human review click tracking failed:", error);
    }
  }

  async function submitHumanReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!matchResult?.sessionId) return;
    setReviewError("");
    setReviewMessage("");

    const payload = {
      sessionId: matchResult.sessionId,
      ...reviewForm,
      privacyNoticeVersion: VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION,
    };
    const parsed = volunteerHumanReviewSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      setReviewError(parsed.error.issues[0]?.message || "Check the review form.");
      return;
    }

    setIsReviewSubmitting(true);
    try {
      const response = await fetch("/api/volunteer-match/human-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setReviewError(result?.error || "Could not submit the review request.");
        return;
      }
      setReviewMessage("Your human review request was submitted.");
      setReviewForm({ name: "", email: "", whatsapp: "", preferredContactMethod: "email", note: "", website: "", consentToContact: false });
    } catch (error) {
      console.error("Human review submit failed:", error);
      setReviewError("Could not submit the review request. Please try again.");
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#102033]">
      <section className="bg-gradient-to-br from-[#17307a] to-[#2952d5] px-4 py-16 text-white sm:px-5 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-black uppercase text-white/80">TripDoc Volunteer Match</p>
          <h1 className="mx-auto mt-4 max-w-5xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
            Find Germany volunteer routes that may fit your profile.
          </h1>
          <p className="mt-5 text-base font-black text-white/90 sm:text-lg">
            Free • No account required • About 3 minutes
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base font-semibold leading-7 text-white/90 sm:text-lg sm:leading-8">
            Answer a quick 5-step check for verified routes such as weltwärts South-North, BFD, FSJ, FÖJ, and selected SCI routes.
          </p>
          <button
            type="button"
            onClick={scrollToQuestionnaire}
            className="mt-7 min-h-12 rounded-full border border-white bg-white px-6 text-sm font-black text-[#17307a] shadow-[0_14px_30px_rgba(16,32,51,0.18)] transition hover:bg-blue-50 hover:text-[#0f2563] focus:outline-none focus:ring-4 focus:ring-white/45"
          >
            Check My Volunteer Routes
          </button>
          <div className="mx-auto mt-7 max-w-3xl rounded-lg border border-white/25 bg-white/10 p-4 text-left text-sm font-semibold leading-7 text-white/95">
            <strong>Important:</strong> TripDoc gives a rules-based guide only. It does not guarantee placement, selection, visa approval, travel, or residence permission.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-5" aria-label="Volunteer Match questionnaire">
        <form id="volunteer-match-form" className="-mt-8 scroll-mt-28" onSubmit={submitMatch}>
          <div className="mb-3 flex items-center justify-between text-sm font-black text-slate-600">
            <span>Step {activeSection + 1} of {volunteerMatchQuestionSections.length}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-blue-100" aria-hidden="true">
            <span className="block h-full rounded-full bg-[#2952d5] transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(16,32,51,0.08)] sm:p-6">
            <div>
              <p className="m-0 text-sm font-bold leading-6 text-slate-600">{currentSection.description}</p>
              <h2 className="mt-1 text-3xl font-black text-[#102033]">{currentSection.title}</h2>
            </div>

            {formErrors.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-[#fff8e5] p-4 text-sm font-bold leading-6 text-[#654d08]">
                {formErrors.map((error) => <p className="m-0" key={error}>{error}</p>)}
              </div>
            ) : null}

            {currentSection.id === "basics" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {shouldAskSource ? (
                  <FieldGroup label="How did you find TripDoc?">
                    <select className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={answers.acquisitionSource} onChange={(event) => updateAnswer("acquisitionSource", event.target.value as AcquisitionSource)}>
                      {volunteerMatchSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </FieldGroup>
                ) : null}
                <FieldGroup label="Age">
                  <input className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" type="number" min={13} max={100} value={answers.age} onChange={(event) => updateAnswer("age", Number(event.target.value))} />
                </FieldGroup>
                <CountryField id="citizenship" label="Citizenship country" value={answers.citizenship} onChange={(countryCode) => updateAnswer("citizenship", countryCode)} />
                <CountryField id="residence" label="Current country of residence" value={answers.residenceCountry} onChange={(countryCode) => updateAnswer("residenceCountry", countryCode)} />
              </div>
            ) : null}

            {currentSection.id === "education" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FieldGroup label="Highest education completed">
                  <select className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={answers.educationLevel} onChange={(event) => updateAnswer("educationLevel", event.target.value as FormAnswers["educationLevel"])}>
                    {educationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </FieldGroup>
                <FieldGroup label="Have you completed compulsory schooling?" hint="BFD, FSJ, FÖJ, and weltwärts rules use this as an important route-readiness signal.">
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className={`min-h-12 rounded-lg border px-4 text-sm font-black ${answers.completedCompulsorySchooling ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`} onClick={() => updateAnswer("completedCompulsorySchooling", true)}>Yes</button>
                    <button type="button" className={`min-h-12 rounded-lg border px-4 text-sm font-black ${!answers.completedCompulsorySchooling ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`} onClick={() => updateAnswer("completedCompulsorySchooling", false)}>Not yet</button>
                  </div>
                </FieldGroup>
                <FieldGroup label="Preferred start year">
                  <select className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={answers.preferredStartYear} onChange={(event) => updateAnswer("preferredStartYear", Number(event.target.value))}>
                    {startYears.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </FieldGroup>
              </div>
            ) : null}

            {currentSection.id === "language-documents" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FieldGroup label="Current German level">
                  <select className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={answers.germanLevel} onChange={(event) => updateAnswer("germanLevel", event.target.value as FormAnswers["germanLevel"])}>
                    {germanLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </FieldGroup>
                {shouldAskGermanA1Readiness(answers.germanLevel) ? (
                  <FieldGroup label="Would you be willing to start German A1 if required?">
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" className={`min-h-12 rounded-lg border px-4 text-sm font-black ${answers.willingToLearnGerman ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`} onClick={() => updateAnswer("willingToLearnGerman", true)}>Yes</button>
                      <button type="button" className={`min-h-12 rounded-lg border px-4 text-sm font-black ${!answers.willingToLearnGerman ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`} onClick={() => updateAnswer("willingToLearnGerman", false)}>Not now</button>
                    </div>
                  </FieldGroup>
                ) : null}
                <FieldGroup label="English level">
                  <select className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={answers.englishLevel} onChange={(event) => updateAnswer("englishLevel", event.target.value as FormAnswers["englishLevel"])}>
                    {englishLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </FieldGroup>
                <FieldGroup label="Passport readiness">
                  <select className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={answers.passportReadiness} onChange={(event) => updateAnswer("passportReadiness", event.target.value as FormAnswers["passportReadiness"])}>
                    {passportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </FieldGroup>
              </div>
            ) : null}

            {currentSection.id === "experience" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FieldGroup label="Which experience best describes you?">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {volunteerExperienceTypeOptions.map((option) => (
                      <button key={option.value} type="button" className={`min-h-12 rounded-lg border px-4 text-sm font-black ${experienceType === option.value ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`} onClick={() => updateExperienceType(option.value)}>{option.label}</button>
                    ))}
                  </div>
                </FieldGroup>
                {hasExperienceDetails ? (
                  <>
                    <FieldGroup label="Approximate months of experience">
                      <input className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" type="number" min={1} max={240} value={answers.volunteerExperienceMonths} onChange={(event) => updateAnswer("volunteerExperienceMonths", Number(event.target.value))} />
                    </FieldGroup>
                    <FieldGroup label="Evidence you can provide">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {experienceEvidenceOptions.map((option) => (
                          <label key={option.value} className="flex items-start gap-2 rounded-lg border border-blue-100 bg-[#f8fbff] p-3 text-sm font-bold text-slate-700">
                            <input className="mt-1 h-4 w-4" type="checkbox" checked={answers.experienceEvidence.includes(option.value)} onChange={() => {
                              const next = option.value === "none" ? ["none" as const] : toggleValue(answers.experienceEvidence.filter((item) => item !== "none"), option.value);
                              updateAnswer("experienceEvidence", next);
                            }} />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </FieldGroup>
                  </>
                ) : null}
                <FieldGroup label="Volunteer interest areas">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {projectInterestOptions.map((option) => (
                      <label key={option.value} className="flex items-start gap-2 rounded-lg border border-blue-100 bg-[#f8fbff] p-3 text-sm font-bold text-slate-700">
                        <input className="mt-1 h-4 w-4" type="checkbox" checked={answers.projectInterestAreas.includes(option.value)} onChange={() => updateAnswer("projectInterestAreas", toggleValue(answers.projectInterestAreas, option.value))} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </FieldGroup>
                <FieldGroup label="Do you already have an organisation helping you apply?" hint="For some routes, an approved sending or partner organisation must support the application. It is okay if you are not sure yet.">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {organisationConnectionOptions.map((option) => (
                      <button key={option.value} type="button" className={`min-h-12 rounded-lg border px-4 text-sm font-black ${organisationConnectionStatus === option.value ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`} onClick={() => updateOrganisationConnectionStatus(option.value)}>{option.label}</button>
                    ))}
                  </div>
                </FieldGroup>
              </div>
            ) : null}

            {currentSection.id === "review" ? (
              <div className="mt-5 grid gap-4">
                <FieldGroup label="Are you able to cover basic preparation costs if needed?" hint="Examples can include passport/documents, language exams, embassy/VFS transport and visa-related fees. This does not mean paying TripDoc.">
                  <select className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={answers.preparationReadiness} onChange={(event) => updateAnswer("preparationReadiness", event.target.value as FormAnswers["preparationReadiness"])}>
                    {preparationReadinessOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </FieldGroup>
                {shouldAskAccessibilityAgeException(answers.age) ? (
                  <FieldGroup label="Could an official accessibility/disability age exception apply?" hint="Only answer yes/no. Do not send diagnosis details or private medical information.">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button type="button" className={`min-h-12 rounded-lg border px-4 text-sm font-black ${answers.mayNeedAccessibilityAgeException ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`} onClick={() => updateAnswer("mayNeedAccessibilityAgeException", true)}>Yes, review may be needed</button>
                      <button type="button" className={`min-h-12 rounded-lg border px-4 text-sm font-black ${!answers.mayNeedAccessibilityAgeException ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`} onClick={() => updateAnswer("mayNeedAccessibilityAgeException", false)}>No</button>
                    </div>
                  </FieldGroup>
                ) : null}
                <label className="flex items-start gap-3 rounded-lg border border-blue-100 bg-[#f8fbff] p-4 text-sm font-bold leading-6 text-slate-700">
                  <input className="mt-1 h-4 w-4" type="checkbox" checked={privacyNoticeAccepted} onChange={(event) => setPrivacyNoticeAccepted(event.target.checked)} />
                  <span>I understand this is a rules-based assessment, not a guarantee of placement, sponsorship, visa approval, travel, salary, or immigration outcome.</span>
                </label>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button type="button" className="min-h-12 rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={goBack} disabled={activeSection === 0 || isSubmitting}>Back</button>
              {activeSection < volunteerMatchQuestionSections.length - 1 ? (
                <button type="button" className="min-h-12 rounded-lg border border-[#2952d5] bg-[#2952d5] px-5 text-sm font-black text-white transition hover:bg-[#17307a]" onClick={goNext}>Continue</button>
              ) : (
                <button type="submit" className="min-h-12 rounded-lg border border-[#2952d5] bg-[#2952d5] px-5 text-sm font-black text-white transition hover:bg-[#17307a] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? "Matching routes..." : "Show My Route Matches"}</button>
              )}
            </div>
            {submitError ? <p className="mt-4 rounded-lg border border-amber-200 bg-[#fff8e5] p-4 text-sm font-bold text-[#654d08]">{submitError}</p> : null}
          </div>
        </form>

        {matchResult ? (
          <section id="volunteer-match-results" className="mt-10 scroll-mt-28">
            <div className="mb-5 max-w-3xl">
              <p className="text-sm font-black uppercase text-[#2952d5]">Your transparent route assessment</p>
              <h2 className="mt-2 text-3xl font-black text-[#102033]">Volunteer route results</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                We compared your answers with TripDoc’s currently verified route criteria. Internal numeric scores are not shown because the public outcome should stay understandable and cautious.
              </p>
            </div>

            <div className="grid gap-5">
              <MatchSummaryCard results={matchResult.results} />
              <div className="rounded-lg border border-amber-200 bg-[#fff8e5] p-5 text-sm font-semibold leading-7 text-[#654d08]">
                <strong className="block font-black">Important safety note</strong>
                TripDoc does not guarantee placement, selection, visa approval, travel, residence permission, salary, or migration outcomes. Placement availability and residence/visa feasibility must still be verified through official organisations and responsible authorities.
              </div>
            </div>

            <div className="mt-5 grid gap-5">
              {matchResult.results.map((result) => (
                <ResultCard key={result.routeId} result={result} sessionId={matchResult.sessionId} />
              ))}
            </div>

            <div data-volunteer-screenshot="human-review-cta" className="mt-6 grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(16,32,51,0.08)] sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="m-0 text-2xl font-black text-[#102033]">Still unsure about your result?</h2>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
                  Request a Human Review if your situation involves an exception, unusual residency circumstances, programme-specific conditions, or unclear organisation availability. No payment is collected here.
                </p>
              </div>
              <button type="button" onClick={openHumanReview} className="min-h-12 rounded-lg border border-[#2952d5] bg-[#2952d5] px-5 text-sm font-black text-white transition hover:bg-[#17307a]">
                Request a Human Review
              </button>
            </div>

            {showHumanReview ? (
              <form className="mt-5 grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(16,32,51,0.08)] sm:p-6" onSubmit={submitHumanReview}>
                <div>
                  <p className="text-sm font-black uppercase text-[#2952d5]">Optional contact step</p>
                  <h2 className="mt-2 text-2xl font-black text-[#102033]">Human review request</h2>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
                    Contact details are requested only here, after you choose human review. TripDoc will not automatically subscribe you to marketing.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FieldGroup label="Name">
                    <input className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={reviewForm.name} onChange={(event) => setReviewForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
                  </FieldGroup>
                  <FieldGroup label="Email">
                    <input className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" type="email" value={reviewForm.email} onChange={(event) => setReviewForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" />
                  </FieldGroup>
                  <FieldGroup label="WhatsApp number optional">
                    <input className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={reviewForm.whatsapp} onChange={(event) => setReviewForm((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="Include country code if possible" />
                  </FieldGroup>
                  <FieldGroup label="Preferred contact method">
                    <select className="min-h-12 rounded-lg border border-slate-300 bg-[#f9fbff] px-3 font-semibold" value={reviewForm.preferredContactMethod} onChange={(event) => setReviewForm((current) => ({ ...current, preferredContactMethod: event.target.value as HumanReviewFormState["preferredContactMethod"] }))}>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="either">Either</option>
                    </select>
                  </FieldGroup>
                </div>

                <FieldGroup label="Short note">
                  <textarea className="min-h-32 rounded-lg border border-slate-300 bg-[#f9fbff] p-3 font-semibold leading-7" value={reviewForm.note} onChange={(event) => setReviewForm((current) => ({ ...current, note: event.target.value }))} placeholder="Briefly explain what you want TripDoc to review. Do not include passport numbers, scans, bank statements, diagnosis details, or exact home address." rows={5} />
                </FieldGroup>

                <div className="hidden" aria-hidden="true">
                  <label htmlFor="volunteer-review-website">Website</label>
                  <input id="volunteer-review-website" tabIndex={-1} autoComplete="off" value={reviewForm.website} onChange={(event) => setReviewForm((current) => ({ ...current, website: event.target.value }))} />
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-blue-100 bg-[#f8fbff] p-4 text-sm font-bold leading-6 text-slate-700">
                  <input className="mt-1 h-4 w-4" type="checkbox" checked={reviewForm.consentToContact} onChange={(event) => setReviewForm((current) => ({ ...current, consentToContact: event.target.checked }))} />
                  <span>I consent to TripDoc contacting me about this human review request using the contact details I provided.</span>
                </label>

                {reviewError ? <p className="rounded-lg border border-amber-200 bg-[#fff8e5] p-4 text-sm font-bold text-[#654d08]">{reviewError}</p> : null}
                {reviewMessage ? <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">{reviewMessage}</p> : null}

                <button type="submit" className="min-h-12 justify-self-start rounded-lg border border-[#2952d5] bg-[#2952d5] px-5 text-sm font-black text-white transition hover:bg-[#17307a] disabled:cursor-not-allowed disabled:opacity-60" disabled={isReviewSubmitting}>
                  {isReviewSubmitting ? "Submitting..." : "Submit Human Review Request"}
                </button>
              </form>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}










