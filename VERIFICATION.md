# Verification record — October 26, 2026

## Findings and changes

The original repository had HTML/CSS/JS only, no dependencies, backend or Vercel
configuration. The deployed HTML/app matched `c573ffe`. Its public settings were
preview mode with empty capture/calendar/privacy settings. The old code silently
fell back to preview if live configuration was incomplete, trusted a `mode` query
to show a submitted state and had no server implementation for its endpoint contract.

- `assets/app.js`, `index.html`, `thank-you.html`: deliberate modes, focus/keyboard
  behavior, error recovery, duplicate protection, opaque pending-ID recovery and
  authoritative receipt lookup. Query parameters no longer assert capture.
- `assets/accessibility.css`: field text/readability, focus visibility and narrow
  layouts. Existing design sheets and logo are preserved. Git blob hash of
  `assets/logo.png` matches original `348148040d4180919e14ff126c58002dc57f259d`.
- `api/leads.js`, `server/gateway.cjs`, `shared/core.cjs`: server validation,
  same-origin API, signed backend requests and capture/status contract.
- `apps-script/SmartLearn.gs`: existing-header mapping, serialized deduplication,
  formula escaping, bounded spam counters, durable delivery keys and disabled
  mail/follow-up handling. `api/events.js`: disabled authenticated event adapter.
- `vercel.json`, `scripts/`, `package*.json`: explicit root/static build and Node
  functions; private material is not copied to `public/`.
- `SETUP.md`, `.env.example`, README: current source evidence and exact manual
  account/deployment/verification steps, replacing stale `dist/` instructions.

## Local checks passed

`npm test`: 15 Node/service-harness tests, using synthetic addresses and an
in-memory Sheets/Gmail service. They cover allowed categories and solo/out-of-area
inquiries; invalid fields/lengths/email/acknowledgment; HMAC tampering/expiry;
disabled config; origin/body rejection; malformed upstream/timeouts; same-ID replay
and changed-payload conflict; lock/busy behavior; lost response after durable write;
field mapping/formula escaping; record preservation; rate limits; notification
failure and sender rejection; imported stops; repeat/stale calendar events,
rescheduling/cancellation; one confirmation system; reply and stop suppression;
disabled/configurable business-day prompts and prevention of catch-up messages.

`npm run test:browser`: 11 tests in isolated headless Google Chrome. They cover
empty/whitespace fields, malformed email, absent acknowledgment, step/back focus,
Tab order, Enter behavior, valid captured response, duplicate clicks, allowlisted
UTM/ad fields, no contact details in URL/browser storage, frozen same-ID retry after
status lookup, malformed response/server failure/simulated network timeout, direct
query-spoofed handoff, unverified receipt, no-send preview, incomplete live config
and page overflow at 320/390/1440 pixels. Captured responses are mocks; no external
prospects or integrations are contacted. The timeout check simulates a network
timeout rather than waiting through the actual 25-second browser timer.

`npm run build` passes in preview. Desktop landing and 320px contact screenshots
were visually inspected. Screenshots of the landing page, contact step and handoff
at all three widths are saved locally under ignored `.review/`. Screenshots contain
no real prospect details. No build or runtime secret is embedded in public config.

## Not established by local checks

No live Apps Script deployment/authorization, Google write, inbox delivery, reply
monitor, calendar webhook, appointment, Meta trigger/tracking, campaign permission,
billing or ad delivery was verified. The mock service demonstrates code behavior,
not actual Google durability/quotas or delivery. No live test mailbox was supplied.
The existing tracker was read only; no prospect/test rows, headers or sharing were
changed through the connector. Account approvals remain manual in SETUP.md.

Google's deployment and sender requirements were checked against
[Apps Script web apps](https://developers.google.com/apps-script/guides/web) and
[GmailApp](https://developers.google.com/apps-script/reference/gmail/gmail-app).
Runtime layout follows [Vercel's Node functions documentation](https://vercel.com/docs/functions/runtimes/node-js).

## Deployment result

Changes were pushed to `feat/durable-lead-capture` in the existing repository;
[draft PR #1](https://github.com/meljuuu/smartlearn-funnel/pull/1) is open against
`main`. Vercel's GitHub status reported the deployment ready and its bot supplied
[this preview URL](https://smartlearn-funnel-git-feat-durabl-da543c-poladasma123s-projects.vercel.app).
The production branch was not merged or redeployed by this change.

The preview is protected by Vercel Authentication. Anonymous POSTs to `/api/leads`
and `/api/events` returned protection-layer HTTP 401 responses, while GETs followed
to Vercel's authentication UI. These are not application-level API tests and do not
verify the preview's deployed environment values or private-file 404s. Open the
preview using an authorized Vercel account, or use the existing Vercel CLI session's
authenticated `vercel curl` if available; do not disable deployment protection for
testing. No local authenticated Vercel CLI was available. Computer Use ended because
it could not reliably determine the current Windows browser URL; no further UI
actions or changes to protection/settings were performed. Hosted browser and API
smoke checks therefore remain manual, distinct from the passing local checks.
