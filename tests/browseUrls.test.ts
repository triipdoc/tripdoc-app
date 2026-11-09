import assert from "node:assert/strict";
import test from "node:test";
import { browseSlug, browseRouteSlug, browsePattern, decodeBrowseValue, canonicalBrowsePath } from "../lib/browseUrls";

test("stored labels and legacy encoded routes reach the same destination", () => {
  for (const label of ["Graduate Admissions", "Short-term Internship", "Czech Republic — Czechia", "Paid traineeship / journalism training", "Dundee, Scotland, United Kingdom"]) {
    const slug = browseSlug(label);
    assert.equal(browseRouteSlug(encodeURIComponent(label.toLowerCase())), slug);
    assert.equal(browseRouteSlug(slug), slug);
    assert.ok(!slug.includes("/"));
  }
});
test("matching permits literal hyphens without accepting unrelated candidates", () => {
  assert.equal(browsePattern("short-term-internship"), "short%term%internship");
  assert.equal(browseSlug("Short-term Internship"), browseRouteSlug("short-term-internship"));
  assert.notEqual(browseSlug("Short term paid internship"), browseRouteSlug("short-term-internship"));
});
test("literal wildcard characters are escaped and malformed escapes do not crash", () => {
  assert.equal(browsePattern("100%25_funded"), "100\\%\\_funded");
  assert.equal(decodeBrowseValue("bad%ZZ"), "bad%ZZ");
  assert.equal(browseRouteSlug("bad%ZZ"), "bad%25zz");
});

test("reported soft-404 and duplicate paths converge without a redirect loop", () => {
  const cases = [
    ["/category/undergraduate%20entrance%20scholarship", "/types/undergraduate-entrance-scholarship"],
    ["/country/germany%20%E2%80%94%20konstanz", "/countries/germany-%E2%80%94-konstanz"],
    ["/countries/denmark%20%E2%80%94%20copenhagen", "/countries/denmark-%E2%80%94-copenhagen"],
    ["/countries/netherlands%20%E2%80%94%20utrecht", "/countries/netherlands-%E2%80%94-utrecht"],
  ];
  for (const [oldPath, preferred] of cases) {
    assert.equal(canonicalBrowsePath(oldPath), preferred);
    assert.equal(canonicalBrowsePath(preferred), preferred);
  }
  assert.equal(canonicalBrowsePath("/manage-tripdoc"), null);
  assert.equal(canonicalBrowsePath("/programs/example"), null);
});
