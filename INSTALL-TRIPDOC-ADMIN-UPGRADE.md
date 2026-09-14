# TripDoc opportunity-admin upgrade

This package completes the missing `/manage-tripdoc/ProgramDashboardClient` and upgrades opportunity editing, public rendering, database access and admin authentication.

## What changes

- A structured opportunity editor with search, filters, pagination, draft/publish/archive states, review queues and unsaved-change protection.
- Safe Markdown editing and preview for headings, lists and links. Raw HTML and unsafe link protocols are not rendered.
- A primary application URL plus ordered, repeatable application steps that can be marked required.
- Funding coverage, applicant costs, vacancy-specific sponsorship evidence and source URL fields.
- Separate publication, verification and availability statuses. “Verified” requires a reviewer, an actual review date and an official source.
- Fixed, rolling and unknown deadlines, with optional official time and IANA timezone. When only a date is published, TripDoc uses a conservative worldwide end-of-day grace period.
- Server-side image validation, resizing and WebP conversion, plus required editorial support for alternative text.
- SEO title/description overrides with defaults and a search preview.
- Locked URLs after the first save, archive instead of delete, optimistic concurrency and atomic database change history.
- Signed 12-hour admin sessions, same-origin write checks, login throttling and server-only admin writes.
- Public pages read a restricted view that excludes private reviewer notes. The final migration revokes legacy direct table access.

The current login is still one shared admin password. Change history therefore records `shared-admin`; it does not prove which person made a change. Before giving access to multiple staff members, replace this with individual Supabase Auth accounts and roles.

## Before touching production

1. Make a Git backup of the current project:

   ```powershell
   git add -A
   git commit -m "Backup before TripDoc admin upgrade"
   ```

2. Create a Supabase database backup from the project dashboard. Do not continue without a restorable backup.
3. In the Supabase SQL editor, run these read-only checks and save the results:

   ```sql
   select slug, count(*)
   from public.programs
   group by slug
   having count(*) > 1;

   select policyname, cmd, roles, qual, with_check
   from pg_policies
   where schemaname in ('public', 'storage')
     and tablename in ('programs', 'objects')
   order by schemaname, tablename, policyname;
   ```

   Resolve every duplicate slug before the first migration. The migration deliberately stops if `programs.id` is not UUID or `verification_status` is not text.

4. Generate a separate session-signing secret locally:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Add the generated value to Vercel as `ADMIN_SESSION_SECRET` for Preview and Production. Keep the existing `ADMIN_DASHBOARD_PASSWORD`. Never add either value to Git.

## Zero-downtime installation order

1. Extract this ZIP into the root of the TripDoc repository and overwrite matching files:

   ```powershell
   Expand-Archive .\TripDoc-admin-upgrade.zip -DestinationPath . -Force
   Remove-Item .\middleware.ts -ErrorAction SilentlyContinue
   npm ci
   ```

   Next.js 16 uses `proxy.ts`; the old `middleware.ts` must be removed.

2. Run the first migration in Supabase SQL Editor by copying the complete contents of:

   `supabase/migrations/20260913000000_program_admin_public_upgrade.sql`

   This phase adds and backfills fields, creates the safe public view and atomic audit triggers, and blocks public writes. It temporarily leaves legacy public reads available so the current deployment keeps working.

3. Validate and commit the code:

   ```powershell
   npm run test:admin
   npm run test:volunteer-match
   npm run typecheck
   npm run build
   git add -A
   git commit -m "Complete TripDoc opportunity admin upgrade"
   git push
   ```

4. Wait for the Vercel deployment to succeed. Then test:

   - Sign in at `/manage-tripdoc`.
   - Create a draft with only a title and save it.
   - Reopen the draft and confirm its history appears.
   - Add two required application steps and confirm both links work in Preview and on a public test record.
   - Confirm publication is blocked until description, type and application instructions exist.
   - Confirm “Verified” is blocked until reviewer, review date and an official source exist.
   - Upload a small test image, add alternative text, save, and confirm the public image loads.
   - Archive the test record. Confirm its direct URL remains available while it disappears from `/programs`, search suggestions and the sitemap.
   - Confirm an existing opportunity page and Volunteer Match still work.

5. Only after those checks pass, run the second migration:

   `supabase/migrations/20260913001000_program_admin_security_finalize.sql`

   This removes legacy direct reads of `programs` and routes program-image writes through the authenticated server endpoint.

6. Recheck the homepage, `/programs`, one category, one country, search suggestions, an archived direct URL and the admin editor.

## Rollback

- If migration phase 1 fails, its transaction rolls back automatically. Save the full SQL error and do not edit the migration blindly.
- If the new app deployment fails before phase 2, redeploy the previous Vercel deployment. Phase 1 intentionally preserves its public reads.
- Do not run phase 2 until the new deployment passes the smoke tests.
- After phase 2, keep the new application code deployed. Rolling back to the old app requires restoring the recorded grants/policies and database backup; generic `GRANT SELECT` would expose the new private reviewer fields and is unsafe.
- Application records are archived rather than deleted, and existing slugs are locked. This protects indexed URLs and makes editorial mistakes recoverable.

## Verification completed on this package

- Production Next.js build: passed with Next.js 16.1.7.
- TypeScript strict check: passed.
- New admin/security tests: 9 passed.
- Existing Volunteer Match tests: 45 passed.
- PostgreSQL-compatible migration test: passed for legacy backfill, RLS and column grants, private-note exclusion, ordered application-step JSON, archive URLs, duplicate slugs, concurrent edits, image storage restrictions and audit rollback atomicity.

The PostgreSQL-compatible migration test is strong local evidence, but it is not a substitute for the backup and live-schema preflight because the supplied ZIP does not contain your production database schema or policy history.
