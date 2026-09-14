import { z } from "zod";

export const publishingStatusValues = ["draft", "published", "archived"] as const;
export const verificationStatusValues = [
  "needs_review",
  "verified",
  "conflicting_evidence",
] as const;
export const availabilityStatusValues = ["open", "closed", "rolling", "unknown"] as const;
export const deadlineModeValues = ["fixed_date", "rolling", "unknown"] as const;
export const sponsorshipStatusValues = ["confirmed", "not_offered", "unclear"] as const;

export type PublishingStatus = (typeof publishingStatusValues)[number];
export type VerificationStatus = (typeof verificationStatusValues)[number];
export type AvailabilityStatus = (typeof availabilityStatusValues)[number];
export type DeadlineMode = (typeof deadlineModeValues)[number];
export type SponsorshipStatus = (typeof sponsorshipStatusValues)[number];

export type ApplicationStep = {
  id: string;
  label: string;
  instructions: string;
  url: string | null;
  required: boolean;
};

export type SourceLink = {
  id: string;
  label: string;
  url: string;
};

export type ProgramAdminPayload = {
  title: string;
  slug: string;
  organisation: string | null;
  country: string | null;
  type: string | null;
  funding_type: string | null;
  deadline: string | null;
  deadline_mode: DeadlineMode;
  deadline_time: string | null;
  deadline_timezone: string | null;
  official_url: string | null;
  additional_application_steps: ApplicationStep[];
  image_url: string | null;
  image_alt: string | null;
  description: string | null;
  publishing_status: PublishingStatus;
  verification_status: VerificationStatus;
  availability_status: AvailabilityStatus;
  featured: boolean;
  funding_amount: number | null;
  funding_currency: string | null;
  funding_coverage: string | null;
  applicant_costs: string | null;
  official_source_links: SourceLink[];
  reviewer_name: string | null;
  verified_at: string | null;
  evidence_notes: string | null;
  private_reviewer_notes: string | null;
  sponsorship_status: SponsorshipStatus;
  sponsorship_evidence: string | null;
  sponsorship_source_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

export type ProgramVisibilityRecord = {
  publishing_status?: string | null;
  verification_status?: string | null;
  availability_status?: string | null;
  deadline?: string | null;
  deadline_mode?: string | null;
  deadline_time?: string | null;
  deadline_timezone?: string | null;
};

export type PublicProgramRecord<T extends Record<string, unknown>> = Omit<
  T,
  "private_reviewer_notes"
>;

const trimToNull = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const trimToString = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export function generateOpportunitySlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isSafeHttpUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function safeMarkdownUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value, "https://app.tripdoc.net");
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
      return value;
    }
  } catch {
    if (value.startsWith("/") && !value.startsWith("//")) return value;
  }

  return "";
}

export function normalizePublishingStatus(value: unknown): PublishingStatus {
  if (value === "published" || value === "archived" || value === "draft") {
    return value;
  }

  return "draft";
}

export function normalizeVerificationStatus(value: unknown): VerificationStatus {
  if (value === "verified" || value === "conflicting_evidence") return value;

  if (
    value === "needs_review" ||
    value === "pending" ||
    value === "draft" ||
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "needs_review";
  }

  return "needs_review";
}

export function normalizeAvailabilityStatus(value: unknown): AvailabilityStatus {
  if (value === "open" || value === "closed" || value === "rolling") return value;
  return "unknown";
}

export function normalizeDeadlineMode(value: unknown): DeadlineMode {
  if (value === "fixed_date" || value === "rolling") return value;
  return "unknown";
}

export function normalizeSponsorshipStatus(value: unknown): SponsorshipStatus {
  if (value === "confirmed" || value === "not_offered") return value;
  return "unclear";
}

const applicationStepSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  required: z.boolean().optional(),
});

const sourceLinkSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
});

function stableId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

export function normalizeApplicationSteps(value: unknown): ApplicationStep[] {
  const parsed = z.array(applicationStepSchema).safeParse(value);
  if (!parsed.success) return [];

  return parsed.data
    .map((step, index) => ({
      id: trimToString(step.id) || stableId("step", index),
      label: trimToString(step.label) || `Application step ${index + 1}`,
      instructions: trimToString(step.instructions),
      url: trimToNull(step.url),
      required: Boolean(step.required),
    }))
    .filter((step) => step.label || step.instructions || step.url);
}

export function normalizeSourceLinks(value: unknown): SourceLink[] {
  const parsed = z.array(sourceLinkSchema).safeParse(value);
  if (!parsed.success) return [];

  return parsed.data
    .map((source, index) => ({
      id: trimToString(source.id) || stableId("source", index),
      label: trimToString(source.label) || `Official source ${index + 1}`,
      url: trimToString(source.url),
    }))
    .filter((source) => source.url);
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function isDateOnly(value: string | null) {
  return !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
}

// A date without a published timezone stays active until that date has ended
// everywhere (UTC-12). This grace period avoids inventing an exact closing time.
export function isDeadlinePassed(
  deadline: string | null | undefined,
  deadlineMode: string | null | undefined,
  now = new Date(),
  time?: string | null,
  timezone?: string | null
) {
  if (!deadline || !isDateOnly(deadline) || deadlineMode === "rolling" || deadlineMode === "unknown") return false;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "Etc/GMT+12", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(now);
    const part = (name: string) => parts.find(p => p.type === name)?.value;
    const date = `${part("year")}-${part("month")}-${part("day")}`;
    const clock = `${part("hour")}:${part("minute")}:${part("second")}`;
    const closing = time ? (time.length === 5 ? `${time}:00` : time) : "23:59:59";
    return date > deadline || (date === deadline && clock > closing);
  } catch { return false; }
}

export function isPublicProgramDetailVisible(program: ProgramVisibilityRecord) {
  if (program.publishing_status === "draft") return false;

  if (program.publishing_status === "published" || program.publishing_status === "archived") {
    return true;
  }

  return program.verification_status === "verified";
}

export function isPublicProgramListVisible(
  program: ProgramVisibilityRecord,
  now: Date | number = new Date()
) {
  if (!isPublicProgramDetailVisible(program)) return false;
  if (program.publishing_status === "archived") return false;
  if (program.availability_status === "closed") return false;
  return !isDeadlinePassed(program.deadline, program.deadline_mode || "fixed_date", now instanceof Date ? now : new Date(), program.deadline_time, program.deadline_timezone);
}

export function omitPrivateProgramFields<T extends Record<string, unknown>>(
  program: T
): PublicProgramRecord<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { private_reviewer_notes: _privateReviewerNotes, ...publicProgram } = program;
  return publicProgram;
}

export function validateProgramAdminPayload(input: unknown) {
  const body = (input || {}) as Record<string, unknown>;

  const title = trimToString(body.title);
  const slug = generateOpportunitySlug(trimToString(body.slug) || title);
  const publishingStatus = normalizePublishingStatus(body.publishing_status);
  const verificationStatus = normalizeVerificationStatus(body.verification_status);
  const availabilityStatus = normalizeAvailabilityStatus(body.availability_status);
  const deadlineMode = normalizeDeadlineMode(body.deadline_mode);
  const officialUrl = trimToNull(body.official_url);
  const imageUrl = trimToNull(body.image_url);
  const sponsorshipSourceUrl = trimToNull(body.sponsorship_source_url);
  const applicationSteps = normalizeApplicationSteps(body.additional_application_steps);
  const sourceLinks = normalizeSourceLinks(body.official_source_links);
  const verifiedAt = trimToNull(body.verified_at);
  const reviewerName = trimToNull(body.reviewer_name);
  const evidenceNotes = trimToNull(body.evidence_notes);
  const deadline = trimToNull(body.deadline);

  const payload: ProgramAdminPayload = {
    title,
    slug,
    organisation: trimToNull(body.organisation),
    country: trimToNull(body.country),
    type: trimToNull(body.type),
    funding_type: trimToNull(body.funding_type),
    deadline,
    deadline_mode: deadlineMode,
    deadline_time: trimToNull(body.deadline_time),
    deadline_timezone: trimToNull(body.deadline_timezone),
    official_url: officialUrl,
    additional_application_steps: applicationSteps,
    image_url: imageUrl,
    image_alt: trimToNull(body.image_alt),
    description: trimToNull(body.description),
    publishing_status: publishingStatus,
    verification_status: verificationStatus,
    availability_status: availabilityStatus,
    featured: Boolean(body.featured),
    funding_amount: normalizeNumber(body.funding_amount),
    funding_currency: trimToNull(body.funding_currency),
    funding_coverage: trimToNull(body.funding_coverage),
    applicant_costs: trimToNull(body.applicant_costs),
    official_source_links: sourceLinks,
    reviewer_name: reviewerName,
    verified_at: verifiedAt,
    evidence_notes: evidenceNotes,
    private_reviewer_notes: trimToNull(body.private_reviewer_notes),
    sponsorship_status: normalizeSponsorshipStatus(body.sponsorship_status),
    sponsorship_evidence: trimToNull(body.sponsorship_evidence),
    sponsorship_source_url: sponsorshipSourceUrl,
    seo_title: trimToNull(body.seo_title),
    seo_description: trimToNull(body.seo_description),
  };

  const errors: string[] = [];
  const warnings: string[] = [];
  const enumFields = { publishing_status: publishingStatusValues, verification_status: verificationStatusValues,
    availability_status: availabilityStatusValues, deadline_mode: deadlineModeValues, sponsorship_status: sponsorshipStatusValues };
  for (const [field, allowed] of Object.entries(enumFields)) {
    if (body[field] != null && !(allowed as readonly unknown[]).includes(body[field])) errors.push(`Invalid ${field.replaceAll("_", " ")}.`);
  }
  if (body.additional_application_steps != null && !z.array(applicationStepSchema).max(30).safeParse(body.additional_application_steps).success) errors.push("Application steps must be a list of at most 30 valid steps.");
  if (body.official_source_links != null && !z.array(sourceLinkSchema).max(30).safeParse(body.official_source_links).success) errors.push("Official sources must be a list of at most 30 valid sources.");
  if (body.featured != null && typeof body.featured !== "boolean") errors.push("Featured must be true or false.");
  if (body.funding_amount != null && body.funding_amount !== "" && (payload.funding_amount === null || payload.funding_amount > 9999999999.99)) errors.push("Funding amount must be a non-negative number below 10 billion.");
  if (payload.funding_currency && !/^[A-Za-z]{3}$/.test(payload.funding_currency)) errors.push("Use a three-letter funding currency, for example USD.");
  if (payload.funding_currency) payload.funding_currency = payload.funding_currency.toUpperCase();
  if (payload.deadline_time && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(payload.deadline_time)) errors.push("Deadline time must be HH:MM in 24-hour format.");
  if (payload.deadline_time && !payload.deadline_timezone) errors.push("A closing time requires the official timezone.");
  if (payload.deadline_timezone) {
    try { new Intl.DateTimeFormat("en", { timeZone: payload.deadline_timezone }).format(); }
    catch { errors.push("Use a valid timezone, for example Europe/Berlin or Asia/Seoul."); }
  }
  if (verifiedAt && (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(verifiedAt) || !isDateOnly(verifiedAt.slice(0,10)) || Number.isNaN(Date.parse(verifiedAt)) || Date.parse(verifiedAt) > Date.now())) errors.push("Verification date must be a valid date that is not in the future.");
  if (payload.sponsorship_status === "confirmed" && (!payload.sponsorship_evidence || !sponsorshipSourceUrl)) errors.push("Confirmed sponsorship requires vacancy-specific evidence and its source URL.");
  if (title.length > 300 || slug.length > 250) errors.push("Title or slug is too long.");
  if ((payload.description?.length || 0) > 100000) errors.push("Description must be under 100,000 characters.");
  if (payload.image_url && !payload.image_alt) warnings.push("Add descriptive image alternative text.");


  if (!title) errors.push("Title is required.");
  if (!slug) errors.push("Slug is required.");
  if (publishingStatus !== "draft" && !payload.type) errors.push("Type is required before publishing.");

  if (officialUrl && !isSafeHttpUrl(officialUrl)) {
    errors.push("Primary application URL must be a valid http/https link.");
  }

  if (imageUrl && !isSafeHttpUrl(imageUrl)) {
    errors.push("Image URL must be a valid http/https link.");
  }

  if (sponsorshipSourceUrl && !isSafeHttpUrl(sponsorshipSourceUrl)) {
    errors.push("Sponsorship source URL must be a valid http/https link.");
  }

  for (const step of applicationSteps) {
    if (step.url && !isSafeHttpUrl(step.url)) {
      errors.push(`Application step "${step.label}" has an invalid URL.`);
    }

    if (step.required && !step.instructions && !step.url) {
      errors.push(`Required application step "${step.label}" needs instructions or a URL.`);
    }
  }

  for (const source of sourceLinks) {
    if (!isSafeHttpUrl(source.url)) {
      errors.push(`Official source "${source.label}" has an invalid URL.`);
    }
  }

  if (deadline && !isDateOnly(deadline)) {
    errors.push("Deadline must be a date-only value in YYYY-MM-DD format.");
  }

  if (publishingStatus !== "draft") {
    if (!payload.country) warnings.push("Country is missing.");
    if (!payload.description) errors.push("Description is required before publishing.");
    if (!officialUrl && applicationSteps.length === 0) {
      if (availabilityStatus !== "closed" && publishingStatus === "published") errors.push("Add the primary application URL or application steps before publishing.");
    }
    if (deadlineMode === "fixed_date" && !deadline) {
      errors.push("Set the deadline date or choose rolling / unknown.");
    }
  }

  if (verificationStatus === "verified") {
    if (!reviewerName) errors.push("Verified records require a reviewer.");
    if (!verifiedAt) errors.push("Verified records require an actual verification date.");
    if (sourceLinks.length === 0) {
      errors.push("Verified records require at least one official source link.");
    }
  }

  if (deadline && isDeadlinePassed(deadline, deadlineMode, new Date(), payload.deadline_time, payload.deadline_timezone)) {
    warnings.push("Deadline has passed. The opportunity should be marked closed or archived.");
  }

  return {
    payload,
    errors,
    warnings,
  };
}
