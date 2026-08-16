export type SponsorshipStatus =
  | "explicit"
  | "work_permit_support"
  | "approved_sponsor_only"
  | "conditional"
  | "unclear"
  | "none";

export type JobVerificationStatus =
  | "verified"
  | "pending"
  | "draft"
  | "expired";

export type HiringCompanyJobCompany = {
  id: string;
  company_name: string;
  slug: string;
  country?: string | null;
  industry?: string | null;
  careers_url?: string | null;
};

export type HiringCompanyJob = {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  country: string | null;
  city: string | null;
  location: string | null;
  employment_type: string | null;
  work_mode: string | null;
  salary: string | null;
  salary_currency: string | null;
  salary_period: string | null;
  description: string | null;
  eligibility: string | null;
  experience_required: string | null;
  language_requirements: string | null;
  visa_sponsorship_status: SponsorshipStatus | null;
  sponsorship_evidence: string | null;
  sponsorship_source_url: string | null;
  relocation_support: boolean | null;
  work_permit_support: boolean | null;
  official_job_url: string | null;
  application_url: string | null;
  official_source: string | null;
  posted_date: string | null;
  deadline: string | null;
  last_verified: string | null;
  verification_status: JobVerificationStatus | null;
  verification_notes: string | null;
  risk_notes: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  company?: HiringCompanyJobCompany | null;
};

export const SPONSORSHIP_STATUSES: SponsorshipStatus[] = [
  "explicit",
  "work_permit_support",
  "approved_sponsor_only",
  "conditional",
  "unclear",
  "none",
];

export const PUBLIC_SPONSORSHIP_STATUSES: SponsorshipStatus[] = [
  "explicit",
  "work_permit_support",
  "conditional",
  "approved_sponsor_only",
];

export const JOB_VERIFICATION_STATUSES: JobVerificationStatus[] = [
  "verified",
  "pending",
  "draft",
  "expired",
];

export const CONFIRMED_SPONSORSHIP_STATUSES: SponsorshipStatus[] = [
  "explicit",
  "work_permit_support",
];

export const sponsorshipStatusLabels: Record<SponsorshipStatus, string> = {
  explicit: "Visa sponsorship confirmed",
  work_permit_support: "Work-permit support confirmed",
  conditional: "Conditional sponsorship",
  approved_sponsor_only:
    "Approved sponsor - vacancy sponsorship not confirmed",
  unclear: "Sponsorship unclear",
  none: "No sponsorship confirmed",
};

const sponsorshipPriority: Record<SponsorshipStatus, number> = {
  explicit: 1,
  work_permit_support: 2,
  conditional: 3,
  approved_sponsor_only: 4,
  unclear: 5,
  none: 6,
};

export function cleanText(value?: string | null) {
  return value?.trim() || "";
}

export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function isPastDeadline(deadline?: string | null) {
  const cleanDeadline = cleanText(deadline);
  if (!cleanDeadline) return false;

  return cleanDeadline.slice(0, 10) < getTodayDateString();
}

export function isPublicActiveJob(job: Pick<
  HiringCompanyJob,
  | "is_active"
  | "verification_status"
  | "deadline"
  | "last_verified"
  | "visa_sponsorship_status"
>) {
  const status = job.visa_sponsorship_status;

  return (
    job.is_active !== false &&
    job.verification_status === "verified" &&
    Boolean(status && PUBLIC_SPONSORSHIP_STATUSES.includes(status)) &&
    Boolean(cleanText(job.last_verified)) &&
    !isPastDeadline(job.deadline)
  );
}

export function getPublicJobBlockers(job: Pick<
  HiringCompanyJob,
  | "is_active"
  | "verification_status"
  | "deadline"
  | "last_verified"
  | "visa_sponsorship_status"
>) {
  const blockers: string[] = [];
  const status = job.visa_sponsorship_status;

  if (job.verification_status !== "verified") {
    blockers.push(`status is ${job.verification_status || "draft"}`);
  }

  if (job.is_active === false) {
    blockers.push("job is inactive");
  }

  if (!status || !PUBLIC_SPONSORSHIP_STATUSES.includes(status)) {
    blockers.push("sponsorship status is not public-ready");
  }

  if (!cleanText(job.last_verified)) {
    blockers.push("last verified date is missing");
  }

  if (isPastDeadline(job.deadline)) {
    blockers.push("deadline has passed");
  }

  return blockers;
}

export function getSponsorshipLabel(status?: string | null) {
  const normalized = status as SponsorshipStatus;

  return SPONSORSHIP_STATUSES.includes(normalized)
    ? sponsorshipStatusLabels[normalized]
    : sponsorshipStatusLabels.unclear;
}

export function getSponsorshipPriority(status?: string | null) {
  const normalized = status as SponsorshipStatus;

  return SPONSORSHIP_STATUSES.includes(normalized)
    ? sponsorshipPriority[normalized]
    : sponsorshipPriority.unclear;
}

export function isConfirmedSponsorshipStatus(status?: string | null) {
  return CONFIRMED_SPONSORSHIP_STATUSES.includes(status as SponsorshipStatus);
}

export function sortPublicJobs<T extends HiringCompanyJob>(jobs: T[]) {
  return [...jobs].sort((a, b) => {
    const featuredDelta = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
    if (featuredDelta) return featuredDelta;

    const priorityDelta =
      getSponsorshipPriority(a.visa_sponsorship_status) -
      getSponsorshipPriority(b.visa_sponsorship_status);
    if (priorityDelta) return priorityDelta;

    const aDeadline = cleanText(a.deadline) || "9999-12-31";
    const bDeadline = cleanText(b.deadline) || "9999-12-31";
    return aDeadline.localeCompare(bDeadline);
  });
}

export function formatDisplayDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatSalary(job: Pick<
  HiringCompanyJob,
  "salary" | "salary_currency" | "salary_period"
>) {
  const salary = cleanText(job.salary);
  if (!salary) return "";

  const details = [cleanText(job.salary_currency), cleanText(job.salary_period)]
    .filter(Boolean)
    .join(" / ");

  return details ? `${salary} (${details})` : salary;
}
