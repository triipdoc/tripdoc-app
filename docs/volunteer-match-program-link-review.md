# Volunteer Match Phase 1 Program Link Review

No `volunteer_match_route_programs` seed links were added in Phase 1.

Reason: existing volunteer opportunity records need editorial review before the matcher points users to them.

## Confirmed SCI short-term metadata mismatch

- `db92384b-ac3e-49a5-a044-4d3c7a1654a6`
  - Current title: `Germany BFD, FSJ and FÖJ Volunteer Visa Route`
  - Current slug: `sci-germany-short-term-workcamps-2026`
  - Current official URL: `https://www.sci-d.de/english`
  - Current description: describes SCI Germany short-term workcamps.
  - Confirmed issue: the slug, official URL, and description are SCI-related, but the title incorrectly refers to BFD/FSJ/FÖJ.

Approved correction direction, not applied to production yet:

- Keep slug: `sci-germany-short-term-workcamps-2026`
- Correct title to: `SCI Germany Short-Term Workcamps 2026`
- Keep SCI short-term workcamps separate from BFD, FSJ, and FÖJ.
- Do not link this row to BFD, FSJ, or FÖJ Volunteer Match routes.

## Grouped BFD/FSJ/FÖJ record requiring future review

- `0c86e8b9-d8fb-4aac-a6d0-3c67dfc13da7`
  - Current title: `Germany BFD, FSJ and FÖJ Volunteer Visa Route`
  - Current slug: `germany-bfd-fsj-and-fj-volunteer-visa-route`
  - Current official URL: `https://www.bundes-freiwilligendienst.de/volunteering-germany/`
  - Issue: this groups BFD, FSJ, and FÖJ together, while Volunteer Match treats them as separate route records. The slug also appears to use `fj` instead of `foej`.

Do not silently rename, split, or delete this production row yet.

## SCI long-term record requiring source review

- `5781c5ec-f94c-4b63-bba3-4d4014d3eb9f`
  - Current title: `SCI Germany Long-Term Volunteer Programme for Selected African Countries`
  - Current slug: `sci-germany-long-term-volunteering-africa`
  - Current official URL: `https://sci-d.de/`
  - Issue: this is the closest existing record for SCI long-term volunteering, but the route source used for Phase 1 rule provenance is `https://sci-d.de/application`. Review and update the public program source before linking.

## Safe future migration path for the grouped BFD/FSJ/FÖJ record

The safest path is to preserve existing public links first, then introduce separate verified pages.

1. Keep the existing grouped record live temporarily.
   - Do not delete it immediately, because it may already have analytics, SEO visibility, and shared public links.

2. Create three separate verified programme records:
   - BFD: suggested slug `bundesfreiwilligendienst-bfd-germany-volunteer-route`
   - FSJ: suggested slug `freiwilliges-soziales-jahr-fsj-germany-volunteer-route`
   - FÖJ: suggested slug `freiwilliges-oekologisches-jahr-foej-germany-volunteer-route`

3. Use official route-specific sources for each new programme record.
   - BFD should not inherit FSJ/FÖJ requirements.
   - FSJ should not inherit BFD/FÖJ requirements.
   - FÖJ should not inherit BFD/FSJ requirements.

4. Add `volunteer_match_route_programs` links only after those separate programme records exist and are verified.

5. Add a redirect or canonical transition for the old grouped slug only after verifying how the current app handles redirects.
   - If the old grouped page remains useful, keep it as an overview page that links to the three separate records.
   - If it is replaced, preserve the old URL with a 301 redirect to a stable overview or the most appropriate new page.

6. Preserve analytics history.
   - Do not rewrite old `clicks.program_id` values.
   - New separate programme records should accumulate their own analytics from the date they go live.
   - If a future dashboard needs combined history, aggregate old grouped-record clicks separately instead of mutating historical click rows.

7. Preserve SEO and user trust.
   - Update title, description, canonical URL, and internal links deliberately.
   - Avoid changing slugs without redirects.
   - Keep disclaimers that BFD, FSJ, and FÖJ are not guaranteed job, placement, visa sponsorship, visa support, visa eligibility, or residence-permit approval routes.

## Recommendation before Phase 2 linking

1. Correct the SCI short-term title mismatch.
2. Decide whether the grouped BFD/FSJ/FÖJ page should become an overview or be redirected later.
3. Create separate BFD, FSJ, and FÖJ public programme records.
4. Update SCI long-term official URL to the exact application/source page where appropriate.
5. Only then seed `volunteer_match_route_programs` links.
