import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import SafeMarkdown from "../app/components/SafeMarkdown";
import { createAdminSession, verifyAdminSession, ADMIN_SESSION_SECONDS, isSameOriginRequest } from "../lib/adminSession";
import { proxy as middleware } from "../proxy";
import { validateProgramAdminPayload, isDeadlinePassed, isPublicProgramListVisible, isPublicProgramDetailVisible } from "../lib/opportunityPrograms";
const draft = { title: "Test opportunity", publishing_status: "draft" };
test("drafts save partially; publishing requires description, type and application instructions", () => {
  assert.deepEqual(validateProgramAdminPayload(draft).errors, []);
  const result = validateProgramAdminPayload({ ...draft, publishing_status: "published" });
  assert.ok(result.errors.some(e => e.includes("Description")));
  assert.ok(result.errors.some(e => e.includes("Type")));
  assert.ok(result.errors.some(e => e.includes("application")));
});
test("verified and sponsorship claims require evidence", () => {
  assert.equal(validateProgramAdminPayload({ ...draft, verification_status: "verified" }).errors.length, 3);
  const result = validateProgramAdminPayload({ ...draft, verification_status: "verified", reviewer_name: "Editor", verified_at: "2026-01-01", official_source_links: [{ url: "https://example.org/official" }] });
  assert.deepEqual(result.errors, []);
  assert.ok(validateProgramAdminPayload({ ...draft, sponsorship_status: "confirmed" }).errors.length);
});
test("invalid URLs, malformed arrays, dates, enums, amounts and timezones are rejected", () => {
  for (const fields of [{ official_url: "javascript:alert(1)" }, { image_url: "data:text/html,bad" }, { official_url: "https://user:password@example.org" }, { official_source_links: {} }, { additional_application_steps: "bad" }, { deadline: "2026-02-31" }, { publishing_status: "oops" }, { funding_amount: -1 }, { funding_amount: "abc" }, { deadline_time: "25:30" }, { deadline_timezone: "Mars/City" }, { deadline_time: "15:30" }, { verified_at: "not a date" }, { verified_at: "2999-01-01" }]) assert.ok(validateProgramAdminPayload({ ...draft, ...fields }).errors.length, JSON.stringify(fields));
});
test("multiple required steps retain order and links", () => {
  const result = validateProgramAdminPayload({ ...draft, additional_application_steps: [{ id: "a", label: "Portal", url: "https://example.org/apply", required: true }, { id: "b", label: "Questionnaire", instructions: "Complete it too", url: "https://example.org/form", required: true }] });
  assert.deepEqual(result.errors, []); assert.deepEqual(result.payload.additional_application_steps.map(s => s.id), ["a", "b"]);
  assert.ok(result.payload.additional_application_steps.every(s => s.required));
});
test("expiry honors official timezone/time and conservative date-only grace", () => {
  assert.equal(isDeadlinePassed("2026-09-13", "fixed_date", new Date("2026-09-13T12:01:00Z"), "14:00", "Europe/Berlin"), true);
  assert.equal(isDeadlinePassed("2026-09-13", "fixed_date", new Date("2026-09-13T11:59:00Z"), "14:00", "Europe/Berlin"), false);
  assert.equal(isDeadlinePassed("2026-09-13", "fixed_date", new Date("2026-09-14T11:00:00Z")), false);
  assert.equal(isDeadlinePassed("2026-09-13", "fixed_date", new Date("2026-09-14T12:00:00Z")), true);
  for (const mode of ["rolling", "unknown"]) assert.equal(isDeadlinePassed("2020-01-01", mode), false);
});
test("public visibility hides drafts, closed and archived list entries; archive details survive", () => {
  assert.equal(isPublicProgramDetailVisible({ publishing_status: "draft", verification_status: "verified" }), false);
  assert.equal(isPublicProgramDetailVisible({ publishing_status: "archived" }), true);
  const records = [{ publishing_status: "published", availability_status: "open" }, { publishing_status: "archived" }, { publishing_status: "published", availability_status: "closed" }, { publishing_status: "published", deadline: "2000-01-01", deadline_mode: "fixed_date" }];
  assert.equal(records.filter(isPublicProgramListVisible).length, 1);
});
test("Markdown produces working links and numbered/bullet lists without executable markup", () => {
  const html = renderToStaticMarkup(<SafeMarkdown content={'## Eligibility\n\n- Item\n\n1. Step\n\n[Official](https://example.org)\n\n[Bad](javascript:alert%281%29)\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1) />'} />);
  assert.match(html, /<h2/); assert.match(html, /<ul/); assert.match(html, /<ol/); assert.match(html, /href="https:\/\/example.org"/);
  assert.ok(!html.includes("javascript:")); assert.ok(!html.includes("<script")); assert.ok(!html.includes("onerror"));
});
test("signed admin sessions reject fixed, tampered and expired tokens; middleware checks APIs", async () => {
  const prior = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "local-test-secret-not-used-in-production";
  try {
    const now = Date.now(); const token = await createAdminSession(now);
    assert.equal(await verifyAdminSession(token, now), true);
    assert.equal(await verifyAdminSession("yes", now), false);
    assert.equal(await verifyAdminSession(token + "x", now), false);
    assert.equal(await verifyAdminSession(token, now + ADMIN_SESSION_SECONDS * 1000), false);
    for (const path of ["/api/admin/programs", "/api/admin/human-reviews", "/api/admin-analytics"]) {
      assert.equal((await middleware(new NextRequest(`https://tripdoc.test${path}`, { headers: { cookie: "tripdoc_admin_auth=yes" } }))).status, 401);
      assert.equal((await middleware(new NextRequest(`https://tripdoc.test${path}`, { headers: { cookie: `tripdoc_admin_auth=${token}` } }))).status, 200);
    }
    assert.equal(isSameOriginRequest(new Request("https://tripdoc.test/api/admin/programs", { method: "POST", headers: { origin: "https://attacker.test" } })), false);
  } finally { if (prior === undefined) delete process.env.ADMIN_SESSION_SECRET; else process.env.ADMIN_SESSION_SECRET = prior; }
});

test("admin login failures are rate limited per client window", async () => {
  const { checkAdminLoginLimit, recordAdminLoginFailure, clearAdminLoginFailures } = await import("../lib/adminLoginRateLimit");
  const key = `test-${crypto.randomUUID()}`;
  for (let index = 0; index < 5; index += 1) { assert.equal(checkAdminLoginLimit(key).allowed, true); recordAdminLoginFailure(key); }
  const blocked = checkAdminLoginLimit(key); assert.equal(blocked.allowed, false); assert.ok(blocked.retryAfter > 0); clearAdminLoginFailures(key);
});
