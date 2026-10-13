# Nexus AI (foundation build)

Phase 1 of the Nexus AI rebuild: Prisma data model, email/password auth, onboarding, and the authenticated dashboard shell.

> **Status: written but not yet run.** This code was authored in a sandbox with no network, so dependencies were never installed and `typecheck`, `test`, and `build` have not been executed. Expect to fix small issues on first run (especially package versions: Next 15, Auth.js v5 beta, Tailwind 4, Prisma 6).

## Run locally
```bash
npm install
cp .env.example .env        # set DATABASE_URL and AUTH_SECRET (npx auth secret)
npx prisma migrate dev --name init
npm run dev                 # http://localhost:3000
npm run typecheck && npm test
```

## Deploy
`npm run build` then `npm start`. Apply migrations with `npx prisma migrate deploy`. Set the env vars from `.env.example` (plus `AUTH_TRUST_HOST=true` when self-hosting).

## What exists
- Landing page (minimal), register, login, logout, session persistence, protected routes (middleware + server checks)
- Registration creates user, workspace, OWNER membership, and Free subscription in one transaction
- Onboarding (resumable, skippable) and dashboard with real, workspace-scoped data and empty states
- Tenant guard: `src/lib/workspace.ts` (`requireWorkspaceContext`, `assertRole`)
- Unit tests: validation, redirect safety, rate limiting

## Not built yet
Password reset and email verification (needs an email provider), full marketing site and legal pages, AI agents, workflows and job queue, leads, campaigns, email, CRM, analytics, integrations, billing, settings, team invites, Playwright tests. These routes show an explicit "Not built yet" screen.

## Known limitations
- Rate limiter is in-memory (single instance only).
- Auth.js JWT sessions: no "remember me" toggle, and logout invalidates only the browser cookie.
- API routes are not covered by middleware; each handler must call `requireWorkspaceContext()`.

## Phase 2: AI agents (also unrun)
Create, list, pause/resume, and run agents against the Anthropic Messages API (`ANTHROPIC_API_KEY`). Plan limits live in `src/config/limits.ts` and are enforced server-side. Agent creation is a single form (not multi-step); tools and per-agent usage limits are not implemented. Run `npx prisma migrate dev` again, since the schema gained fields. Monthly-limit checks are not race-proof under heavy concurrency.

## Phase 3: Leads (also unrun)
Manual add/edit, status, follow-up date, search and status filter (first 100 results), CSV import (max 1,000 rows, duplicate emails skipped) and CSV export (formula-injection guarded). No third-party lead-data providers, assignment to other owners, delete, or pagination yet.

## Phase 4: CRM (also unrun)
Companies, contacts, and deals (stage board with per-column totals, move deals between stages). Foreign keys (company) are verified against the workspace on the server. Run `npx prisma migrate dev` again (new Company, Contact, Deal models). Not built: edit/delete of CRM records, contact-to-deal links, assigning other owners, drag-and-drop, and mixed-currency conversion (totals are shown per currency).

## Phase 5: Campaigns (also unrun)
Create/edit campaigns, manual status tracking (draft/planned/active/completed), AI-drafted brief, posts, copy and calendar (editable before saving; monthly draft cap per plan in `src/config/limits.ts`). Not built: direct publishing, platform metrics, delete. Run `npx prisma migrate dev` again (new Campaign fields).

## Phase 6: Workflow automation (also unrun)
Trigger (manual, or lead added) -> conditions (valid email, status, source) -> ordered actions (notify team, set lead status, set follow-up, AI draft saved to lead notes). Actions only touch your own workspace data: **no external messages are sent**, so no approval step is needed yet.

How it runs: executions are rows in `WorkflowExecution`. A unique `(workflowId, idempotencyKey)` stops duplicate runs (one run per lead per workflow). Workers claim rows atomically (PENDING -> RUNNING), completed steps are logged so a retry resumes after the last finished step, and runs stuck in RUNNING for 10+ minutes are marked failed (max 5 attempts).

**You must schedule the worker**: call `GET/POST /api/cron/workflows` every minute with `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this automatically when `CRON_SECRET` is set; otherwise use GitHub Actions, cron-job.org, or a system cron). Without it, event-triggered runs stay pending. Development alternative: the "Process pending now" button. Manual test runs execute immediately.

Not built: time-based schedules, leads from CSV import triggering workflows, email actions (with approval), branching. Run `npx prisma migrate dev` again.

## Phase 7: Email (also unrun)
Templates (create/edit/delete), compose to a lead (one recipient at a time, no bulk), optional AI draft, **admin approval required before sending**, send through Resend, failure reporting with retry, per-workspace unsubscribe list. Every sent email gets your postal address and a signed one-click unsubscribe link; suppressed recipients are never emailed.

Sending is disabled until `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FOOTER_ADDRESS`, and `APP_URL` are set (the UI shows what is missing). Status "Accepted by provider" means Resend took the message, **not** that it was delivered: delivery/bounce webhooks are not implemented yet. Resend's idempotency key (the message id) guards against duplicate sends on retry. AI drafts share one monthly pool with campaign drafts; send caps are in `src/config/limits.ts`.

Not built: scheduled sends and follow-up sequences (need the worker/scheduler from Phase 6 extended), editing a draft after saving (discard and recreate), contacts as recipients, delivery webhooks, HTML emails. Run `npx prisma migrate dev` again.

## Phase 8: Analytics (also unrun)
7/30/90-day views (UTC days) of agent runs, workflow runs, leads created, emails accepted, daily activity chart (Recharts, only drawn when there is data), plan usage vs limits, and a campaign/deal snapshot. Each figure is documented on screen; ROI, revenue, conversion, and email open/delivery rates are deliberately not shown. Counts are capped at 20,000 rows per metric. Adds the `recharts` dependency; no schema changes.

## Phase 9: Integrations (also unrun)
Registry of integrations with honest status: Anthropic and Resend are real (configured via env vars, with an on-demand live check recorded per workspace); payments, webhooks, external CRM sync, and social/ad platforms are listed as **Planned** with no actions. There are no per-workspace credential fields: this build is single-deployment, so keys live in server env vars. Check calls: Anthropic `GET /v1/models`, Resend `GET /domains` (a sending-only Resend key is reported as valid but unable to inspect domains); these endpoint behaviors are assumptions I could not test. Run `npx prisma migrate dev` again (new IntegrationCheck model).

## Phase 10: Billing (also unrun)
Stripe subscriptions without the SDK (plain HTTPS). Owner-only checkout (Stripe-hosted) and customer portal (invoices, plan changes, cancellation live in the portal). **Plans change only in the webhook** (`POST /api/webhooks/stripe`): the raw body's signature is verified (HMAC, 5-minute tolerance), events are de-duplicated by id (`BillingEvent`), out-of-order events are ignored, and unknown prices or incomplete payments never grant a plan. The checkout success page is informational only. Canceled/deleted subscriptions return to Free; past-due keeps the plan and shows a warning.

Setup: create 3 recurring prices in Stripe, set the `STRIPE_*` vars, add a webhook endpoint for `customer.subscription.created/updated/deleted`. Display prices in `src/config/plans.ts` must match your Stripe prices. Assumptions I could not test: Stripe's current API field locations (I read `current_period_end` from both the subscription and its first item) and portal/checkout parameters. Not built: in-app invoice list, proration previews, trials, enforcement of limits on `PAST_DUE`. Run `npx prisma migrate dev` again.

## Phase 11: Settings and team (also unrun)
Profile (name), business details, password change (current password required, rate limited), team management, and workspace switching. Invites are **single-use links you share yourself** (no email is sent): only a SHA-256 hash is stored, links expire in 1-14 days, acceptance is atomic and requires sign-in. Roles: the owner changes roles; admins invite/remove members only; the owner can't be removed and ownership can't be transferred (not built). The active workspace is a cookie that is only honored for workspaces you belong to.

Not built: email change (needs verification), notification preferences (nothing sends notifications yet, and the page says so), ownership transfer, leaving a workspace, per-role permissions beyond owner/admin/member. Run `npx prisma migrate dev` again (new WorkspaceInvite model).

## Phase 12: Password reset and email verification (also unrun)
Forgot password -> emailed link (1 hour, single-use, hashed at rest, earlier links revoked) -> set new password. The forgot page never reveals whether an account exists (and rate limits quietly). **If email isn't configured, the page says so instead of pretending to send.** Account emails need `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` (no postal address needed). Verification links last 24 hours and require clicking a confirm button (so mail scanners can't consume them).

Policy: unverified users can use the app but see a banner, and **cannot send lead emails** until their own address is verified. If transactional email isn't configured, the banner says verification isn't set up (so sending stays blocked; that's consistent, because sending needs the same provider).

Sessions: the JWT carries a sign-in timestamp (`authAt`); a password change or reset sets `passwordChangedAt`, and any session older than it is rejected server-side. After changing your password in Settings you're signed out everywhere and sent to login. Caveat: this check runs in server components/actions (via `getWorkspaceContext`), not in the Edge middleware, so API routes that don't call it won't see the invalidation. Run `npx prisma migrate dev` again (AuthToken model, User.passwordChangedAt).

## Phase 13: Marketing site and legal drafts (also unrun)
Landing page (hero, illustrative dashboard preview with no real numbers, 8 feature cards linking to the modules, solutions, how it works with available vs planned integrations read from the integrations registry, pricing read from `src/config/plans.ts` and `src/config/limits.ts`), header with mobile menu (shows Dashboard when signed in), footer, Help Center FAQ, Contact page (shows a "not published" notice until `NEXT_PUBLIC_CONTACT_EMAIL` is set), and **draft** Privacy Policy and Terms of Service whose open items are marked `[TBD]`. These legal pages describe what the code actually does (providers, cookies, hashing) but are not legal advice and need review by a lawyer before launch. No testimonials, customer counts, certifications, partnerships, company numbers, or addresses are invented. The old minimal `app/page.tsx` was replaced by `app/(marketing)/page.tsx`.
