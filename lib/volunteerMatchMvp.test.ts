import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHumanReviewRequestInsertPayload,
  buildVolunteerMatchSummary,
  buildVolunteerMatchResponse,
  buildVolunteerRouteDimensionStatuses,
  getOrganisationConnectionStatus,
  getUnresolvedNotes,
  getVisibleVolunteerQuestionCount,
  getVisibleVolunteerQuestionFields,
  isKnownVolunteerAcquisitionSource,
  parseVolunteerAcquisitionSource,
  parseVolunteerMatchSubmission,
  shouldAskAccessibilityAgeException,
  shouldAskGermanA1Readiness,
  shouldAskVolunteerAcquisitionSource,
  shouldAskVolunteerExperienceDetails,
  volunteerHumanReviewSubmissionSchema,
  volunteerMatchClientEventSchema,
  type VolunteerLinkedOpportunity,
} from "./volunteerMatchMvp";
import {
  getVolunteerCountryName,
  parseVolunteerCountryCode,
} from "./volunteerMatchCountries";
import {
  checkRateLimit,
  isRapidDuplicateHumanReviewRequest,
  readJsonBodyWithLimit,
  VolunteerMatchRequestError,
} from "./volunteerMatchAbuseProtection";
import type {
  VolunteerQuestionnaireAnswers,
  VolunteerRouteResult,
} from "./volunteerMatchSchemas";

const sessionId = "11111111-1111-4111-8111-111111111111";
const routeId = "22222222-2222-4222-8222-222222222222";
const ruleVersionId = "33333333-3333-4333-8333-333333333333";
const programId = "44444444-4444-4444-8444-444444444444";

const validAnswers: VolunteerQuestionnaireAnswers = {
  age: 24,
  citizenship: "NG",
  residenceCountry: "NG",
  educationLevel: "secondary_school",
  completedCompulsorySchooling: true,
  germanLevel: "none",
  willingToLearnGerman: true,
  englishLevel: "working",
  passportReadiness: "valid",
  volunteerExperienceType: "formal",
  hasVolunteerExperience: true,
  volunteerExperienceMonths: 12,
  experienceEvidence: ["reference_letter"],
  preferredStartYear: 2027,
  preparationReadiness: "ready_for_documents",
  hasSendingOrganisationConnection: false,
  organisationConnectionStatus: "no",
  projectInterestAreas: ["social"],
  mayNeedAccessibilityAgeException: false,
  acquisitionSource: "tiktok",
};

const sampleResult: VolunteerRouteResult = {
  routeId,
  routeSlug: "sample-route",
  routeName: "Sample Volunteer Route",
  verdict: "Needs Human Review",
  internalScore: 82,
  reasons: [
    {
      conditionId: "age-fit",
      message: "Your age fits the published profile range.",
      category: "age",
      dimension: "profile_compatibility",
    },
  ],
  blockers: [],
  nextSteps: [
    {
      conditionId: "passport-ready",
      message: "Keep your passport ready before any official process.",
      category: "passport_readiness",
      dimension: "profile_compatibility",
    },
  ],
  humanReviewReasons: [
    {
      conditionId: "placement-check",
      message: "Placement availability must still be verified.",
      category: "project_specific",
      dimension: "placement_availability",
    },
  ],
  source: {
    sourceUrl: "https://example.com/source",
    sourceTitle: "Official sample source",
    sourceOrganisation: "Sample Organisation",
    lastVerifiedAt: "2026-08-19T00:00:00.000Z",
    verificationDueAt: "2027-02-19T00:00:00.000Z",
    isVerificationStale: false,
    verificationNotes: "Sample only.",
  },
  ruleVersionId,
  ruleVersionNumber: 1,
};

const linkedOpportunity: VolunteerLinkedOpportunity = {
  id: programId,
  title: "Verified Sample Opportunity",
  slug: "verified-sample-opportunity",
  country: "Germany",
  type: "Volunteer",
  fundingType: "Supported",
  deadline: null,
  relationshipType: "related_opportunity",
};

test("successful questionnaire submission works without login or contact fields", () => {
  const parsed = parseVolunteerMatchSubmission({
    answers: validAnswers,
    privacyNoticeAccepted: true,
  });

  assert.equal(parsed.answers.acquisitionSource, "tiktok");
  assert.equal(parsed.answers.germanLevel, "learning");
  assert.equal("name" in parsed.answers, false);
  assert.equal("email" in parsed.answers, false);
  assert.equal("phone" in parsed.answers, false);
});

test("invalid questionnaire input is rejected", () => {
  assert.throws(() =>
    parseVolunteerMatchSubmission({
      answers: { ...validAnswers, age: 12 },
      privacyNoticeAccepted: true,
    })
  );

  assert.throws(() =>
    parseVolunteerMatchSubmission({
      answers: validAnswers,
      privacyNoticeAccepted: false,
    })
  );
});

test("source=tiktok auto-captures to a supported acquisition source", () => {
  assert.equal(parseVolunteerAcquisitionSource("tiktok"), "tiktok");
  assert.equal(parseVolunteerAcquisitionSource("TikTok"), "tiktok");
  assert.equal(isKnownVolunteerAcquisitionSource("tiktok"), true);
  assert.equal(shouldAskVolunteerAcquisitionSource(true), false);
});

test("source query aliases map to supported acquisition-source values", () => {
  assert.equal(parseVolunteerAcquisitionSource("tiktok"), "tiktok");
  assert.equal(parseVolunteerAcquisitionSource("Google/Search"), "google");
  assert.equal(parseVolunteerAcquisitionSource("friend"), "referral");
  assert.equal(parseVolunteerAcquisitionSource("unknown-channel"), "other");
});

test("conditional questionnaire fields hide unnecessary follow-up questions", () => {
  const noExperienceYoungApplicant: VolunteerQuestionnaireAnswers = {
    ...validAnswers,
    age: 23,
    volunteerExperienceType: "none",
    hasVolunteerExperience: false,
    volunteerExperienceMonths: 0,
    experienceEvidence: ["none"],
  };
  const fields = getVisibleVolunteerQuestionFields(noExperienceYoungApplicant);

  assert.equal(getVisibleVolunteerQuestionCount(noExperienceYoungApplicant), 16);
  assert.equal(fields.includes("volunteerExperienceMonths"), false);
  assert.equal(fields.includes("experienceEvidence"), false);
  assert.equal(fields.includes("mayNeedAccessibilityAgeException"), false);
  assert.equal(fields.includes("acquisitionSource"), true);
});

test("known source is captured without showing the source question", () => {
  const fields = getVisibleVolunteerQuestionFields(validAnswers, {
    isInitialSourceKnown: true,
  });

  assert.equal(parseVolunteerAcquisitionSource("tiktok"), "tiktok");
  assert.equal(isKnownVolunteerAcquisitionSource("tiktok"), true);
  assert.equal(shouldAskVolunteerAcquisitionSource(true), false);
  assert.equal(fields.includes("acquisitionSource"), false);
});

test("conditional questionnaire fields show experience and age-exception questions only when relevant", () => {
  const experiencedApplicant: VolunteerQuestionnaireAnswers = {
    ...validAnswers,
    volunteerExperienceType: "formal",
    hasVolunteerExperience: true,
    volunteerExperienceMonths: 6,
    experienceEvidence: ["certificate"],
  };
  const exceptionRangeApplicant: VolunteerQuestionnaireAnswers = {
    ...experiencedApplicant,
    age: 31,
  };

  assert.equal(getVisibleVolunteerQuestionCount(experiencedApplicant), 18);
  assert.equal(getVisibleVolunteerQuestionCount(exceptionRangeApplicant), 19);
  assert.equal(shouldAskAccessibilityAgeException(31), true);
  assert.equal(shouldAskAccessibilityAgeException(36), false);
});

test("country inputs normalize to canonical ISO country values", () => {
  assert.equal(parseVolunteerCountryCode("Nigeria"), "NG");
  assert.equal(parseVolunteerCountryCode("Nigerian"), "NG");
  assert.equal(parseVolunteerCountryCode("NIGERIA"), "NG");
  assert.equal(parseVolunteerCountryCode("ng"), "NG");
  assert.equal(getVolunteerCountryName("NG"), "Nigeria");

  const parsed = parseVolunteerMatchSubmission({
    answers: {
      ...validAnswers,
      citizenship: "Nigerian",
      residenceCountry: "NIGERIA",
    },
    privacyNoticeAccepted: true,
  });

  assert.equal(parsed.answers.citizenship, "NG");
  assert.equal(parsed.answers.residenceCountry, "NG");
});

test("German A1 willingness question is conditional on having no German", () => {
  assert.equal(shouldAskGermanA1Readiness("none"), true);
  assert.equal(shouldAskGermanA1Readiness("a1"), false);
  assert.equal(shouldAskGermanA1Readiness("a2"), false);
  assert.equal(shouldAskGermanA1Readiness("b1_or_higher"), false);

  const parsed = parseVolunteerMatchSubmission({
    answers: {
      ...validAnswers,
      germanLevel: "a1",
      willingToLearnGerman: false,
    },
    privacyNoticeAccepted: true,
  });

  assert.equal(parsed.answers.germanLevel, "a1");
  assert.equal(parsed.answers.willingToLearnGerman, true);
});

test("formal and informal community experience both show detail questions", () => {
  const formalApplicant = { ...validAnswers, volunteerExperienceType: "formal" as const };
  const informalApplicant = {
    ...validAnswers,
    volunteerExperienceType: "informal_community" as const,
    hasVolunteerExperience: false,
    volunteerExperienceMonths: 4,
    experienceEvidence: ["photos_or_portfolio" as const],
  };
  const noExperienceApplicant = {
    ...validAnswers,
    volunteerExperienceType: "none" as const,
    hasVolunteerExperience: false,
    volunteerExperienceMonths: 0,
    experienceEvidence: ["none" as const],
  };

  assert.equal(shouldAskVolunteerExperienceDetails(formalApplicant), true);
  assert.equal(shouldAskVolunteerExperienceDetails(informalApplicant), true);
  assert.equal(shouldAskVolunteerExperienceDetails(noExperienceApplicant), false);

  const parsed = parseVolunteerMatchSubmission({
    answers: informalApplicant,
    privacyNoticeAccepted: true,
  });

  assert.equal(parsed.answers.volunteerExperienceType, "informal_community");
  assert.equal(parsed.answers.hasVolunteerExperience, true);
});

test("organisation connection unsure is preserved as unknown, not false", () => {
  const parsed = parseVolunteerMatchSubmission({
    answers: {
      ...validAnswers,
      hasSendingOrganisationConnection: false,
      organisationConnectionStatus: "unsure",
    },
    privacyNoticeAccepted: true,
  });

  assert.equal(getOrganisationConnectionStatus(parsed.answers), "unsure");
  assert.equal(parsed.answers.hasSendingOrganisationConnection, null);
});

test("normalization drops hidden accessibility exception answers outside the relevant age range", () => {
  const parsed = parseVolunteerMatchSubmission({
    answers: { ...validAnswers, age: 24, mayNeedAccessibilityAgeException: true },
    privacyNoticeAccepted: true,
  });

  assert.equal(parsed.answers.mayNeedAccessibilityAgeException, false);
});

test("public route response renders route results without internal numeric score", () => {
  const response = buildVolunteerMatchResponse({
    sessionId,
    acquisitionSource: "tiktok",
    results: [sampleResult],
    linkedOpportunitiesByRouteId: new Map([[routeId, [linkedOpportunity]]]),
  });

  assert.equal(response.results[0]?.routeName, "Sample Volunteer Route");
  assert.equal(response.results[0]?.linkedOpportunities[0]?.id, programId);
  assert.equal(response.results[0]?.dimensionStatuses.profileFit, "Preparation needed");
  assert.equal(
    response.results[0]?.dimensionStatuses.placementAvailability,
    "Needs verification"
  );
  assert.equal("internalScore" in response.results[0]!, false);

  const serialized = JSON.stringify(response);
  assert.equal(serialized.includes("internalScore"), false);
  assert.equal(serialized.includes("answers_json"), false);
  assert.equal(serialized.includes("email"), false);
  assert.equal(serialized.includes("whatsapp"), false);
});

test("route dimension statuses and overall summary are generated from evaluated results", () => {
  const strongResult: VolunteerRouteResult = {
    ...sampleResult,
    routeId: "55555555-5555-4555-8555-555555555555",
    routeSlug: "strong-route",
    routeName: "Strong Route",
    verdict: "Strong Potential",
    internalScore: 90,
    humanReviewReasons: [],
  };
  const potentialResult: VolunteerRouteResult = {
    ...sampleResult,
    routeId: "66666666-6666-4666-8666-666666666666",
    routeSlug: "potential-route",
    routeName: "Potential Route",
    verdict: "Potential — Preparation Needed",
    internalScore: 62,
  };
  const weakResult: VolunteerRouteResult = {
    ...sampleResult,
    routeId: "77777777-7777-4777-8777-777777777777",
    routeSlug: "weak-route",
    routeName: "Weak Route",
    verdict: "Currently Weak Fit",
    internalScore: 15,
    blockers: [
      {
        conditionId: "age-gap",
        message: "Age does not match this route.",
        category: "age",
        dimension: "profile_compatibility",
      },
    ],
    humanReviewReasons: [],
  };

  assert.equal(
    buildVolunteerRouteDimensionStatuses(weakResult).profileFit,
    "Weak fit"
  );

  const response = buildVolunteerMatchResponse({
    sessionId,
    acquisitionSource: "tiktok",
    results: [strongResult, potentialResult, weakResult],
    linkedOpportunitiesByRouteId: new Map(),
  });
  const summary = buildVolunteerMatchSummary(response.results);

  assert.equal(summary.priorityCount, 2);
  assert.equal(summary.headline, "2 routes look worth prioritising.");
  assert.equal(summary.bestRoute?.routeName, "Strong Route");
  assert.equal(summary.alsoWorthConsidering?.routeName, "Potential Route");
  assert.ok(summary.otherRoutesText.includes("currently weak fit"));
});

test("stale-rule status creates a public unresolved verification note", () => {
  const notes = getUnresolvedNotes({
    ...sampleResult,
    source: { ...sampleResult.source, isVerificationStale: true },
  });

  assert.ok(notes.some((note) => note.includes("overdue for re-verification")));
});

test("human-review validation requires consent and a valid contact route", () => {
  assert.throws(() =>
    volunteerHumanReviewSubmissionSchema.parse({
      sessionId,
      name: "Applicant",
      email: "person@example.com",
      whatsapp: "",
      preferredContactMethod: "email",
      note: "Please review my route fit.",
      website: "",
      consentToContact: false,
      privacyNoticeVersion: "volunteer-match-privacy-v1",
    })
  );

  assert.throws(() =>
    volunteerHumanReviewSubmissionSchema.parse({
      sessionId,
      name: "Applicant",
      email: "",
      whatsapp: "",
      preferredContactMethod: "email",
      note: "Please review my route fit.",
      website: "",
      consentToContact: true,
      privacyNoticeVersion: "volunteer-match-privacy-v1",
    })
  );

  const parsed = volunteerHumanReviewSubmissionSchema.parse({
    sessionId,
    name: "Applicant",
    email: "person@example.com",
    whatsapp: "",
    preferredContactMethod: "email",
    note: "Please review my route fit.",
    website: "",
    consentToContact: true,
    privacyNoticeVersion: "volunteer-match-privacy-v1",
  });

  assert.equal(parsed.email, "person@example.com");
});

test("human-review preferred_contact_method is validated and persisted separately", () => {
  assert.throws(() =>
    volunteerHumanReviewSubmissionSchema.parse({
      sessionId,
      name: "Applicant",
      email: "person@example.com",
      whatsapp: "",
      preferredContactMethod: "sms",
      note: "Please review my route fit.",
      website: "",
      consentToContact: true,
      privacyNoticeVersion: "volunteer-match-privacy-v1",
    })
  );

  const submission = volunteerHumanReviewSubmissionSchema.parse({
    sessionId,
    name: "Applicant",
    email: "",
    whatsapp: "+2340000000000",
    preferredContactMethod: "whatsapp",
    note: "Please review my route fit.",
    website: "",
    consentToContact: true,
    privacyNoticeVersion: "volunteer-match-privacy-v1",
  });
  const payload = buildHumanReviewRequestInsertPayload({
    submission,
    consentedAt: "2026-08-19T10:00:00.000Z",
  });

  assert.equal(payload.preferred_contact_method, "whatsapp");
  assert.equal(payload.message?.includes("Preferred contact method"), false);
  assert.equal(payload.message, "Applicant note: Please review my route fit.");
});

test("human-review honeypot rejects likely bot submissions", () => {
  assert.throws(() =>
    volunteerHumanReviewSubmissionSchema.parse({
      sessionId,
      name: "Applicant",
      email: "person@example.com",
      whatsapp: "",
      preferredContactMethod: "email",
      note: "Please review my route fit.",
      website: "https://spam.example",
      consentToContact: true,
      privacyNoticeVersion: "volunteer-match-privacy-v1",
    })
  );
});

test("rapid duplicate human-review requests are detected by session and contact", () => {
  const now = new Date("2026-08-19T10:10:00.000Z");
  const recentRequests = [
    {
      email: "person@example.com",
      whatsapp: null,
      created_at: "2026-08-19T10:05:00.000Z",
    },
  ];

  assert.equal(
    isRapidDuplicateHumanReviewRequest({
      existingRequests: recentRequests,
      email: "PERSON@example.com",
      now,
    }),
    true
  );
  assert.equal(
    isRapidDuplicateHumanReviewRequest({
      existingRequests: recentRequests,
      email: "other@example.com",
      now,
    }),
    false
  );
  assert.equal(
    isRapidDuplicateHumanReviewRequest({
      existingRequests: recentRequests,
      email: "person@example.com",
      now: new Date("2026-08-19T10:20:01.000Z"),
    }),
    false
  );
});

test("body-size and rate-limit helpers reject oversized or rapid requests", async () => {
  const largeRequest = new Request("https://tripdoc.test/api/volunteer-match", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "x".repeat(40) }),
  });

  await assert.rejects(
    () => readJsonBodyWithLimit(largeRequest, 20),
    (error) =>
      error instanceof VolunteerMatchRequestError && error.status === 413
  );

  const store = new Map<string, number[]>();
  assert.equal(checkRateLimit({ store, key: "test", limit: 2, windowMs: 1000, now: 100 }).allowed, true);
  assert.equal(checkRateLimit({ store, key: "test", limit: 2, windowMs: 1000, now: 200 }).allowed, true);
  assert.equal(checkRateLimit({ store, key: "test", limit: 2, windowMs: 1000, now: 300 }).allowed, false);
  assert.equal(checkRateLimit({ store, key: "test", limit: 2, windowMs: 1000, now: 1301 }).allowed, true);
});

test("linked opportunity click event requires session, route, and program ids", () => {
  const event = volunteerMatchClientEventSchema.parse({
    eventName: "matching_opportunity_clicked",
    sessionId,
    routeId,
    programId,
  });

  assert.equal(event.eventName, "matching_opportunity_clicked");

  assert.throws(() =>
    volunteerMatchClientEventSchema.parse({
      eventName: "matching_opportunity_clicked",
      sessionId,
      routeId,
    })
  );
});

test("volunteer match view event captures source without requiring a session", () => {
  const event = volunteerMatchClientEventSchema.parse({
    eventName: "volunteer_match_viewed",
    acquisitionSource: "tiktok",
  });

  assert.equal(event.eventName, "volunteer_match_viewed");
  assert.equal(event.acquisitionSource, "tiktok");
  assert.equal(event.sessionId, undefined);

  assert.throws(() =>
    volunteerMatchClientEventSchema.parse({
      eventName: "human_review_clicked",
    })
  );

  assert.throws(() =>
    volunteerMatchClientEventSchema.parse({
      eventName: "volunteer_match_viewed",
      acquisitionSource: "newsletter",
    })
  );
});


