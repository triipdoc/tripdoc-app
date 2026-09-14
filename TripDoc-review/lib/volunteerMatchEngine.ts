import {
  volunteerEligibilityRulesSchema,
  volunteerQuestionnaireAnswersSchema,
  volunteerRouteResultSchema,
  volunteerRouteRecordSchema,
  volunteerRuleVersionRecordSchema,
  type VolunteerCompatibilityDimension,
  type VolunteerEligibilityRules,
  type VolunteerMatchVerdict,
  type VolunteerQuestionnaireAnswers,
  type VolunteerRouteRecord,
  type VolunteerRouteResult,
  type VolunteerRuleCondition,
  type VolunteerRuleVersionRecord,
} from "./volunteerMatchSchemas";
import { parseVolunteerCountryCode } from "./volunteerMatchCountries";

type RouteWithRules = {
  route: VolunteerRouteRecord;
  ruleVersion: VolunteerRuleVersionRecord;
};

type ResultMessage = VolunteerRouteResult["reasons"][number];

const verdictRank: Record<VolunteerMatchVerdict, number> = {
  "Strong Potential": 1,
  "Potential — Preparation Needed": 2,
  "Needs Human Review": 3,
  "Currently Weak Fit": 4,
};

function normalizeComparable(
  value: unknown,
  field?: keyof VolunteerQuestionnaireAnswers
) {
  if (typeof value !== "string") return value;

  if (field === "citizenship" || field === "residenceCountry") {
    return parseVolunteerCountryCode(value) || value.trim().toLowerCase();
  }

  return value.trim().toLowerCase();
}

function normalizeComparableArray(
  values: unknown[],
  field?: keyof VolunteerQuestionnaireAnswers
) {
  return values.map((value) => normalizeComparable(value, field));
}

function getAnswerValue(
  answers: VolunteerQuestionnaireAnswers,
  field: keyof VolunteerQuestionnaireAnswers
) {
  return answers[field];
}

function isPresent(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isPastDate(value: string | null | undefined, now: Date) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  return date.getTime() < now.getTime();
}

function evaluateCondition(
  condition: VolunteerRuleCondition,
  answers: VolunteerQuestionnaireAnswers
) {
  if (condition.operator === "always") return true;

  const actual = getAnswerValue(answers, condition.field);

  switch (condition.operator) {
    case "equals":
      return (
        normalizeComparable(actual, condition.field) ===
        normalizeComparable(condition.value, condition.field)
      );

    case "not_equals":
      return (
        normalizeComparable(actual, condition.field) !==
        normalizeComparable(condition.value, condition.field)
      );

    case "in":
      return normalizeComparableArray(condition.value, condition.field).includes(
        normalizeComparable(actual, condition.field)
      );

    case "not_in":
      return !normalizeComparableArray(condition.value, condition.field).includes(
        normalizeComparable(actual, condition.field)
      );

    case "min":
      return typeof actual === "number" && actual >= condition.value;

    case "max":
      return typeof actual === "number" && actual <= condition.value;

    case "between":
      return (
        typeof actual === "number" &&
        actual >= condition.value.min &&
        actual <= condition.value.max
      );

    case "includes_any":
      if (!Array.isArray(actual)) return false;
      return condition.value.some((value) =>
        normalizeComparableArray(actual, condition.field).includes(
          normalizeComparable(value, condition.field)
        )
      );

    case "includes_all":
      if (!Array.isArray(actual)) return false;
      return condition.value.every((value) =>
        normalizeComparableArray(actual, condition.field).includes(
          normalizeComparable(value, condition.field)
        )
      );

    case "boolean_is":
      return typeof actual === "boolean" && actual === condition.value;

    case "has_value":
      return isPresent(actual);

    case "between_requires_boolean": {
      if (typeof actual !== "number") return false;

      const isInsideExceptionRange =
        actual >= condition.value.min && actual <= condition.value.max;

      if (!isInsideExceptionRange) return true;

      return (
        getAnswerValue(answers, condition.value.requiredField) ===
        condition.value.requiredValue
      );
    }

    default:
      return false;
  }
}

function toMessage(
  condition: VolunteerRuleCondition,
  message: string | undefined
): ResultMessage {
  return {
    conditionId: condition.id,
    message: message || condition.label,
    category: condition.category,
    dimension: condition.dimension,
    sourceUrl: condition.sourceUrl,
  };
}

function createSystemMessage({
  conditionId,
  message,
  dimension,
}: {
  conditionId: string;
  message: string;
  dimension: VolunteerCompatibilityDimension;
}): ResultMessage {
  return {
    conditionId,
    message,
    category: "other",
    dimension,
  };
}

function requiresClassificationReview(condition: VolunteerRuleCondition) {
  if (condition.category === "age") return true;

  if (
    condition.dimension === "profile_compatibility" ||
    condition.dimension === "route_compatibility"
  ) {
    return true;
  }

  const reviewText = [
    condition.id,
    condition.label,
    condition.nextStep,
    condition.gapReason,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    condition.category === "project_specific" &&
    /\b(exception|project-specific|ambiguous|conflicting|unusual)\b/.test(
      reviewText
    )
  );
}

function getVerdict({
  score,
  rules,
  blockers,
  requiresHumanReview,
  downgradeStrongToPotential,
}: {
  score: number;
  rules: VolunteerEligibilityRules;
  blockers: ResultMessage[];
  requiresHumanReview: boolean;
  downgradeStrongToPotential: boolean;
}): VolunteerMatchVerdict {
  if (blockers.length > 0) return "Currently Weak Fit";

  if (requiresHumanReview) return "Needs Human Review";

  if (score >= rules.minimumScoreForStrongPotential) {
    return downgradeStrongToPotential
      ? "Potential — Preparation Needed"
      : "Strong Potential";
  }

  if (score >= rules.minimumScoreForPotential) {
    return "Potential — Preparation Needed";
  }

  return "Currently Weak Fit";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function evaluateVolunteerRouteMatch({
  answers,
  route,
  ruleVersion,
  now = new Date(),
}: {
  answers: VolunteerQuestionnaireAnswers;
  route: VolunteerRouteRecord;
  ruleVersion: VolunteerRuleVersionRecord;
  now?: Date;
}): VolunteerRouteResult {
  const safeAnswers = volunteerQuestionnaireAnswersSchema.parse(answers);
  const safeRoute = volunteerRouteRecordSchema.parse(route);
  const safeRuleVersion = volunteerRuleVersionRecordSchema.parse(ruleVersion);
  const rules = volunteerEligibilityRulesSchema.parse(
    safeRuleVersion.rules_json
  );

  const reasons: ResultMessage[] = [];
  const blockers: ResultMessage[] = [];
  const nextSteps: ResultMessage[] = [];
  const humanReviewReasons: ResultMessage[] = [];
  let score = 0;
  let requiresHumanReview = false;
  let downgradeStrongToPotential = false;

  const verificationDueAt =
    safeRuleVersion.verification_due_at || safeRoute.verification_due_at || null;
  const isVerificationStale = isPastDate(verificationDueAt, now);

  if (isVerificationStale) {
    requiresHumanReview = true;
    humanReviewReasons.push(
      createSystemMessage({
        conditionId: "rule-version-verification-stale",
        dimension: "route_compatibility",
        message:
          "This route rule is overdue for verification. Confirm the official source before relying on this result.",
      })
    );
  }

  for (const condition of rules.conditions) {
    const matches = evaluateCondition(condition, safeAnswers);

    if (condition.impact === "hard_blocker") {
      if (!matches) {
        blockers.push(toMessage(condition, condition.gapReason));
      }
      continue;
    }

    if (condition.impact === "positive_signal") {
      if (matches) {
        score += condition.weight;
        reasons.push(toMessage(condition, condition.fitReason));
      }
      continue;
    }

    if (condition.impact === "preparation_signal") {
      if (matches) {
        score += condition.weight;
        reasons.push(toMessage(condition, condition.fitReason));
      } else {
        nextSteps.push(toMessage(condition, condition.nextStep || condition.gapReason));
      }
      continue;
    }

    if (condition.impact === "human_review" && matches) {
      if (
        condition.reviewOutcome === "needs_human_review" &&
        requiresClassificationReview(condition)
      ) {
        requiresHumanReview = true;
      } else {
        downgradeStrongToPotential = true;
      }

      humanReviewReasons.push(
        toMessage(condition, condition.nextStep || condition.gapReason)
      );
    }
  }

  const internalScore = clampScore(score);
  const verdict = getVerdict({
    score: internalScore,
    rules,
    blockers,
    requiresHumanReview,
    downgradeStrongToPotential,
  });

  return volunteerRouteResultSchema.parse({
    routeId: safeRoute.id,
    routeSlug: safeRoute.slug,
    routeName: safeRoute.name,
    verdict,
    internalScore,
    reasons,
    blockers,
    nextSteps,
    humanReviewReasons,
    source: {
      sourceUrl: safeRuleVersion.source_url || safeRoute.source_url,
      sourceTitle: safeRuleVersion.source_title || safeRoute.source_title,
      sourceOrganisation:
        safeRuleVersion.source_organisation || safeRoute.source_organisation,
      lastVerifiedAt:
        safeRuleVersion.last_verified_at || safeRoute.last_verified_at || null,
      verificationDueAt,
      isVerificationStale,
      verificationNotes:
        safeRuleVersion.verification_notes || safeRoute.verification_notes || null,
    },
    ruleVersionId: safeRuleVersion.id,
    ruleVersionNumber: safeRuleVersion.version_number,
  });
}

export function rankVolunteerRouteResults(results: VolunteerRouteResult[]) {
  return [...results].sort((a, b) => {
    const verdictDifference = verdictRank[a.verdict] - verdictRank[b.verdict];
    if (verdictDifference !== 0) return verdictDifference;

    const scoreDifference = b.internalScore - a.internalScore;
    if (scoreDifference !== 0) return scoreDifference;

    const preparationDifference =
      a.nextSteps.length +
      a.humanReviewReasons.length -
      (b.nextSteps.length + b.humanReviewReasons.length);
    if (preparationDifference !== 0) return preparationDifference;

    return a.routeName.localeCompare(b.routeName);
  });
}

export function evaluateVolunteerRoutes(
  answers: VolunteerQuestionnaireAnswers,
  routesWithRules: RouteWithRules[],
  now = new Date()
) {
  const results = routesWithRules.map(({ route, ruleVersion }) =>
    evaluateVolunteerRouteMatch({ answers, route, ruleVersion, now })
  );

  return rankVolunteerRouteResults(results);
}

export function toPublicVolunteerRouteResult(
  result: VolunteerRouteResult
): Omit<VolunteerRouteResult, "internalScore"> {
  return {
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
  };
}

