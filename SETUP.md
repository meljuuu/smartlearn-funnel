# SmartLearn setup and launch handoff

The latest photographic redesign is documented in [PHOTO-DESIGN.md](PHOTO-DESIGN.md).
It preserves the existing live capture and disabled-delivery settings. Its
rollback deployment is recorded at the top of [CLOUDFLARE.md](CLOUDFLARE.md).

The October 26 landing-page redesign needs no new account, variable, integration
or dependency. Its 35-reference design log and asset details are in
[DESIGN-RESEARCH.md](DESIGN-RESEARCH.md); verification and the prior deployment
rollback are in [CLOUDFLARE.md](CLOUDFLARE.md). Existing integration setup below
continues to apply. No new real submissions or email sends were made for design QA.

Cloudflare hosting is now also available at
https://smartlearn-funnel.polarisjumel.workers.dev with user-authorized inquiry capture enabled.
For that deployment, follow [CLOUDFLARE.md](CLOUDFLARE.md) instead of the Vercel
hosting section below. The tracker, sender, calendar, privacy and client approval
dependencies in this guide still apply. The existing Vercel production site was
not replaced and no DNS/custom-domain changes were made.

Status as checked on October 26, 2026: public Cloudflare inquiry capture is enabled
on the user's explicit instruction. A site-specific privacy notice is published at
https://smartlearn-funnel.polarisjumel.workers.dev/privacy.html, and the supplied
Calendly booking link is connected: https://calendly.com/smartlearn-sales/30min.
The notice reflects current implementation and does not claim legal review.

The real deployed website test passed capture, lost-response recovery, three
concurrent replays and verified handoff; the actual tracker contains one matching
row. Automatic email, follow-ups and provider events remain off. The chosen sender
and Reply-To are both `sales@smartlearn.ca`; [EMAIL-SETUP.md](EMAIL-SETUP.md) has
exact authorization and safe test steps. The connected Gmail sender test reached
the authorized test mailbox, independently of Apps Script. A real booking,
reschedule and cancellation still need external testing.

The existing tracker, bound capture-only Google deployment and paired signing key
are already installed. Do not reinstall them or rotate the key. Google capture is
true; its synthetic capture gate is false. Confirmed booking settings from the user:
30 minutes, Monday-Friday 09:00-17:00 America/Vancouver, owned by the sales account.
Those earlier Google provider settings were not independently inspected. The user
subsequently replaced the website destination with the supplied Calendly URL;
Calendly availability settings have not been independently verified. The separate
Apps Script `BOOKING_URL` property also needs that URL before future email sends.
No ads were launched.

## Verified sources and repository

- Campaign document: https://docs.google.com/document/d/1i0wi07xEDxziE5Iq3dgK-bEvSRLfGVSNSc630EvR9e4/edit
- Existing tracker: https://docs.google.com/spreadsheets/d/1quWPUluIktsa4zmWS6vS_877v_AgSl6nXmENep6AuVU/edit
- Existing Git repository: https://github.com/meljuuu/smartlearn-funnel
- Vercel project: `poladasma123s-projects / smartlearn-funnel`. GitHub's Vercel
  status on `c573ffe` reports its completed deployment. The fetched production
  `index.html` and `assets/app.js` matched this repository before edits, and its
  public config had `previewMode: true` with empty capture/calendar/privacy URLs.
- Sources were read through the `sales@smartlearn.ca` Drive connection. The current
  document confirms the eight categories, local area, free-call scope, original
  logo and booking contact. It does not supply calendar settings, approved sender,
  privacy URL, launch approval or approved follow-up timing.
- Tracker metadata: tab **Leads & Discovery Calls**, sheet ID `606135387`, 1000
  rows, now 30 columns, frozen first row; workbook time zone `America/Vancouver`.
  That workbook setting is not confirmation of the call's time zone. The bounded
  `A1:Z4` read returned the header row and no lead records or cell validations in
  that inspected range. It does not establish that the entire workbook is empty.
- Permission metadata returned only owner `sales@smartlearn.ca`. Zakir's and
  Ernell's access was not verified. No sharing was changed. Drive search did not
  expose a script project, but Chrome opened a blank bound Apps Script project;
  that project is now installed and initialized as described above.
- Native table `SmartLearnLeads` (`1325764616`) now covers A1:AD1000. Original
  `Team size` is `DOUBLE`, `Date received` is `DATE`, `Call date/time` is
  `DATE_TIME`; Status permits New, Contacted, Qualified, Booked, Attended,
  Proposal Sent, Won, Lost and Not a Fit. No new Status choices were added.

## What is implemented

The original two-step form, eight home-service categories plus Other, optional
phone, inquiry acknowledgment, FAQs, logo and people-free process cards remain.
Solo teams and Other service areas are accepted for review. No qualification
rejection rule, unsupported savings claim, tracking script or paid CRM was added.
Team size now collects an exact whole-person count to match the existing numeric
tracker column. The earlier range labels could not fit that type reliably; no
minimum-company-size qualification rule was introduced.

`assets/app.js` has explicit preview/live/unavailable states, step focus, Enter and
back behavior, named-field errors, duplicate-click protection, frozen retry
payloads and status reconciliation. Browser storage contains only random request
IDs and timestamps needed for recovery, never names, emails or other form fields.
A pending ID survives reload; a genuinely new submission after completion gets a
new ID. Handoff receipt is verified with the server; `?mode=received` proves nothing.
Direct visits, including an Instant Form completion destination, show neutral
scheduling steps without requiring the website inquiry again. Neither clicking a
calendar link nor submitting the form is shown as a booked appointment.

`api/leads.js` validates input and exact allowed origins, then posts a timestamped
HMAC envelope to Apps Script. All browser API traffic is same-origin. There is no
cross-origin CORS dependency, wildcard permission or `no-cors` workaround. Preflight
to this same-origin-only API is rejected. Private authentication stays server-side.

The adapter locks capture/status/event processing in **one Apps Script project**.
It writes the website request ID, server lead ID, canonical payload hash and fields
in the same new tracker row, flushes before success and checks that ID on replay.
Reusing an ID with changed content conflicts. A response lost after capture is
reconciled through a status POST; no PII is returned. All writers of website IDs
must use this adapter; direct edits, deletion of IDs, multiple independent scripts
or concurrent external appends bypass its serialization guarantee.

Spam controls include a honeypot, body/field limits and signed backend access.
Under the script lock, bounded server-side counters allow five new captures per
hashed client bucket per ten minutes, sixty status checks per bucket per ten
minutes and 200 new captures per UTC day. Hash collisions conservatively share
limits. Raw IPs are not retained. Existing identical captures can be replayed
without incrementing capture limits. These limits suit the small proposed review
campaign; monitor quotas/abuse before a higher-volume launch.

Captured rows are the durable notification work source. The disabled mail worker
creates a unique delivery record before each send. `sent`, `sending` and `uncertain`
records all prevent automatic duplicate sends. This deliberately chooses manual
reconciliation over risking a duplicate when Gmail's outcome is ambiguous.
Notification failure does not turn a captured inquiry into a failed capture.

The disabled authenticated event adapter handles verified booking, rescheduling,
cancellation, replies and stops. Contact-level stop/reply flags are sticky across
new request IDs and imported tracker rows. Calendar state is matched by lead ID
and email and ordered by provider event time; cancellation of an old booking cannot
erase a different current booking. Follow-up prompts pause after replies and stop
after booking, cancellation or stop. There is no automatic restart after cancellation.

The campaign acknowledgment, booking prompt, call confirmation and after-discovery
templates have code merge fields; missing calendar/outcome details fail instead of
sending literal brackets. After-discovery copy is a rendering adapter only; there
is no automatic send trigger for a call outcome that has not been agreed.

## 1. Install the tracker adapter (account owner action)

Required access: editor/owner of the existing tracker and permission to create an
Apps Script web app executing as the chosen account. The initial workspace is
`sales@smartlearn.ca`. Its Drive connection does not supply runtime credentials to
Vercel or permission to send as `info@smartlearn.ca`.

1. Open the existing tracker while signed in to `sales@smartlearn.ca`. Check the
   account avatar, workbook URL and exact tab name. Preserve its sharing settings.
   If Zakir/Ernell cannot open it, the owner should use **Share** to grant only the
   specifically agreed access; this update has not granted access.
2. Choose **Extensions → Apps Script**. If an existing bound script appears,
   inspect/reconcile it before adding this adapter; do not replace an unknown
   workflow. If it is a blank project, name it `SmartLearn funnel adapter`.
3. Run `npm ci` then `npm run build` locally. Paste the generated
   `.review/SmartLearn-Capture.gs` into an Apps Script `.gs` file, replacing only a blank
   starter file. This combined installation file contains both shared validation
   and the capture/event adapter without Gmail capability. It is already installed
   in the bound project above. Keep a single copy of its functions in the project.
   Install the optional full `.review/SmartLearn.gs` only after sender approval.
4. In **Project Settings**, use the V8 runtime. The repository's
   `apps-script/appsscript.capture.json` shows the Sheets-only manifest settings, including
   `exceptionLogging: "NONE"`; enable **Show appsscript.json manifest file** to
   inspect/update those keys while preserving unrelated settings in an existing
   project. The code does not log request bodies, PII or keys.
5. Under **Project Settings → Script properties → Add script property**, set:

   | Property | Value |
   | --- | --- |
   | `SPREADSHEET_ID` | `1quWPUluIktsa4zmWS6vS_877v_AgSl6nXmENep6AuVU` |
   | `LEADS_SHEET_NAME` | `Leads & Discovery Calls` |
   | `APPS_SCRIPT_SECRET` | Already generated and paired privately in this bound project and Cloudflare; do not rotate it during setup |
   | `CAPTURE_ENABLED` | `false` initially |
   | `TEST_CAPTURE_ENABLED` | `false`; allow only the explicitly labeled synthetic verification when temporarily true |
   | `EVENTS_ENABLED` | `false` initially |
   | `EMAIL_ENABLED` | `false` |
   | `FOLLOWUPS_ENABLED` | `false` |
   | `BOOKING_CONFIRMATION_SYSTEM` | `calendar` initially; do not enable two confirmation systems |

   Generate/store secrets with your password manager or local secure tooling.
   Never paste them into chat, public JS, URL parameters, screenshots or Git.
6. Select `initializeSmartLearn` in the function picker and click **Run**. Review
   the Google authorization screen as the account owner if one appears. The installed
   capture-only bundle needs Sheets capability and contains no Gmail calls; the
   optional mail bundle requires separate sender approval and Gmail authorization.
   Initialization has already completed in Google without a new OAuth prompt.
   A ChatGPT connection alone does not establish those runtime permissions. No
   initialization function sends mail or adds delivery triggers.
7. Verify existing A:R columns and records are unchanged. Initialization appends
   the twelve technical headers below and creates four private workbook tabs:
   `_SmartLearnState`, `_SmartLearnContacts`, `_SmartLearnEvents`,
   `_SmartLearnDelivery`. These tabs inherit the workbook's existing access, with
   no new sharing. Do not edit or delete IDs, payload hashes or delivery keys.
8. Choose **Deploy → New deployment → Select type → Web app**. Execute as the
   approved account. The Cloudflare/Vercel server needs unauthenticated network access to the
   endpoint, so **Who has access: Anyone** is required for this signed design.
   This exposes a signed API, not the tracker: unsigned calls return an auth error.
   This is an owner-approved security configuration decision. If organization policy
   disallows it, leave capture disabled and use an approved authenticated runtime
   instead; do not weaken organization policy or publish the spreadsheet.
9. Copy the deployment's `https://script.google.com/macros/s/.../exec` URL into
   Cloudflare `APPS_SCRIPT_URL` for the current review deployment. Do not use the editor or `/dev` URL. After script edits,
   choose **Deploy → Manage deployments → Edit → Version: New version → Deploy**.
   Saving source alone does not update the existing web-app deployment.

Steps 1–9 above are already prepared/completed for capture under the linked bound
project, including version 1 publication and the Cloudflare URL binding. V8 and
Sheets-only OAuth capability were verified in Google. The optional manifest file
is a configuration reference; its exact manifest contents were not manually
installed/verified. Do not reinstall, rotate the key or create a second adapter.

### Exact field mapping

| Existing tracker header | Written value |
| --- | --- |
| Date received | Server timestamp as a real Sheet Date, respecting the existing DATE type |
| Source | `Website funnel` |
| Meta lead ID | Empty for website inquiries |
| Name / Business name | `full_name` / `business_name` |
| Email / Phone | Validated email / optional phone |
| Business type / City/service area | `business_type` / `service_area` |
| Team size / Main administrative challenge | Validated exact numeric headcount / `main_challenge` |
| Assigned person | Approved `LEAD_OWNER` script property, or blank while pending |
| Status | `New` for a newly captured website inquiry |
| Next follow-up date, Attendance, Outcome, Notes | No existing values rewritten |
| Call date/time | Real Sheet Date from an offset-qualified provider instant; only the matched lead is updated |

Appended headers: `Website request ID`, `Website lead ID`, `Website payload hash`,
`Contact acknowledgment at`, `UTM source`, `UTM medium`, `UTM campaign`, `UTM content`,
`UTM term`, `Source ad ID`, `Source adset ID`, `Source campaign ID`.

All user-derived Sheet values are escaped against formula injection, including
leading whitespace before `=`, `+`, `-` or `@`. Website and Meta IDs are separate.
Attribution is limited to the five named UTM fields and `ad_id`, `adset_id`,
`campaign_id` (200 characters each). No personal data is intentionally put in URLs.
Use non-personal campaign values in ad destination links.

### Signed readiness and synthetic verification

`npm run verify:google` checks a versioned `/exec` deployment's signing/schema and
prints only flags and aggregate delivery states. Key input is hidden. No append
is attempted unless `--capture` is explicitly supplied. See CLOUDFLARE.md for the
complete three-concurrent-attempt synthetic check while public capture remains off.
The Google-only `TEST_CAPTURE_ENABLED` gate is independent of `CAPTURE_ENABLED`.
Test rows use a fixed `.invalid` email, explicit test Source and Notes, are excluded
from all recipient delivery, and remain as evidence. The test gate is reset after
the check. If response delivery is uncertain, reconcile the printed opaque request
ID with `npm run verify:google -- --status <request-uuid>` before another append.

`inspectSmartLearnSetup` can also be run by the authorized script owner. Its
execution log contains only readiness flags and delivery counts. Delivery rows in
`blocked_configuration` have not been sent and can recover after valid template
details exist; `sending`/`uncertain` attempts remain held for manual reconciliation.
Calendar confirmations use booking details rather than transport-event IDs as
their delivery key, so equivalent provider notifications cannot send twice.

The real signed test completed on October 26: request ID
`01d102e8-6815-450c-a083-c9e12f076018`, lead ID
`a99536b6-4c0e-4b43-bb15-ef8f409d7183`. An independent full website-ID-column read
found exactly one matching row in the actual tracker. Dates/headcount, Source and
separate Meta ID were correct. Cloudflare status reconciliation returned that same
lead. Unsigned requests were rejected. A final signed health call confirmed
`TEST_CAPTURE_ENABLED=false` as well as all public/email/events/follow-up flags
false and zero delivery records. Keep the synthetic row as evidence.

## 2. Configure and test Vercel (project maintainer action)

Required access: the existing `poladasma123s-projects / smartlearn-funnel` project
and repository branch. Do not create a replacement project or import the private
preview's `.openai/hosting.json`.

1. Open **Vercel → smartlearn-funnel → Settings → Git**. Verify connected repository
   `meljuuu/smartlearn-funnel` and Production Branch `main`.
2. Under **Settings → Build and Deployment**, verify **Root Directory** is the
   repository root (blank or `.`), framework **Other**, build `npm run build`, output
   `public`, install `npm ci` and Node `24.x`. The new `vercel.json` and package
   define these choices. The original files remain at the repo root; `public/`
   is generated and ignored. Only HTML and public assets are copied into it;
   setup docs, adapters, tests and environment files are excluded.
3. Under **Settings → Environment Variables**, add these values to **Preview**
   for the review branch first. Set sensitive values using Vercel's secret UI.

   | Variable | Value to obtain/set |
   | --- | --- |
   | `FUNNEL_MODE` | `preview` during review; `live` only for a controlled capture test after configuration |
   | `CAPTURE_ENABLED` | `false` initially; `true` for verified capture testing |
   | `ALLOWED_ORIGINS` | Exact HTTPS origin of the deployment being tested; comma-separated if more than one approved origin, no trailing slash or wildcard |
   | `APPS_SCRIPT_URL` | Approved web-app `/exec` URL from step 1 |
   | `APPS_SCRIPT_SECRET` | The identical private random secret from Script properties |
   | `PRIVACY_POLICY_URL` | SmartLearn's approved public HTTPS privacy-policy URL; do not invent one |
   | `BOOKING_URL` | Confirmed public HTTPS calendar scheduling URL, or empty |
   | `EVENTS_ENABLED` | `false` until an authenticated provider-verifying workflow is tested |
   | `EVENT_INGEST_SECRET` | Separate random secret, only when that workflow is configured |

4. Set `CAPTURE_ENABLED=true` in both Apps Script properties and Vercel only for a
   controlled test with approved privacy settings. `FUNNEL_MODE=live` fails the
   build if required settings are missing. If runtime credentials later fail, the
   form shows an unconfirmed error; it never silently simulates success.
5. Choose **Deployments → the review deployment → Redeploy** after changing env
   settings. `PRIVACY_POLICY_URL`, `BOOKING_URL` and mode are baked into the public
   build; secrets are not. Ensure the exact new preview origin is allowlisted.
6. Submit only synthetic/test contact details with delivery off. Verify exactly
   one new row in the actual tracker and matching website request/lead IDs before
   trusting the UI. Replaying the same ID must return the same lead ID. Do not
   delete the request-ID column to simulate a retry. Controlled tests against the
   live adapter have not yet been run.
   The review deployment is currently protected by Vercel Authentication. Open
   its PR Preview link while signed into an authorized Vercel account. An HTTP
   401 from Vercel's protection layer is not the app's capture-disabled response.
   Keep deployment protection enabled. Also verify `/SETUP.md`, `/apps-script/SmartLearn.gs`
   and `/.env` are application 404s in the authenticated deployment, and `/api/leads`
   returns JSON `capture_disabled` while settings remain off.
7. Keep Production env values unchanged until the preview, external checks and
   client approvals pass. Then merge the review branch to `main`, configure the
   approved Production values (production origin is
   `https://smartlearn-funnel.vercel.app`) and redeploy. This deploys the funnel;
   it does not authorize launching ads or spending the proposed budget.

The client uses same-origin `/api/leads`; a separately hosted browser webhook is
not needed. Both API endpoints return `Cache-Control: no-store`. Capture/status
responses contain opaque IDs only. Do not turn on request-body logging in Vercel,
Apps Script, proxies or an automation platform.

## 3. Authorized mail, replies and stop requests

Current sender/Reply-To: `sales@smartlearn.ca`, selected by the user. See
[EMAIL-SETUP.md](EMAIL-SETUP.md) for the current manual setup; its additional
mail-only file avoids replacing the working capture installation. The account
owner must complete Google authorization. The manual `sendSmartLearnTestMessages`
function uses only TEST_EMAIL, requires TEST_EMAIL_ENABLED, resets its gate and
deduplicates test deliveries without scanning prospects or enabling production mail.


The user selected sales@smartlearn.ca for sender and Reply-To and explicitly
authorized a test inbox. Connector delivery passed; Apps Script runtime mail
authorization remains pending. Production response owner/backup is still needed.
info@smartlearn.ca remains the booking contact.

1. In the intended sender's **Gmail → Settings → See all settings → Accounts →
   Send mail as**, verify the approved address is the executing mailbox or an
   already authorized alias. An admin/owner must approve any new delegation. Do
   not add `info@smartlearn.ca` merely because it is the booking contact.
2. In Apps Script properties set `SENDER_EMAIL`, `REPLY_TO_EMAIL`,
   `OWNER_NOTIFICATION_EMAILS` (approved owner and backup, comma-separated),
   `LEAD_OWNER` (agreed tracker assignment) and optional confirmed `BOOKING_URL`.
   Leave `EMAIL_ENABLED=false` until approved test details exist.
3. Run `verifySmartLearnSender`. It rejects an unrecognized sender or incomplete
   recipient/reply settings without sending. This checks account capability,
   not client authorization or actual inbox delivery.
4. Use the gated `sendSmartLearnTestMessages` procedure in EMAIL-SETUP.md.
   It sends the two synthetic template tests only to TEST_EMAIL while production
   email remains false, does not scan prospect rows, resets the test gate and
   prevents duplicate/uncertain retries. Verify the actual inbox and delivery rows.
5. Arrange reply/stop detection before automated delivery: an authorized existing
   workflow must watch the actual Reply-To mailbox and forward verified reply and
   stop events to the authenticated adapter below. Until that exists, staff must
   review the inbox before each manual delivery run. In the existing Sheet, reload
   and use **SmartLearn inquiry controls → Record reply / pause prompts** or
   **Record stop request**, then enter the contact email from the verified message.
   Those actions update private `_SmartLearnContacts` state under the same lock;
   they send no message and preserve the existing Status dropdown. Do not force
   `Replied` or `Stopped` into that dropdown: those values are not currently allowed.
   Existing imported stop/reply labels are also recognized conservatively. A manual
   Booked/Qualified/etc. status holds prompts without inventing a calendar event.
   The controls are installed. Running `onOpen` in Google completed and exposed
   the custom menu. If it is absent on a later reload, run `onOpen` from the bound
   editor and check again. The project overview confirms the existing tracker as
   its container. Expand the browser window if the long menu is collapsed.
   The owner can also run `recordSmartLearnReply` / `recordSmartLearnStop` directly
   from that bound editor and complete the Sheet prompt. Verify the matching
   `_SmartLearnContacts` row before any delivery run. Both live controls were
   tested with `smartlearn-suppression-test@example.invalid`: one contact row now
   contains `{"replied":true,"stopped":true}`, with two audit rows and zero delivery
   rows, independently read back through Google. Automated inbound detection is
   still unconfigured; staff must record verified replies/stops through this menu
   before a manual delivery run until an approved inbound workflow is connected.
6. Once delivery and suppression checks pass and delivery is approved, an account
   owner can use **Apps Script → Triggers → Add Trigger →
   processSmartLearnNotifications → Time-driven** for the agreed processing
   interval. No trigger is installed by the code. Monitor `_SmartLearnDelivery`
   and quota failures. A worker processes at most ten deliveries per invocation.

Follow-up defaults are off. Only after Zakir approves timing, set
`FOLLOWUPS_ENABLED=true`, `FOLLOWUP_BUSINESS_DAYS` to the approved comma-separated
days (the current recommendation is `1,3`, not authorization), and
`FOLLOWUP_TIME_ZONE` to the confirmed IANA zone. This implementation counts Monday
through Friday in that zone; it does not contain a holiday calendar or approved
send-hour schedule. Review those before enabling a trigger. It sends at most one
overdue prompt per run, skips obsolete earlier prompts and sends no booking prompt
on the day another prospect message was sent. An uncertain acknowledgment blocks
booking prompts until manually resolved.

### Reconcile ambiguous email outcomes

Never simply clear all delivery keys or rerun imports to resend mail. For a
`sending` or `uncertain` row, inspect the authorized sender's Sent folder and
provider/inbox evidence for that exact lead/message. If sent, set State to `sent`.
If definitively not sent, change that delivery key to a unique archived suffix
such as `:reviewed-not-sent:YYYYMMDD` under owner supervision; the next worker will
make a new attempt for the original key. If uncertain, leave it held and resolve
manually. Sticky contact stop/reply flags must never be removed by a retry/import.
To resume after a reply, the responsible owner must explicitly review and update
the private contact state plus tracker status; a stop request must remain stopped.

## 4. Calendar and authenticated event adapter

1. The authorized calendar owner/delegate for `info@smartlearn.ca` must confirm
   host, duration, availability, time zone and public scheduling URL. For Google
   Calendar, use **Create → Appointment schedule**, configure approved details,
   then **Booking pages → Share → Copy link** (if the account supports appointment
   schedules). Otherwise obtain the link from the team's actual approved provider.
   Connect that public HTTPS URL as Cloudflare `BOOKING_URL` (or Vercel if separately
   selected as the future destination) and Apps Script
   `BOOKING_URL`; email contact alone does not create a calendar.
2. Choose one confirmation system. Default `BOOKING_CONFIRMATION_SYSTEM=calendar`
   leaves confirmations/reschedule/cancel delivery to the real calendar. Set
   `adapter` only after disabling duplicate calendar email and testing the complete
   verified event fields. A link click never creates a booked status.
3. Have the authorized calendar/reply automation verify provider webhook signatures
   and look up the real event/mail. Map it to the tracker Website lead ID and email.
   Pass that opaque lead ID through the provider's supported private/custom
   metadata or reconcile in the owner workflow; never expose prospect details in
   a URL or guess bookings by email alone. No provider has been chosen or connected.
4. In the chosen deployment (currently Cloudflare) set `EVENTS_ENABLED=true` and
   a separate `EVENT_INGEST_SECRET` only after verified event testing is authorized. In
   Apps Script set `EVENTS_ENABLED=true`. The automation calls
   `POST https://<approved-deployment>/api/events` with header
   `Authorization: Bearer <EVENT_INGEST_SECRET>` and JSON such as:

   ```json
   {
     "type": "booked",
     "eventId": "provider:unique-delivery-id",
     "leadId": "tracker-website-lead-uuid",
     "email": "authorized-test-mailbox@example.invalid",
     "occurredAt": "2026-10-26T12:00:00Z",
     "bookingId": "provider-event-id",
     "dateTime": "2026-10-30T10:00:00-07:00",
     "timeZone": "actual IANA time zone",
     "host": "actual host",
     "meetingUrl": "https://provider.example/actual-meeting",
     "rescheduleUrl": "https://provider.example/actual-reschedule"
   }
   ```

   These are schema examples, not real appointments. Allowed types are `booked`,
   `rescheduled`, `cancelled`, `replied`, `stopped`. Calendar types require lead ID
   and booking ID; booking/reschedule also require an ISO 8601 scheduled instant
   with `Z` or a numeric UTC offset, plus the actual IANA time-zone name. The date
   above is an illustrative format, not an appointment. Adapter
   confirmations require all host/join/reschedule details. Reply/stop events need
   email, event ID and occurrence time, so suppression can be recorded even before
   a matching website inquiry arrives. Preserve stable provider event IDs on
   retries and chronological occurrence times; do not use delivery time for order.
   This endpoint is for authenticated trusted automation, not direct public Meta
   or calendar webhooks. Stop events remain available when new capture is disabled.
5. Verify booking, reschedule, cancellation, stale-event replay, reply and stop
   against the actual provider and matching tracker row in an isolated test.
   Those external checks remain blocked until calendar/sender/workflow access exists.

## 5. Privacy, Meta route and approval dependencies

On the user's explicit request, a site-specific privacy notice was written and
published at /privacy.html, configured in Cloudflare and linked next to the form
acknowledgment. It describes the actual providers, fields, purposes, technical
identifiers, access and current lack of automated deletion. No legal review,
company address, privacy-officer identity or fixed retention schedule is claimed.

Website route: ad → landing form → durable capture → booking handoff. An approved
tracking implementation may subscribe to `smartlearn:captured` with
`detail.eventId=leadId` after capture; this release installs no advertising script,
Pixel ID or Conversions API sender. If browser/server Lead events are later both
approved, use that same lead ID as their shared event ID and configure consent.
Never count preview, page view, button click, handoff visit or calendar click as a lead.

Instant Form route: native Meta form → authorized Meta lead trigger → existing
tracker → booking destination. The Meta workflow must preserve its actual Meta
lead ID, atomically deduplicate retries, map these agreed headers, carry attribution
and stop flags, and use one acknowledgment owner. It is not connected in this
release because route and Meta permissions are unverified. Use the confirmed
calendar URL or `/thank-you.html` as completion destination; it does not require a
second inquiry form and makes no unverified receipt/booking claim. Do not send a
Meta lead through `/api/leads` pretending it is a website submission.

Decisions still required from Zakir:

- Qualification: minimum company size and business exclusions. Existing form
  accepts all categories/sizes/service areas for review until a rule is approved.
- Response owner and backup, assignment and response-time expectation.
- Follow-up timing and production delivery ownership; sender/Reply-To are selected.
- Budget and launch approval: CAD $280 over 14 days is a recommendation, not spend
  authorization. Confirm final campaign preview, conversion route, tracking and
  launch date before directing paid traffic. Reported Facebook/Business Portfolio/
  Canadian ad-account setup was not independently verified for permissions,
  billing or delivery. No ad platform changes were made.

The unsupported “up to 50%” claim stays out of public copy until evidence and exact
wording are approved. The free call does not include a full audit, site assessment
or implementation project. A captured inquiry remains distinct from a booked call.

## External acceptance checklist

Use an isolated tracker/script and authorized test mailbox first. Verify the real
row and provider evidence, not only the green page. Then repeat the minimum agreed
smoke test against the intended deployment with owner supervision:

1. One new inquiry, exactly one row, correct headers/attribution/assignment and
   separate website IDs. Same ID replay creates no extra row or message.
2. Network timeout after capture → status recovers the original ID. Invalid email,
   absent acknowledgment, invalid origin, malformed upstream and failure do not
   redirect to success. Changing data under an existing ID conflicts.
3. One received acknowledgment and owner notification with correct From/Reply-To;
   failure/uncertain outcomes held for reconciliation; rerun creates no duplicates.
4. Verified booking/reschedule/cancellation updates only the matched row's calendar
   cell; no prompt after booking, reply, cancellation or stop. Stopped imports and
   repeated events cannot restart mail. Only one system sends confirmation.
5. Direct handoff URLs stay neutral; final policy and calendar links work; mobile
   form and keyboard journey remain usable. Preview submits nothing.
6. Approved route, tracking/consent, budget and campaign sign-off recorded before
   ads. A Vercel deploy or connected Google account is not proof of live integration.
