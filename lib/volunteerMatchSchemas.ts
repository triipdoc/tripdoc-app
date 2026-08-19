import { z } from "zod";
import { volunteerCountryCodeSchema } from "./volunteerMatchCountries";

export const volunteerMatchVerdicts = [
  "Strong Potential",
  "Potential — Preparation Needed",
  "Currently Weak Fit",
  "Needs Human Review",
] as const;

export const acquisitionSources = [
  "tiktok",
  "youtube",
  "instagram",
  "facebook",
  "linkedin",
  "google",
  "whatsapp",
  "referral",
  "other",
] as const;

export const educationLevels = [
  "secondary_school",
  "diploma_or_vocational",
  "bachelor",
  "master_or_higher",
  "other",
] as const;

export const languageLevels = [
  "none",
  "learning",
  "a1",
  "a2",
  "b1_or_higher",
] as const;

export const englishLevels = ["none", "basic", "working", "fluent"] as const;

export const passportReadinessValues = [
  "valid",
  "expired",
  "in_progress",
  "none",
] as const;

export const preparationReadinessValues = [
  "not_ready",
  "needs_guidance",
  "some_savings",
  "ready_for_documents",
] as const;

export const experienceEvidenceValues = [
  "reference_letter",
  "certificate",
  "photos_or_portfolio",
  "organisation_contact",
  "none",
] as const;

export const volunteerExperienceTypes = [
  "formal",
  "informal_community",
  "none",
] as const;

export const organisationConnectionStatuses = ["yes", "no", "unsure"] as const;

export const projectInterestAreas = [
  "social",
  "education",
  "environment",
  "youth",
  "culture",
  "peace",
  "heritage",
  "community",
  "other",
] as const;

export const volunteerRouteFamilies = [
  "weltwaerts_south_north",
  "bfd",
  "fsj",
  "foej",
  "sci_long_term",
  "sci_workcamp",
  "other_verified_route",
] as const;

export const volunteerRuleCategories = [
  "age",
  "citizenship",
  "residence",
  "education",
  "language",
  "passport_readiness",
  "volunteer_experience",
  "evidence_of_experience",
  "preferred_start_year",
  "preparation_readiness",
  "sending_organisation",
  "project_specific",
  "other",
] as const;

export const volunteerCompatibilityDimensions = [
  "profile_compatibility",
  "route_compatibility",
  "placement_availability",
  "immigration_residence_feasibility",
] as const;

export const volunteerRuleImpacts = [
  "hard_blocker",
  "positive_signal",
  "preparation_signal",
  "human_review",
] as const;

export const volunteerHumanReviewOutcomes = [
  "downgrade_to_potential",
  "needs_human_review",
] as const;

export const volunteerQuestionFields = [
  "age",
  "citizenship",
  "residenceCountry",
  "educationLevel",
  "completedCompulsorySchooling",
  "germanLevel",
  "willingToLearnGerman",
  "englishLevel",
  "passportReadiness",
  "volunteerExperienceType",
  "hasVolunteerExperience",
  "volunteerExperienceMonths",
  "experienceEvidence",
  "preferredStartYear",
  "preparationReadiness",
  "hasSendingOrganisationConnection",
  "organisationConnectionStatus",
  "projectInterestAreas",
  "mayNeedAccessibilityAgeException",
] as const;

export const volunteerMatchVerdictSchema = z.enum(volunteerMatchVerdicts);
export const acquisitionSourceSchema = z.enum(acquisitionSources);
export const educationLevelSchema = z.enum(educationLevels);
export const languageLevelSchema = z.enum(languageLevels);
export const englishLevelSchema = z.enum(englishLevels);
export const passportReadinessSchema = z.enum(passportReadinessValues);
export const preparationReadinessSchema = z.enum(preparationReadinessValues);
export const experienceEvidenceSchema = z.enum(experienceEvidenceValues);
export const volunteerExperienceTypeSchema = z.enum(volunteerExperienceTypes);
export const organisationConnectionStatusSchema = z.enum(
  organisationConnectionStatuses
);
export const projectInterestAreaSchema = z.enum(projectInterestAreas);
export const volunteerRouteFamilySchema = z.enum(volunteerRouteFamilies);
export const volunteerRuleCategorySchema = z.enum(volunteerRuleCategories);
export const volunteerCompatibilityDimensionSchema = z.enum(
  volunteerCompatibilityDimensions
);
export const volunteerRuleImpactSchema = z.enum(volunteerRuleImpacts);
export const volunteerHumanReviewOutcomeSchema = z.enum(
  volunteerHumanReviewOutcomes
);
export const volunteerQuestionFieldSchema = z.enum(volunteerQuestionFields);

export const volunteerQuestionnaireAnswersSchema = z
  .object({
    age: z.number().int().min(13).max(100),
    citizenship: volunteerCountryCodeSchema,
    residenceCountry: volunteerCountryCodeSchema,
    educationLevel: educationLevelSchema,
    completedCompulsorySchooling: z.boolean().default(true),
    germanLevel: languageLevelSchema,
    willingToLearnGerman: z.boolean().default(false),
    englishLevel: englishLevelSchema.default("basic"),
    passportReadiness: passportReadinessSchema,
    volunteerExperienceType: volunteerExperienceTypeSchema.optional(),
    hasVolunteerExperience: z.boolean().default(false),
    volunteerExperienceMonths: z.number().int().min(0).max(240).default(0),
    experienceEvidence: z.array(experienceEvidenceSchema).max(8).default([]),
    preferredStartYear: z.number().int().min(2026).max(2035),
    preparationReadiness: preparationReadinessSchema,
    hasSendingOrganisationConnection: z.boolean().nullable().default(null),
    organisationConnectionStatus: organisationConnectionStatusSchema.optional(),
    projectInterestAreas: z.array(projectInterestAreaSchema).max(10).default([]),
    mayNeedAccessibilityAgeException: z.boolean().default(false),
    acquisitionSource: acquisitionSourceSchema.default("other"),
    acquisitionSourceDetail: z.string().trim().max(120).optional(),
  })
  .strict()
  .superRefine((answers, ctx) => {
    const hasExperience =
      answers.hasVolunteerExperience ||
      (answers.volunteerExperienceType !== undefined &&
        answers.volunteerExperienceType !== "none");

    if (hasExperience && answers.volunteerExperienceMonths === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["volunteerExperienceMonths"],
        message:
          "Volunteer experience months should be greater than zero when experience is marked true.",
      });
    }
  });

const scalarRuleValueSchema = z.union([z.string(), z.number(), z.boolean()]);
const scalarArrayRuleValueSchema = z.array(scalarRuleValueSchema).min(1);

const conditionBaseSchema = z.object({
  id: z.string().trim().min(1),
  category: volunteerRuleCategorySchema,
  dimension: volunteerCompatibilityDimensionSchema,
  impact: volunteerRuleImpactSchema,
  label: z.string().trim().min(1),
  sourceUrl: z.string().url().optional(),
  sourceTitle: z.string().trim().min(1).optional(),
  fitReason: z.string().trim().min(1).optional(),
  gapReason: z.string().trim().min(1).optional(),
  nextStep: z.string().trim().min(1).optional(),
  weight: z.number().int().min(0).max(100).default(0),
  reviewOutcome: volunteerHumanReviewOutcomeSchema.default(
    "needs_human_review"
  ),
});

const fieldConditionBaseSchema = conditionBaseSchema.extend({
  field: volunteerQuestionFieldSchema,
});

const alwaysConditionSchema = conditionBaseSchema
  .extend({
    operator: z.literal("always"),
  })
  .strict();

const equalsConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("equals"),
    value: scalarRuleValueSchema,
  })
  .strict();

const notEqualsConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("not_equals"),
    value: scalarRuleValueSchema,
  })
  .strict();

const inConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("in"),
    value: scalarArrayRuleValueSchema,
  })
  .strict();

const notInConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("not_in"),
    value: scalarArrayRuleValueSchema,
  })
  .strict();

const minConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("min"),
    value: z.number(),
  })
  .strict();

const maxConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("max"),
    value: z.number(),
  })
  .strict();

const betweenConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("between"),
    value: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .strict(),
  })
  .strict();

const includesAnyConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("includes_any"),
    value: z.array(z.string()).min(1),
  })
  .strict();

const includesAllConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("includes_all"),
    value: z.array(z.string()).min(1),
  })
  .strict();

const booleanIsConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("boolean_is"),
    value: z.boolean(),
  })
  .strict();

const hasValueConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("has_value"),
  })
  .strict();

const betweenRequiresBooleanConditionSchema = fieldConditionBaseSchema
  .extend({
    operator: z.literal("between_requires_boolean"),
    value: z
      .object({
        min: z.number(),
        max: z.number(),
        requiredField: volunteerQuestionFieldSchema,
        requiredValue: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const volunteerRuleConditionSchema = z.discriminatedUnion("operator", [
  alwaysConditionSchema,
  equalsConditionSchema,
  notEqualsConditionSchema,
  inConditionSchema,
  notInConditionSchema,
  minConditionSchema,
  maxConditionSchema,
  betweenConditionSchema,
  includesAnyConditionSchema,
  includesAllConditionSchema,
  booleanIsConditionSchema,
  hasValueConditionSchema,
  betweenRequiresBooleanConditionSchema,
]);

export const volunteerEligibilityRulesSchema = z
  .object({
    schemaVersion: z.literal("volunteer-match-rules-v1"),
    minimumScoreForStrongPotential: z.number().int().min(0).max(100),
    minimumScoreForPotential: z.number().int().min(0).max(100),
    conditions: z.array(volunteerRuleConditionSchema).min(1),
    routeSpecificNotes: z.array(z.string().trim().min(1)).default([]),
    projectSpecificOverrides: z
      .array(
        z
          .object({
            appliesToConditionIds: z.array(z.string().trim().min(1)).min(1),
            dimension: volunteerCompatibilityDimensionSchema,
            requiresVerifiedSource: z.boolean().default(true),
            note: z.string().trim().min(1),
          })
          .strict()
      )
      .default([]),
  })
  .strict()
  .superRefine((rules, ctx) => {
    if (rules.minimumScoreForStrongPotential < rules.minimumScoreForPotential) {
      ctx.addIssue({
        code: "custom",
        path: ["minimumScoreForStrongPotential"],
        message:
          "Strong Potential threshold must be greater than or equal to Potential threshold.",
      });
    }

    const conditionIds = new Set(rules.conditions.map((condition) => condition.id));

    rules.projectSpecificOverrides.forEach((override, overrideIndex) => {
      override.appliesToConditionIds.forEach((conditionId, conditionIndex) => {
        if (!conditionIds.has(conditionId)) {
          ctx.addIssue({
            code: "custom",
            path: [
              "projectSpecificOverrides",
              overrideIndex,
              "appliesToConditionIds",
              conditionIndex,
            ],
            message:
              "Project-specific override references a condition id that does not exist in this rule version.",
          });
        }
      });
    });
  });

const resultMessageSchema = z
  .object({
    conditionId: z.string().trim().min(1),
    message: z.string().trim().min(1),
    category: volunteerRuleCategorySchema,
    dimension: volunteerCompatibilityDimensionSchema,
    sourceUrl: z.string().url().optional(),
  })
  .strict();

export const volunteerRouteSourceSchema = z
  .object({
    sourceUrl: z.string().url(),
    sourceTitle: z.string().trim().min(1),
    sourceOrganisation: z.string().trim().min(1),
    lastVerifiedAt: z.string().trim().min(1).nullable(),
    verificationDueAt: z.string().trim().min(1).nullable(),
    isVerificationStale: z.boolean(),
    verificationNotes: z.string().trim().min(1).nullable(),
  })
  .strict();

export const volunteerRouteResultSchema = z
  .object({
    routeId: z.string().uuid(),
    routeSlug: z.string().trim().min(1),
    routeName: z.string().trim().min(1),
    verdict: volunteerMatchVerdictSchema,
    internalScore: z.number().int().min(0).max(100),
    reasons: z.array(resultMessageSchema),
    blockers: z.array(resultMessageSchema),
    nextSteps: z.array(resultMessageSchema),
    humanReviewReasons: z.array(resultMessageSchema),
    source: volunteerRouteSourceSchema,
    ruleVersionId: z.string().uuid(),
    ruleVersionNumber: z.number().int().positive(),
  })
  .strict();

export const volunteerRouteRecordSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string().trim().min(1),
    name: z.string().trim().min(1),
    route_family: volunteerRouteFamilySchema,
    summary: z.string().trim().nullable(),
    source_url: z.string().url(),
    source_title: z.string().trim().min(1),
    source_organisation: z.string().trim().min(1),
    last_verified_at: z.string().nullable(),
    verification_due_at: z.string().nullable(),
    verification_notes: z.string().nullable(),
  })
  .strict();

export const volunteerRuleVersionRecordSchema = z
  .object({
    id: z.string().uuid(),
    route_id: z.string().uuid(),
    version_number: z.number().int().positive(),
    rules_json: volunteerEligibilityRulesSchema,
    source_url: z.string().url(),
    source_title: z.string().trim().min(1),
    source_organisation: z.string().trim().min(1),
    last_verified_at: z.string().nullable(),
    verification_due_at: z.string().nullable(),
    verification_notes: z.string().nullable(),
  })
  .strict();

export type VolunteerMatchVerdict = z.infer<typeof volunteerMatchVerdictSchema>;
export type AcquisitionSource = z.infer<typeof acquisitionSourceSchema>;
export type VolunteerExperienceType = z.infer<
  typeof volunteerExperienceTypeSchema
>;
export type OrganisationConnectionStatus = z.infer<
  typeof organisationConnectionStatusSchema
>;
export type VolunteerCompatibilityDimension = z.infer<
  typeof volunteerCompatibilityDimensionSchema
>;
export type VolunteerQuestionnaireAnswers = z.infer<
  typeof volunteerQuestionnaireAnswersSchema
>;
export type VolunteerRuleCondition = z.infer<typeof volunteerRuleConditionSchema>;
export type VolunteerEligibilityRules = z.infer<
  typeof volunteerEligibilityRulesSchema
>;
export type VolunteerRouteResult = z.infer<typeof volunteerRouteResultSchema>;
export type VolunteerRouteRecord = z.infer<typeof volunteerRouteRecordSchema>;
export type VolunteerRuleVersionRecord = z.infer<
  typeof volunteerRuleVersionRecordSchema
>;





