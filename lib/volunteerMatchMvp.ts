import { z } from "zod";
import {
  acquisitionSourceSchema,
  educationLevelSchema,
  englishLevelSchema,
  experienceEvidenceSchema,
  languageLevelSchema,
  organisationConnectionStatusSchema,
  passportReadinessSchema,
  preparationReadinessSchema,
  projectInterestAreaSchema,
  volunteerExperienceTypeSchema,
  volunteerMatchVerdictSchema,
  volunteerQuestionnaireAnswersSchema,
  volunteerRouteResultSchema,
  type VolunteerCompatibilityDimension,
  type AcquisitionSource,
  type OrganisationConnectionStatus,
  type VolunteerExperienceType,
  type VolunteerQuestionnaireAnswers,
  type VolunteerRouteResult,
} from "./volunteerMatchSchemas";

export const VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION =
  "volunteer-match-privacy-v1";

export const volunteerMatchSourceOptions: {
  value: AcquisitionSource;
  label: string;
  queryAliases: string[];
}[] = [
  { value: "tiktok", label: "TikTok", queryAliases: ["tiktok", "tik-tok"] },
  { value: "youtube", label: "YouTube", queryAliases: ["youtube", "yt"] },
  { value: "instagram", label: "Instagram", queryAliases: ["instagram", "ig"] },
  { value: "facebook", label: "Facebook", queryAliases: ["facebook", "fb"] },
  { value: "linkedin", label: "LinkedIn", queryAliases: ["linkedin"] },
  {
    value: "google",
    label: "Google/Search",
    queryAliases: ["google", "search", "google-search", "google/search"],
  },
  { value: "whatsapp", label: "WhatsApp", queryAliases: ["whatsapp", "wa"] },
  {
    value: "referral",
    label: "Friend/Referral",
    queryAliases: ["referral", "friend", "friends"],
  },
  { value: "other", label: "Other", queryAliases: ["other"] },
];

export const educationOptions = [
  { value: "secondary_school", label: "Secondary school / WAEC or equivalent" },
  { value: "diploma_or_vocational", label: "Diploma or vocational certificate" },
  { value: "bachelor", label: "Bachelor degree" },
  { value: "master_or_higher", label: "Master degree or higher" },
  { value: "other", label: "Other / not completed yet" },
] satisfies { value: z.infer<typeof educationLevelSchema>; label: string }[];

export const germanLevelOptions = [
  { value: "none", label: "No German yet" },
  { value: "learning", label: "Currently learning / willing to start" },
  { value: "a1", label: "A1" },
  { value: "a2", label: "A2" },
  { value: "b1_or_higher", label: "B1 or higher" },
] satisfies { value: z.infer<typeof languageLevelSchema>; label: string }[];

export const englishLevelOptions = [
  { value: "none", label: "No English" },
  { value: "basic", label: "Basic" },
  { value: "working", label: "Working level" },
  { value: "fluent", label: "Fluent" },
] satisfies { value: z.infer<typeof englishLevelSchema>; label: string }[];

export const passportOptions = [
  { value: "valid", label: "I have a valid passport" },
  { value: "in_progress", label: "I am applying or renewing now" },
  { value: "expired", label: "My passport is expired" },
  { value: "none", label: "I do not have a passport yet" },
] satisfies { value: z.infer<typeof passportReadinessSchema>; label: string }[];

export const preparationReadinessOptions = [
  { value: "not_ready", label: "Not ready for costs/documents yet" },
  { value: "needs_guidance", label: "I need guidance first" },
  { value: "some_savings", label: "I have started preparing basic costs" },
  { value: "ready_for_documents", label: "I am ready to prepare documents" },
] satisfies { value: z.infer<typeof preparationReadinessSchema>; label: string }[];

export const volunteerExperienceTypeOptions = [
  { value: "formal", label: "Yes — formal volunteering" },
  {
    value: "informal_community",
    label: "Yes — informal/community experience",
  },
  { value: "none", label: "Not yet" },
] satisfies { value: z.infer<typeof volunteerExperienceTypeSchema>; label: string }[];

export const experienceEvidenceOptions = [
  { value: "reference_letter", label: "Reference letter" },
  { value: "certificate", label: "Certificate" },
  { value: "photos_or_portfolio", label: "Photos or portfolio" },
  { value: "organisation_contact", label: "Organisation contact" },
  { value: "none", label: "No evidence yet" },
] satisfies { value: z.infer<typeof experienceEvidenceSchema>; label: string }[];

export const organisationConnectionOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "I’m not sure" },
] satisfies { value: z.infer<typeof organisationConnectionStatusSchema>; label: string }[];

export const projectInterestOptions = [
  { value: "social", label: "Social service" },
  { value: "education", label: "Education" },
  { value: "environment", label: "Environment" },
  { value: "youth", label: "Youth work" },
  { value: "culture", label: "Culture" },
  { value: "peace", label: "Peace/community exchange" },
  { value: "heritage", label: "Heritage" },
  { value: "community", label: "Community work" },
  { value: "other", label: "Other" },
] satisfies { value: z.infer<typeof projectInterestAreaSchema>; label: string }[];

export const volunteerMatchQuestionSections = [
  {
    id: "basics",
    title: "Basic profile",
    description: "Start with age and standardized country details so results stay consistent.",
    fields: ["acquisitionSource", "age", "citizenship", "residenceCountry"],
  },
  {
    id: "education",
    title: "Education and route readiness",
    description: "Germany volunteer routes often require completed school or a similar qualification.",
    fields: ["educationLevel", "completedCompulsorySchooling", "preferredStartYear"],
  },
  {
    id: "language-documents",
    title: "Language and documents",
    description: "Most routes need at least early German preparation and basic document readiness.",
    fields: ["germanLevel", "willingToLearnGerman", "englishLevel", "passportReadiness"],
  },
  {
    id: "experience",
    title: "Experience and interests",
    description: "Volunteer or community experience can strengthen your route fit, but evidence matters.",
    fields: [
      "volunteerExperienceType",
      "hasVolunteerExperience",
      "volunteerExperienceMonths",
      "experienceEvidence",
      "projectInterestAreas",
      "hasSendingOrganisationConnection",
      "organisationConnectionStatus",
    ],
  },
  {
    id: "review",
    title: "Final checks",
    description: "Confirm preparation readiness and acknowledge the safety notice before matching.",
    fields: [
      "preparationReadiness",
      "mayNeedAccessibilityAgeException",
      "privacyNoticeAccepted",
    ],
  },
] as const;

export const volunteerMatchSubmissionSchema = z
  .object({
    answers: volunteerQuestionnaireAnswersSchema,
    privacyNoticeAccepted: z.boolean(),
  })
  .strict()
  .superRefine((submission, ctx) => {
    if (!submission.privacyNoticeAccepted) {
      ctx.addIssue({
        code: "custom",
        path: ["privacyNoticeAccepted"],
        message: "Please confirm the TripDoc Volunteer Match notice before continuing.",
      });
    }
  });

function normalizeSourceValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function parseVolunteerAcquisitionSource(
  value: unknown,
  fallback: AcquisitionSource = "other"
): AcquisitionSource {
  if (typeof value !== "string") return fallback;

  const normalized = normalizeSourceValue(value);
  const match = volunteerMatchSourceOptions.find((option) =>
    option.queryAliases.includes(normalized)
  );

  return match?.value || fallback;
}

export function getVolunteerSourceLabel(source: AcquisitionSource) {
  return (
    volunteerMatchSourceOptions.find((option) => option.value === source)?.label ||
    "Other"
  );
}

export function isKnownVolunteerAcquisitionSource(value: unknown) {
  if (typeof value !== "string") return false;

  const normalized = normalizeSourceValue(value);
  return volunteerMatchSourceOptions.some((option) =>
    option.queryAliases.includes(normalized)
  );
}

export function shouldAskVolunteerAcquisitionSource(isInitialSourceKnown: boolean) {
  return !isInitialSourceKnown;
}

export function isGermanA1OrHigher(
  germanLevel: z.infer<typeof languageLevelSchema>
) {
  return ["a1", "a2", "b1_or_higher"].includes(germanLevel);
}

export function shouldAskGermanA1Readiness(
  germanLevel: z.infer<typeof languageLevelSchema>
) {
  return germanLevel === "none";
}

export function getVolunteerExperienceType(
  answers: Pick<VolunteerQuestionnaireAnswers, "volunteerExperienceType" | "hasVolunteerExperience">
): VolunteerExperienceType {
  if (answers.volunteerExperienceType) return answers.volunteerExperienceType;
  return answers.hasVolunteerExperience ? "formal" : "none";
}

export function hasAnyVolunteerExperience(
  answers: Pick<VolunteerQuestionnaireAnswers, "volunteerExperienceType" | "hasVolunteerExperience">
) {
  return getVolunteerExperienceType(answers) !== "none";
}

export function shouldAskVolunteerExperienceDetails(
  answers: Pick<VolunteerQuestionnaireAnswers, "volunteerExperienceType" | "hasVolunteerExperience">
) {
  return hasAnyVolunteerExperience(answers);
}

export function getOrganisationConnectionStatus(
  answers: Pick<VolunteerQuestionnaireAnswers, "organisationConnectionStatus" | "hasSendingOrganisationConnection">
): OrganisationConnectionStatus {
  if (answers.organisationConnectionStatus) return answers.organisationConnectionStatus;
  if (answers.hasSendingOrganisationConnection === true) return "yes";
  if (answers.hasSendingOrganisationConnection === false) return "no";
  return "unsure";
}

export function getHasSendingOrganisationConnection(
  status: OrganisationConnectionStatus
) {
  if (status === "yes") return true;
  if (status === "no") return false;
  return null;
}

export function shouldAskAccessibilityAgeException(age: number) {
  return age >= 29 && age <= 35;
}

export function getVisibleVolunteerQuestionFields(
  answers: VolunteerQuestionnaireAnswers,
  options: { isInitialSourceKnown?: boolean } = {}
) {
  const visibleFields: string[] = [];

  volunteerMatchQuestionSections.forEach((section) => {
    section.fields.forEach((field) => {
      if (
        field === "acquisitionSource" &&
        !shouldAskVolunteerAcquisitionSource(Boolean(options.isInitialSourceKnown))
      ) {
        return;
      }

      if (
        field === "willingToLearnGerman" &&
        !shouldAskGermanA1Readiness(answers.germanLevel)
      ) {
        return;
      }

      if (
        (field === "volunteerExperienceMonths" || field === "experienceEvidence") &&
        !shouldAskVolunteerExperienceDetails(answers)
      ) {
        return;
      }

      if (field === "hasVolunteerExperience") {
        return;
      }

      if (field === "hasSendingOrganisationConnection") {
        return;
      }

      if (
        field === "mayNeedAccessibilityAgeException" &&
        !shouldAskAccessibilityAgeException(answers.age)
      ) {
        return;
      }

      visibleFields.push(field);
    });
  });

  return visibleFields;
}

export function getVisibleVolunteerQuestionCount(
  answers: VolunteerQuestionnaireAnswers,
  options: { isInitialSourceKnown?: boolean } = {}
) {
  return getVisibleVolunteerQuestionFields(answers, options).length;
}

export function normalizeVolunteerMatchAnswers(
  answers: VolunteerQuestionnaireAnswers
): VolunteerQuestionnaireAnswers {
  const safeAnswers = volunteerQuestionnaireAnswersSchema.parse(answers);
  const volunteerExperienceType = getVolunteerExperienceType(safeAnswers);
  const hasVolunteerExperience = volunteerExperienceType !== "none";
  const organisationConnectionStatus = getOrganisationConnectionStatus(safeAnswers);
  const shouldAskGermanReadiness = shouldAskGermanA1Readiness(safeAnswers.germanLevel);
  const willingToLearnGerman = shouldAskGermanReadiness
    ? safeAnswers.willingToLearnGerman
    : safeAnswers.germanLevel === "learning" || isGermanA1OrHigher(safeAnswers.germanLevel);

  const normalizedEvidence = safeAnswers.experienceEvidence.includes("none")
    ? ["none" as const]
    : safeAnswers.experienceEvidence;

  return volunteerQuestionnaireAnswersSchema.parse({
    ...safeAnswers,
    educationLevel: safeAnswers.completedCompulsorySchooling
      ? safeAnswers.educationLevel
      : "other",
    germanLevel:
      safeAnswers.germanLevel === "none" && willingToLearnGerman
        ? "learning"
        : safeAnswers.germanLevel,
    willingToLearnGerman,
    volunteerExperienceType,
    hasVolunteerExperience,
    volunteerExperienceMonths: hasVolunteerExperience
      ? safeAnswers.volunteerExperienceMonths
      : 0,
    experienceEvidence: hasVolunteerExperience ? normalizedEvidence : ["none"],
    organisationConnectionStatus,
    hasSendingOrganisationConnection: getHasSendingOrganisationConnection(
      organisationConnectionStatus
    ),
    mayNeedAccessibilityAgeException: shouldAskAccessibilityAgeException(safeAnswers.age)
      ? safeAnswers.mayNeedAccessibilityAgeException
      : false,
  });
}

export function parseVolunteerMatchSubmission(value: unknown) {
  const submission = volunteerMatchSubmissionSchema.parse(value);

  return {
    ...submission,
    answers: normalizeVolunteerMatchAnswers(submission.answers),
  };
}

export const volunteerLinkedOpportunitySchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    country: z.string().nullable(),
    type: z.string().nullable(),
    fundingType: z.string().nullable(),
    deadline: z.string().nullable(),
    relationshipType: z.string().trim().min(1),
  })
  .strict();

const publicRouteResultBaseSchema = volunteerRouteResultSchema.omit({
  internalScore: true,
});

export const volunteerDimensionStatusValues = [
  "Looks compatible",
  "Preparation needed",
  "Needs verification",
  "Weak fit",
] as const;

export const volunteerRouteDimensionStatusesSchema = z
  .object({
    profileFit: z.enum(volunteerDimensionStatusValues),
    routeFit: z.enum(volunteerDimensionStatusValues),
    placementAvailability: z.enum(volunteerDimensionStatusValues),
    residenceVisaFeasibility: z.enum(volunteerDimensionStatusValues),
  })
  .strict();

export const volunteerMatchPublicResultSchema = publicRouteResultBaseSchema
  .extend({
    dimensionStatuses: volunteerRouteDimensionStatusesSchema,
    linkedOpportunities: z.array(volunteerLinkedOpportunitySchema).default([]),
    unresolvedNotes: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const volunteerMatchResponseSchema = z
  .object({
    success: z.literal(true),
    sessionId: z.string().uuid(),
    acquisitionSource: acquisitionSourceSchema,
    privacyNoticeVersion: z.literal(VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION),
    results: z.array(volunteerMatchPublicResultSchema),
  })
  .strict();

export type VolunteerMatchPublicResult = z.infer<
  typeof volunteerMatchPublicResultSchema
>;
export type VolunteerLinkedOpportunity = z.infer<
  typeof volunteerLinkedOpportunitySchema
>;
export type VolunteerMatchResponse = z.infer<typeof volunteerMatchResponseSchema>;
export type VolunteerDimensionStatus = z.infer<
  typeof volunteerRouteDimensionStatusesSchema
>[keyof z.infer<typeof volunteerRouteDimensionStatusesSchema>];

const verificationDefaultDimensions = new Set<VolunteerCompatibilityDimension>([
  "placement_availability",
  "immigration_residence_feasibility",
]);

function getDimensionStatus({
  result,
  dimension,
}: {
  result: VolunteerRouteResult;
  dimension: VolunteerCompatibilityDimension;
}): VolunteerDimensionStatus {
  const hasBlocker = result.blockers.some((item) => item.dimension === dimension);
  if (hasBlocker) return "Weak fit";

  const hasVerificationNeed = result.humanReviewReasons.some(
    (item) => item.dimension === dimension
  );
  if (hasVerificationNeed) return "Needs verification";

  const hasPreparationNeed = result.nextSteps.some(
    (item) => item.dimension === dimension
  );
  if (hasPreparationNeed) return "Preparation needed";

  const hasFitSignal = result.reasons.some((item) => item.dimension === dimension);
  if (hasFitSignal) return "Looks compatible";

  return verificationDefaultDimensions.has(dimension)
    ? "Needs verification"
    : "Preparation needed";
}

export function buildVolunteerRouteDimensionStatuses(
  result: VolunteerRouteResult
): z.infer<typeof volunteerRouteDimensionStatusesSchema> {
  return volunteerRouteDimensionStatusesSchema.parse({
    profileFit: getDimensionStatus({
      result,
      dimension: "profile_compatibility",
    }),
    routeFit: getDimensionStatus({
      result,
      dimension: "route_compatibility",
    }),
    placementAvailability: getDimensionStatus({
      result,
      dimension: "placement_availability",
    }),
    residenceVisaFeasibility: getDimensionStatus({
      result,
      dimension: "immigration_residence_feasibility",
    }),
  });
}

function toSummaryRoute(result: VolunteerMatchPublicResult) {
  return {
    routeName: result.routeName,
    routeSlug: result.routeSlug,
    verdict: result.verdict,
  };
}

export function buildVolunteerMatchSummary(results: VolunteerMatchPublicResult[]) {
  const priorityRoutes = results.filter((result) =>
    ["Strong Potential", "Potential — Preparation Needed"].includes(result.verdict)
  );
  const reviewRoutes = results.filter(
    (result) => result.verdict === "Needs Human Review"
  );
  const weakRoutes = results.filter(
    (result) => result.verdict === "Currently Weak Fit"
  );
  const bestRoute = priorityRoutes[0] || reviewRoutes[0] || results[0] || null;
  const alsoWorthConsidering =
    priorityRoutes.find((result) => result.routeId !== bestRoute?.routeId) ||
    reviewRoutes.find((result) => result.routeId !== bestRoute?.routeId) ||
    null;
  const remainingCount = Math.max(
    0,
    results.length - [bestRoute, alsoWorthConsidering].filter(Boolean).length
  );
  const otherParts: string[] = [];

  if (remainingCount > 0) {
    otherParts.push(
      `${remainingCount} ${remainingCount === 1 ? "route" : "routes"} left to compare`
    );
  }

  if (reviewRoutes.length > 0) {
    otherParts.push(
      `${reviewRoutes.length} ${reviewRoutes.length === 1 ? "route needs" : "routes need"} individual review`
    );
  }

  if (weakRoutes.length > 0) {
    otherParts.push(
      `${weakRoutes.length} ${weakRoutes.length === 1 ? "route is" : "routes are"} currently weak fit`
    );
  }

  return {
    priorityCount: priorityRoutes.length,
    headline:
      priorityRoutes.length === 1
        ? "1 route looks worth prioritising."
        : `${priorityRoutes.length} routes look worth prioritising.`,
    bestRoute: bestRoute ? toSummaryRoute(bestRoute) : null,
    alsoWorthConsidering: alsoWorthConsidering
      ? toSummaryRoute(alsoWorthConsidering)
      : null,
    otherRoutesText:
      otherParts.length > 0
        ? otherParts.join(" · ")
        : "No additional routes were returned.",
  };
}

export function getUnresolvedNotes(result: VolunteerRouteResult) {
  const dimensions = new Set(
    result.humanReviewReasons.map((reason) => reason.dimension)
  );
  const notes: string[] = [];

  if (dimensions.has("placement_availability")) {
    notes.push(
      "Current placement or organisation availability still needs verification with the official route or host organisation."
    );
  }

  if (dimensions.has("immigration_residence_feasibility")) {
    notes.push(
      "Immigration, residence, visa, or work-authorisation feasibility remains separate from programme fit and must be verified with official authorities."
    );
  }

  if (result.source.isVerificationStale) {
    notes.push(
      "This rule version is overdue for re-verification, so treat the result as a review-needed signal."
    );
  }

  return notes;
}

export function toVolunteerMatchPublicResult({
  result,
  linkedOpportunities = [],
}: {
  result: VolunteerRouteResult;
  linkedOpportunities?: VolunteerLinkedOpportunity[];
}): VolunteerMatchPublicResult {
  const publicResult = publicRouteResultBaseSchema.parse({
    routeId: result.routeId,
    routeSlug: result.routeSlug,
    routeName: result.routeName,
    verdict: result.verdict,
    reasons: result.reasons,
    blockers: result.blockers,
    nextSteps: result.nextSteps,
    humanReviewReasons: result.humanReviewReasons,
    source: result.source,
    ruleVersionId: result.ruleVersionId,
    ruleVersionNumber: result.ruleVersionNumber,
  });

  return volunteerMatchPublicResultSchema.parse({
    ...publicResult,
    dimensionStatuses: buildVolunteerRouteDimensionStatuses(result),
    linkedOpportunities,
    unresolvedNotes: getUnresolvedNotes(result),
  });
}

export function buildVolunteerMatchResponse({
  sessionId,
  acquisitionSource,
  results,
  linkedOpportunitiesByRouteId,
}: {
  sessionId: string;
  acquisitionSource: AcquisitionSource;
  results: VolunteerRouteResult[];
  linkedOpportunitiesByRouteId: Map<string, VolunteerLinkedOpportunity[]>;
}): VolunteerMatchResponse {
  return volunteerMatchResponseSchema.parse({
    success: true,
    sessionId,
    acquisitionSource,
    privacyNoticeVersion: VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION,
    results: results.map((result) =>
      toVolunteerMatchPublicResult({
        result,
        linkedOpportunities:
          linkedOpportunitiesByRouteId.get(result.routeId) || [],
      })
    ),
  });
}

export const volunteerMatchClientEventNameSchema = z.enum([
  "matching_opportunity_clicked",
  "human_review_clicked",
]);

export const volunteerMatchClientEventSchema = z
  .object({
    eventName: volunteerMatchClientEventNameSchema,
    sessionId: z.string().uuid(),
    routeId: z.string().uuid().optional(),
    programId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((event, ctx) => {
    if (event.eventName === "matching_opportunity_clicked") {
      if (!event.routeId) {
        ctx.addIssue({
          code: "custom",
          path: ["routeId"],
          message: "Route id is required for opportunity click events.",
        });
      }

      if (!event.programId) {
        ctx.addIssue({
          code: "custom",
          path: ["programId"],
          message: "Program id is required for opportunity click events.",
        });
      }
    }
  });

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().max(max).optional()
  );

const optionalEmail = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed || undefined;
  },
  z.string().email().max(160).optional()
);

export const humanReviewPreferredContactMethodSchema = z.enum([
  "email",
  "whatsapp",
  "either",
]);

const humanReviewHoneypotSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.literal("").optional().default("")
);

export const volunteerHumanReviewSubmissionSchema = z
  .object({
    sessionId: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    email: optionalEmail,
    whatsapp: optionalText(60),
    preferredContactMethod: humanReviewPreferredContactMethodSchema,
    note: optionalText(1200),
    website: humanReviewHoneypotSchema,
    consentToContact: z.boolean(),
    privacyNoticeVersion: z
      .literal(VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION)
      .default(VOLUNTEER_MATCH_PRIVACY_NOTICE_VERSION),
  })
  .strict()
  .superRefine((submission, ctx) => {
    const hasEmail = Boolean(submission.email);
    const hasWhatsapp = Boolean(submission.whatsapp);

    if (!submission.consentToContact) {
      ctx.addIssue({
        code: "custom",
        path: ["consentToContact"],
        message: "Consent to contact is required before requesting human review.",
      });
    }

    if (!hasEmail && !hasWhatsapp) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Provide either an email address or WhatsApp number.",
      });
    }

    if (submission.preferredContactMethod === "email" && !hasEmail) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email is required when email is the preferred contact method.",
      });
    }

    if (submission.preferredContactMethod === "whatsapp" && !hasWhatsapp) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsapp"],
        message:
          "WhatsApp number is required when WhatsApp is the preferred contact method.",
      });
    }
  });

export type VolunteerHumanReviewSubmission = z.infer<
  typeof volunteerHumanReviewSubmissionSchema
>;

export function buildHumanReviewMessage({ note }: { note?: string }) {
  const trimmedNote = note?.trim();
  return trimmedNote ? `Applicant note: ${trimmedNote}` : null;
}

export function buildHumanReviewRequestInsertPayload({
  submission,
  consentedAt,
}: {
  submission: VolunteerHumanReviewSubmission;
  consentedAt: string;
}) {
  return {
    session_id: submission.sessionId,
    name: submission.name,
    email: submission.email || null,
    whatsapp: submission.whatsapp || null,
    preferred_contact_method: submission.preferredContactMethod,
    message: buildHumanReviewMessage({ note: submission.note }),
    consent_to_contact: submission.consentToContact,
    consented_at: consentedAt,
    privacy_notice_version: submission.privacyNoticeVersion,
    status: "new",
  };
}

export function getVerdictClassName(verdict: z.infer<typeof volunteerMatchVerdictSchema>) {
  switch (verdict) {
    case "Strong Potential":
      return "strong";
    case "Potential — Preparation Needed":
      return "potential";
    case "Needs Human Review":
      return "review";
    case "Currently Weak Fit":
      return "weak";
    default:
      return "review";
  }
}


