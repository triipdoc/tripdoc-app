import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateVolunteerRouteMatch,
  evaluateVolunteerRoutes,
  rankVolunteerRouteResults,
  toPublicVolunteerRouteResult,
} from "./volunteerMatchEngine";
import {
  volunteerEligibilityRulesSchema,
  volunteerQuestionnaireAnswersSchema,
  type VolunteerEligibilityRules,
  type VolunteerQuestionnaireAnswers,
  type VolunteerRouteRecord,
  type VolunteerRuleVersionRecord,
} from "./volunteerMatchSchemas";

const verifiedAt = "2026-08-19T00:00:00.000Z";
const futureDueAt = "2027-02-19T00:00:00.000Z";
const pastDueAt = "2026-01-01T00:00:00.000Z";
const testNow = new Date("2026-08-19T12:00:00.000Z");

const strongRoute: VolunteerRouteRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "sample-strong-route",
  name: "Sample Strong Route",
  route_family: "weltwaerts_south_north",
  summary: "A sample route for engine tests.",
  source_url: "https://example.com/source",
  source_title: "Official sample source",
  source_organisation: "TripDoc Test Source",
  last_verified_at: verifiedAt,
  verification_due_at: futureDueAt,
  verification_notes: "Test fixture only.",
};

const sciRoute: VolunteerRouteRecord = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "sample-sci-project-route",
  name: "Sample SCI Project Route",
  route_family: "sci_long_term",
  summary: "A sample SCI route for engine tests.",
  source_url: "https://example.com/sci-source",
  source_title: "Official SCI sample source",
  source_organisation: "TripDoc Test Source",
  last_verified_at: verifiedAt,
  verification_due_at: futureDueAt,
  verification_notes: "Test fixture only.",
};

const baseAnswers: VolunteerQuestionnaireAnswers = {
  age: 23,
  citizenship: "NG",
  residenceCountry: "NG",
  educationLevel: "bachelor",
  completedCompulsorySchooling: true,
  germanLevel: "a1",
  willingToLearnGerman: true,
  englishLevel: "working",
  passportReadiness: "valid",
  volunteerExperienceType: "formal",
  hasVolunteerExperience: true,
  volunteerExperienceMonths: 18,
  experienceEvidence: ["reference_letter"],
  preferredStartYear: 2027,
  preparationReadiness: "ready_for_documents",
  hasSendingOrganisationConnection: true,
  organisationConnectionStatus: "yes",
  projectInterestAreas: ["social", "education"],
  mayNeedAccessibilityAgeException: false,
  acquisitionSource: "instagram",
};

function makeRuleVersion(
  id: string,
  route: VolunteerRouteRecord,
  rules: VolunteerEligibilityRules,
  verificationDueAt = futureDueAt
): VolunteerRuleVersionRecord {
  return {
    id,
    route_id: route.id,
    version_number: 1,
    rules_json: rules,
    source_url: route.source_url,
    source_title: route.source_title,
    source_organisation: route.source_organisation,
    last_verified_at: route.last_verified_at,
    verification_due_at: verificationDueAt,
    verification_notes: route.verification_notes,
  };
}

const strongRules = volunteerEligibilityRulesSchema.parse({
  schemaVersion: "volunteer-match-rules-v1",
  minimumScoreForStrongPotential: 70,
  minimumScoreForPotential: 40,
  routeSpecificNotes: ["Test fixture only."],
  conditions: [
    {
      id: "age-18-28",
      category: "age",
      dimension: "profile_compatibility",
      impact: "hard_blocker",
      label: "Applicant age must fit the route range.",
      field: "age",
      operator: "between",
      value: { min: 18, max: 28 },
      gapReason: "This route is currently outside your age range.",
    },
    {
      id: "citizenship-supported",
      category: "citizenship",
      dimension: "route_compatibility",
      impact: "hard_blocker",
      label: "Citizenship must be supported by the route.",
      field: "citizenship",
      operator: "in",
      value: ["Nigeria", "Ghana"],
      gapReason: "Your citizenship is not listed for this route fixture.",
    },
    {
      id: "experience",
      category: "volunteer_experience",
      dimension: "profile_compatibility",
      impact: "positive_signal",
      label: "Volunteer experience strengthens the profile.",
      field: "hasVolunteerExperience",
      operator: "boolean_is",
      value: true,
      weight: 35,
      fitReason: "You already have volunteer or community experience.",
    },
    {
      id: "evidence",
      category: "evidence_of_experience",
      dimension: "profile_compatibility",
      impact: "positive_signal",
      label: "Evidence of experience is available.",
      field: "experienceEvidence",
      operator: "includes_any",
      value: ["reference_letter", "certificate", "organisation_contact"],
      weight: 20,
      fitReason: "You have evidence that can support your experience claim.",
    },
    {
      id: "german-a1",
      category: "language",
      dimension: "profile_compatibility",
      impact: "preparation_signal",
      label: "German language readiness.",
      field: "germanLevel",
      operator: "in",
      value: ["a1", "a2", "b1_or_higher"],
      weight: 25,
      fitReason: "You already show German language readiness.",
      nextStep: "Start German A1 preparation before applying.",
    },
  ],
});

const downgradeRules = volunteerEligibilityRulesSchema.parse({
  schemaVersion: "volunteer-match-rules-v1",
  minimumScoreForStrongPotential: 70,
  minimumScoreForPotential: 40,
  routeSpecificNotes: ["Test fixture only."],
  conditions: [
    ...strongRules.conditions,
    {
      id: "placement-availability-unconfirmed",
      category: "project_specific",
      dimension: "placement_availability",
      impact: "human_review",
      label: "Placement availability must be confirmed.",
      operator: "always",
      reviewOutcome: "downgrade_to_potential",
      nextStep:
        "Confirm current placement availability before treating this as strong.",
    },
  ],
});

const organisationConnectionRules = volunteerEligibilityRulesSchema.parse({
  schemaVersion: "volunteer-match-rules-v1",
  minimumScoreForStrongPotential: 10,
  minimumScoreForPotential: 1,
  routeSpecificNotes: [
    "Organisation connection uncertainty should be reviewable without treating it as a confirmed no.",
  ],
  conditions: [
    {
      id: "profile-baseline-fit",
      category: "education",
      dimension: "profile_compatibility",
      impact: "positive_signal",
      label: "Profile baseline fit",
      operator: "always",
      weight: 20,
      fitReason: "Your basic profile can still be compared with this route.",
    },
    {
      id: "organisation-connection-confirmed",
      category: "sending_organisation",
      dimension: "placement_availability",
      impact: "positive_signal",
      label: "Organisation connection confirmed",
      field: "organisationConnectionStatus",
      operator: "equals",
      value: "yes",
      weight: 20,
      fitReason: "You already have an organisation connection.",
    },
    {
      id: "organisation-connection-unsure",
      category: "sending_organisation",
      dimension: "placement_availability",
      impact: "human_review",
      label: "Organisation connection needs review",
      field: "organisationConnectionStatus",
      operator: "equals",
      value: "unsure",
      reviewOutcome: "needs_human_review",
      nextStep:
        "Confirm the correct sending, host, or partner organisation before relying on this route.",
    },
  ],
});

const weltwaertsAgeRules = volunteerEligibilityRulesSchema.parse({
  schemaVersion: "volunteer-match-rules-v1",
  minimumScoreForStrongPotential: 5,
  minimumScoreForPotential: 1,
  routeSpecificNotes: [
    "The public matcher asks only whether an applicable accessibility/disability age exception may need review; it must not collect diagnosis details.",
  ],
  conditions: [
    {
      id: "weltwaerts-age-minimum",
      category: "age",
      dimension: "profile_compatibility",
      impact: "hard_blocker",
      label: "weltwärts minimum age",
      field: "age",
      operator: "min",
      value: 18,
      gapReason: "weltwärts normally requires applicants to be at least 18.",
    },
    {
      id: "weltwaerts-age-supported-maximum",
      category: "age",
      dimension: "profile_compatibility",
      impact: "hard_blocker",
      label: "weltwärts supported age maximum with exception path",
      field: "age",
      operator: "max",
      value: 35,
      gapReason:
        "weltwärts only allows an exception up to age 35 in disability/impairment cases requiring verification.",
    },
    {
      id: "weltwaerts-age-exception-required",
      category: "age",
      dimension: "profile_compatibility",
      impact: "hard_blocker",
      label: "weltwärts age exception indicator for ages 29-35",
      field: "age",
      operator: "between_requires_boolean",
      value: {
        min: 29,
        max: 35,
        requiredField: "mayNeedAccessibilityAgeException",
        requiredValue: true,
      },
      gapReason:
        "Applicants aged 29-35 need a verified accessibility/disability age exception path.",
    },
    {
      id: "weltwaerts-age-normal-range",
      category: "age",
      dimension: "profile_compatibility",
      impact: "positive_signal",
      label: "weltwärts normal age range",
      field: "age",
      operator: "between",
      value: { min: 18, max: 28 },
      fitReason: "Your age is within the normal weltwärts 18-28 range.",
      weight: 5,
    },
    {
      id: "weltwaerts-age-exception-review",
      category: "age",
      dimension: "route_compatibility",
      impact: "human_review",
      label: "weltwärts accessibility/disability age exception review",
      field: "age",
      operator: "between",
      value: { min: 29, max: 35 },
      reviewOutcome: "needs_human_review",
      nextStep:
        "Confirm whether an official accessibility/disability age exception applies without collecting diagnosis details in the public matcher.",
    },
  ],
});

const sciRules = volunteerEligibilityRulesSchema.parse({
  schemaVersion: "volunteer-match-rules-v1",
  minimumScoreForStrongPotential: 5,
  minimumScoreForPotential: 1,
  routeSpecificNotes: [
    "SCI requirements can vary by project and sending organisation.",
  ],
  projectSpecificOverrides: [
    {
      appliesToConditionIds: ["sci-age-supported-maximum"],
      dimension: "placement_availability",
      requiresVerifiedSource: true,
      note: "A verified project-specific rule may override the base SCI age maximum.",
    },
  ],
  conditions: [
    {
      id: "sci-age-minimum",
      category: "age",
      dimension: "profile_compatibility",
      impact: "hard_blocker",
      label: "SCI minimum age",
      field: "age",
      operator: "min",
      value: 18,
      gapReason: "SCI Germany lists 18 as the normal minimum age.",
    },
    {
      id: "sci-age-supported-maximum",
      category: "age",
      dimension: "profile_compatibility",
      impact: "hard_blocker",
      label: "SCI base supported age maximum",
      field: "age",
      operator: "max",
      value: 34,
      gapReason:
        "SCI Germany normally lists 18-29 and justified exceptions up to age 34.",
    },
    {
      id: "sci-age-normal-range",
      category: "age",
      dimension: "profile_compatibility",
      impact: "positive_signal",
      label: "SCI normal age range",
      field: "age",
      operator: "between",
      value: { min: 18, max: 29 },
      fitReason: "Your age is within the normal SCI Germany 18-29 range.",
      weight: 5,
    },
    {
      id: "sci-age-exception-review",
      category: "age",
      dimension: "placement_availability",
      impact: "human_review",
      label: "SCI age exception or project-specific age review",
      field: "age",
      operator: "between",
      value: { min: 30, max: 34 },
      reviewOutcome: "needs_human_review",
      nextStep:
        "Verify whether SCI or the exact project can justify an age exception up to 34.",
    },
  ],
});

const sciProjectOverrideRules = volunteerEligibilityRulesSchema.parse({
  ...sciRules,
  projectSpecificOverrides: [
    {
      appliesToConditionIds: ["sci-project-age-supported-maximum"],
      dimension: "placement_availability",
      requiresVerifiedSource: true,
      note: "This fixture represents a verified project-specific age override.",
    },
  ],
  conditions: [
    {
      id: "sci-age-minimum",
      category: "age",
      dimension: "profile_compatibility",
      impact: "hard_blocker",
      label: "SCI minimum age",
      field: "age",
      operator: "min",
      value: 18,
      gapReason: "SCI Germany lists 18 as the normal minimum age.",
    },
    {
      id: "sci-project-age-supported-maximum",
      category: "age",
      dimension: "placement_availability",
      impact: "hard_blocker",
      label: "Verified project-specific SCI age maximum",
      field: "age",
      operator: "max",
      value: 40,
      gapReason:
        "This project-specific fixture supports applicants up to age 40.",
    },
    {
      id: "sci-project-age-35-review",
      category: "age",
      dimension: "placement_availability",
      impact: "human_review",
      label: "Verified project-specific age review",
      field: "age",
      operator: "between",
      value: { min: 35, max: 40 },
      reviewOutcome: "needs_human_review",
      nextStep:
        "Verify the exact project source before relying on this exception.",
    },
  ],
});

test("rule JSON schema rejects arbitrary inconsistent structures", () => {
  assert.throws(() =>
    volunteerEligibilityRulesSchema.parse({
      ...strongRules,
      unexpected: true,
    })
  );
});

test("strong profile receives Strong Potential when no hard blockers or unresolved route issues exist", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: baseAnswers,
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "33333333-3333-4333-8333-333333333333",
      strongRoute,
      strongRules
    ),
    now: testNow,
  });

  assert.equal(result.verdict, "Strong Potential");
  assert.equal(result.blockers.length, 0);
  assert.ok(result.internalScore >= 70);
  assert.equal(result.reasons[0]?.dimension, "profile_compatibility");
});

test("country rule comparisons accept canonical ISO answers and official country names", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: {
      ...baseAnswers,
      citizenship: "Nigerian",
      residenceCountry: "NIGERIA",
    },
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "30303030-3030-4030-8030-303030303030",
      strongRoute,
      strongRules
    ),
    now: testNow,
  });

  assert.equal(result.blockers.length, 0);
  assert.equal(result.verdict, "Strong Potential");
});

test("organisation connection unsure is shown as verification need without forcing the whole route to Needs Human Review", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: {
      ...baseAnswers,
      hasSendingOrganisationConnection: null,
      organisationConnectionStatus: "unsure",
    },
    route: sciRoute,
    ruleVersion: makeRuleVersion(
      "31313131-3131-4131-8131-313131313131",
      sciRoute,
      organisationConnectionRules
    ),
    now: testNow,
  });

  assert.equal(result.blockers.length, 0);
  assert.equal(result.verdict, "Potential — Preparation Needed");
  assert.equal(
    result.humanReviewReasons[0]?.conditionId,
    "organisation-connection-unsure"
  );
});

test("hard blocker returns Currently Weak Fit even when other signals are strong", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: { ...baseAnswers, age: 35 },
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "44444444-4444-4444-8444-444444444444",
      strongRoute,
      strongRules
    ),
    now: testNow,
  });

  assert.equal(result.verdict, "Currently Weak Fit");
  assert.equal(result.blockers[0]?.conditionId, "age-18-28");
});

test("unresolved placement availability can downgrade a strong profile to Potential", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: baseAnswers,
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "55555555-5555-4555-8555-555555555555",
      strongRoute,
      downgradeRules
    ),
    now: testNow,
  });

  assert.equal(result.verdict, "Potential — Preparation Needed");
  assert.equal(
    result.humanReviewReasons[0]?.dimension,
    "placement_availability"
  );
});

test("general placement and residence checks do not automatically force Needs Human Review", () => {
  const generalVerificationRules = volunteerEligibilityRulesSchema.parse({
    schemaVersion: "volunteer-match-rules-v1",
    minimumScoreForStrongPotential: 70,
    minimumScoreForPotential: 40,
    routeSpecificNotes: ["General verification fixture only."],
    conditions: [
      ...strongRules.conditions,
      {
        id: "placement-still-needs-check",
        category: "project_specific",
        dimension: "placement_availability",
        impact: "human_review",
        label: "Placement availability still needs verification",
        operator: "always",
        reviewOutcome: "needs_human_review",
        nextStep: "Verify current placement availability through the official route.",
      },
      {
        id: "residence-still-needs-check",
        category: "residence",
        dimension: "immigration_residence_feasibility",
        impact: "human_review",
        label: "Residence or visa basis still needs verification",
        operator: "always",
        reviewOutcome: "needs_human_review",
        nextStep:
          "Verify residence or visa feasibility with the responsible official authority.",
      },
    ],
  });

  const result = evaluateVolunteerRouteMatch({
    answers: baseAnswers,
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "56565656-5656-4656-8656-565656565656",
      strongRoute,
      generalVerificationRules
    ),
    now: testNow,
  });

  assert.equal(result.verdict, "Potential — Preparation Needed");
  assert.equal(result.humanReviewReasons.length, 2);
  assert.equal(
    result.humanReviewReasons[0]?.dimension,
    "placement_availability"
  );
});

test("route ranking is deterministic by verdict, score, preparation needs, then route name", () => {
  const alphaRoute: VolunteerRouteRecord = {
    ...strongRoute,
    id: "12121212-1212-4212-8212-121212121212",
    name: "Alpha Route",
    slug: "alpha-route",
  };
  const betaRoute: VolunteerRouteRecord = {
    ...strongRoute,
    id: "13131313-1313-4313-8313-131313131313",
    name: "Beta Route",
    slug: "beta-route",
  };
  const potentialResult = evaluateVolunteerRouteMatch({
    answers: baseAnswers,
    route: betaRoute,
    ruleVersion: makeRuleVersion(
      "14141414-1414-4414-8414-141414141414",
      betaRoute,
      downgradeRules
    ),
    now: testNow,
  });
  const strongAlphaResult = evaluateVolunteerRouteMatch({
    answers: baseAnswers,
    route: alphaRoute,
    ruleVersion: makeRuleVersion(
      "15151515-1515-4515-8515-151515151515",
      alphaRoute,
      strongRules
    ),
    now: testNow,
  });
  const strongBetaResult = evaluateVolunteerRouteMatch({
    answers: baseAnswers,
    route: betaRoute,
    ruleVersion: makeRuleVersion(
      "16161616-1616-4616-8616-161616161616",
      betaRoute,
      strongRules
    ),
    now: testNow,
  });

  const ranked = rankVolunteerRouteResults([
    potentialResult,
    strongBetaResult,
    strongAlphaResult,
  ]);

  assert.deepEqual(
    ranked.map((result) => result.routeName),
    ["Alpha Route", "Beta Route", "Beta Route"]
  );
  assert.equal(ranked[2]?.verdict, "Potential — Preparation Needed");
});

test("weltwärts age 27 is normal profile compatibility", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: { ...baseAnswers, age: 27 },
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "66666666-6666-4666-8666-666666666666",
      strongRoute,
      weltwaertsAgeRules
    ),
    now: testNow,
  });

  assert.equal(result.blockers.length, 0);
  assert.equal(result.verdict, "Strong Potential");
  assert.equal(result.reasons[0]?.conditionId, "weltwaerts-age-normal-range");
});

test("weltwärts age 31 with indicated applicable exception is not hard blocked and requires human review", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: {
      ...baseAnswers,
      age: 31,
      mayNeedAccessibilityAgeException: true,
    },
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "77777777-7777-4777-8777-777777777777",
      strongRoute,
      weltwaertsAgeRules
    ),
    now: testNow,
  });

  assert.equal(result.blockers.length, 0);
  assert.equal(result.verdict, "Needs Human Review");
  assert.equal(
    result.humanReviewReasons[0]?.conditionId,
    "weltwaerts-age-exception-review"
  );
});

test("weltwärts age 31 without indicated applicable exception is weak fit", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: {
      ...baseAnswers,
      age: 31,
      mayNeedAccessibilityAgeException: false,
    },
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "88888888-8888-4888-8888-888888888888",
      strongRoute,
      weltwaertsAgeRules
    ),
    now: testNow,
  });

  assert.equal(result.verdict, "Currently Weak Fit");
  assert.equal(
    result.blockers[0]?.conditionId,
    "weltwaerts-age-exception-required"
  );
});

test("weltwärts exception path does not collect sensitive diagnosis details", () => {
  assert.throws(() =>
    volunteerQuestionnaireAnswersSchema.parse({
      ...baseAnswers,
      age: 31,
      mayNeedAccessibilityAgeException: true,
      diagnosisDetails: "private medical information should not be accepted",
    })
  );
});

test("SCI age 27 is normal compatibility", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: { ...baseAnswers, age: 27 },
    route: sciRoute,
    ruleVersion: makeRuleVersion(
      "99999999-9999-4999-8999-999999999999",
      sciRoute,
      sciRules
    ),
    now: testNow,
  });

  assert.equal(result.blockers.length, 0);
  assert.equal(result.verdict, "Strong Potential");
  assert.equal(result.reasons[0]?.conditionId, "sci-age-normal-range");
});

test("SCI age 31 requires human review for exception or project-specific age path", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: { ...baseAnswers, age: 31 },
    route: sciRoute,
    ruleVersion: makeRuleVersion(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      sciRoute,
      sciRules
    ),
    now: testNow,
  });

  assert.equal(result.blockers.length, 0);
  assert.equal(result.verdict, "Needs Human Review");
  assert.equal(result.humanReviewReasons[0]?.conditionId, "sci-age-exception-review");
});

test("SCI age 35 is weak fit under base rules unless a verified project rule overrides it", () => {
  const baseResult = evaluateVolunteerRouteMatch({
    answers: { ...baseAnswers, age: 35 },
    route: sciRoute,
    ruleVersion: makeRuleVersion(
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      sciRoute,
      sciRules
    ),
    now: testNow,
  });

  assert.equal(baseResult.verdict, "Currently Weak Fit");
  assert.equal(baseResult.blockers[0]?.conditionId, "sci-age-supported-maximum");

  const overrideResult = evaluateVolunteerRouteMatch({
    answers: { ...baseAnswers, age: 35 },
    route: sciRoute,
    ruleVersion: makeRuleVersion(
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      sciRoute,
      sciProjectOverrideRules
    ),
    now: testNow,
  });

  assert.equal(overrideResult.blockers.length, 0);
  assert.equal(overrideResult.verdict, "Needs Human Review");
  assert.equal(
    sciProjectOverrideRules.projectSpecificOverrides[0]?.appliesToConditionIds[0],
    "sci-project-age-supported-maximum"
  );
});

test("project-specific override schema rejects unknown condition ids", () => {
  assert.throws(() =>
    volunteerEligibilityRulesSchema.parse({
      ...sciRules,
      projectSpecificOverrides: [
        {
          appliesToConditionIds: ["missing-condition"],
          dimension: "placement_availability",
          requiresVerifiedSource: true,
          note: "This should fail because the condition id does not exist.",
        },
      ],
    })
  );
});

test("stale rule versions require human review and expose stale source status", () => {
  const result = evaluateVolunteerRouteMatch({
    answers: baseAnswers,
    route: strongRoute,
    ruleVersion: makeRuleVersion(
      "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      strongRoute,
      strongRules,
      pastDueAt
    ),
    now: testNow,
  });

  assert.equal(result.verdict, "Needs Human Review");
  assert.equal(result.source.isVerificationStale, true);
  assert.equal(result.source.verificationDueAt, pastDueAt);
  assert.equal(
    result.humanReviewReasons[0]?.conditionId,
    "rule-version-verification-stale"
  );
});

test("route evaluation ranks best route first and omits internal score from public result", () => {
  const results = evaluateVolunteerRoutes(
    baseAnswers,
    [
      {
        route: sciRoute,
        ruleVersion: makeRuleVersion(
          "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          sciRoute,
          sciRules
        ),
      },
      {
        route: strongRoute,
        ruleVersion: makeRuleVersion(
          "ffffffff-ffff-4fff-8fff-ffffffffffff",
          strongRoute,
          strongRules
        ),
      },
    ],
    testNow
  );

  assert.equal(results[0]?.routeSlug, "sample-strong-route");

  const publicResult = toPublicVolunteerRouteResult(results[0]);
  assert.equal("internalScore" in publicResult, false);
});


