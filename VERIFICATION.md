# SmartLearn verification — October 26, 2026

## Repository and deployment grounding

PR #1 was checked through GitHub and is open, draft and unmerged, with head
`feat/durable-lead-capture`. Work continued on that branch. The initial working
tree was clean and no applicable AGENTS.md was found in the workspace/ancestors.
The pre-update Cloudflare version was
`cee82b46-01cd-4f25-b77f-95b29a797284` (the earlier review code plus the signing
secret). Vercel, DNS, campaign destinations and ads were not changed.

The initial deployed Cloudflare config was fetched: preview true, no calendar or
privacy URL; capture/events POSTs returned application JSON 503 with
`capture_disabled` / `events_disabled`. Wrangler initially reported no secrets.

## Concrete changes

- The actual tracker is a native typed table. Team-size range labels were
  incompatible with its DOUBLE column; the form now collects exact headcount,
  including solo teams, and the adapter writes a number. Received/calendar dates
  are real Sheet Dates, respecting DATE / DATE_TIME types and provider UTC offsets.
- A partial calendar write previously persisted state but could fail before the
  tracker cell, then skip repair on replay. Replays now project the current state
  into the typed cell before the event is marked applied. Stale events cannot
  restore old booking details.
- Confirmation delivery keys now identify booking details rather than transport
  event IDs, preventing equivalent provider notifications from sending twice.
  Incomplete templates create observable `blocked_configuration` records and do
  not stop unrelated notifications. Uncertain send attempts still require manual
  reconciliation, preserving at-most-once automatic delivery behavior.
- Status dropdown choices do not include Replied/Stopped. Dedicated private
  `recordSmartLearnReply` / `recordSmartLearnStop` controls record sticky contact
  suppression without changing the dropdown. Manual handled/booked statuses hold
  recipient messages without asserting a verified appointment.
- Server-rejected fields can be corrected under the same request ID. Pending
  requests are reconciled after reload; browser back/forward-cache restoration
  clears a completed request's lock for a genuinely new inquiry. Capture-event
  metadata prevents duplicate browser events for the same completed request.
- Preview mode also blocks direct public capture API calls. Malformed status IDs
  and event shapes fail validation. Duplicate technical keys fail closed rather
  than selecting an arbitrary record. Append operations can grow the Sheet grid.
- Capture-only Google installation excludes Gmail capability. Signed readiness
  and explicitly gated synthetic-test actions enable testing without public form
  activation or prospect email. The interactive verifier uses hidden key input,
  concurrent same-ID attempts, status reconciliation and test-gate cleanup.
- The deployment wrapper requires committed, clean code and sets BUILD_COMMIT;
  Cloudflare exposes that opaque revision in X-SmartLearn-Build on public config.

The original logo/design, eight categories, local offer, optional phone and inquiry
acknowledgment are retained. The unsubstantiated percentage claim is absent from
public copy. No Pixel, new Meta capture route, paid CRM or recipient delivery was
introduced.

## Real Google setup completed

The campaign document and related follow-up/campaign plans were reread through
`sales@smartlearn.ca`. They contain no confirmed calendar URL, sender, privacy URL
or launch approval. The current combined campaign document includes all eight
categories; its older campaign-plan sibling still omits roofing/renovation.
Documents were not edited. The main campaign document still names the Vercel
destination; add a clearly labeled Cloudflare review link separately from any
future approved paid destination.

The existing tracker was read through metadata, bounded CellData and a native-table
metadata probe. Its original 18 column definitions and Status choices were kept.
Twelve technical headers were appended; the same native table was extended to
A1:AD1000, preserving original types. Four private adapter tabs were added in the
same workbook. Header/data/format readback passed; original A:R values were not
rewritten, and sharing was not widened. No lead row was appended by connector work.

Rendering revealed white header text on a white native-table header after the
extension. The main header text was explicitly set to charcoal while preserving
its other formatting. Effective-format readback and a Chrome screenshot confirmed
the correction. Each of the four technical tabs was also visually checked: clear
headers, frozen first row and empty data rows. A final permission read still
returned only the owner entry. The automatic custom menu was not visible on the
observed reload; its runtime invocation remains an external UI check.

Chrome was verified as `sales@smartlearn.ca`. The blank bound project was named
SmartLearn funnel adapter, capture-only source was installed and initialization
completed in Google. The Google editor parsed the manual suppression/diagnostic
functions. No new OAuth prompt was approved by the agent.

A random 32-byte signing value was generated and uploaded through Wrangler's
server-secret interface. An encrypted Windows-user DPAPI recovery copy is retained
only under ignored `.review/`. A one-time local memory channel paired the same
value into Apps Script properties; readback compared it without printing it.
No plaintext key file was written and the checked Wrangler logs contained zero
occurrences of the real value. Source, public config and commits contain no key.

Web-app publication is a separate approval boundary; until its `/exec` deployment
and signed synthetic-row test are verified, this is preparation/runtime setup,
not a functioning live Google HTTP integration.

## Local/mocked checks

- `npm test`: 28 passing Node/service-harness tests. Includes signed auth, server
  validation, invalid origins/body, malformed upstream/timeout, durable mock capture,
  lock/busy behavior, same-ID replay/conflict, formula protection, native data types,
  partial event recovery, sender rejection, notification failures, manual/imported
  suppression, cancellation/reschedule/stale events, semantic confirmation keys,
  disabled prompts, synthetic-test safety and new handler/adapter instances using
  the same durable mock Sheet. These are not Google concurrency/quotas evidence.
- `npm run test:browser`: 15 passing isolated Chrome tests, covering both steps,
  required/whitespace/email/acknowledgment validation, exact headcount, keyboard and
  back navigation, repeated clicks, corrected 422 responses, failed/time-out
  capture, frozen retry payloads, pending reloads, neutral direct handoff visits,
  preview no-send behavior, PII-free URLs/storage and 320/390/1440px overflow.
- `npm run build` and Wrangler dry-run bundling pass. Node syntax checks pass.
  `git diff --check` passes. Dependency audit reports zero vulnerabilities.

## External checks still requiring evidence

The tested code commit `bff8ec4e89f09e4fdb3771b91638f35740019d1b` was deployed to
the existing Cloudflare Worker as version
`a3d38935-8de4-42f0-bbf1-7288f17d321e`. `X-SmartLearn-Build` matched the commit;
all seven deployed HTML/assets matched local build SHA-256 hashes. The deployed
isolated Chrome smoke passed both steps, mobile fit, no POST from preview,
neutral spoofed direct handoff, disabled APIs, private-path 404s and headers.
This is real Cloudflare execution evidence, not a Google capture or delivery test.

Until explicitly recorded otherwise, a real Apps Script HTTP capture/replay row,
inbox delivery, inbound reply monitor, calendar/provider webhook, booked appointment,
Meta route/tracking/consent and paid campaign permissions/billing remain unverified.
No authorized test mailbox or confirmed calendar was supplied. A connected account,
saved secret, successful initialization or mocked test does not prove those links.

Review deployment changes are documented in CLOUDFLARE.md with the immediate
pre-fix version for rollback. The signed real-adapter test is a separate command;
its opaque request ID must be checked against exactly one actual tracker row before
claiming durable capture works live.

Runtime behavior was checked against official
[Apps Script web-app guidance](https://developers.google.com/apps-script/guides/web),
[Google table types](https://developers.google.com/workspace/sheets/api/guides/tables),
[LockService](https://developers.google.com/apps-script/reference/lock) and
[Cloudflare version rollback guidance](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
