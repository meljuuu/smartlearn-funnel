# October 27 — exact remaining setup and acceptance

## Verified current state and access limits

The sales Workspace connection read the canonical campaign document and the
existing tracker on October 27. The document still contains older home-service
wording; replacements are ready in `CAMPAIGN-OCT27.md`, without editing that Doc.
The 30 headers on **Leads & Discovery Calls** match the adapter. Header/format reads
did not change records, formulas, table choices, sharing or permissions.

A signed, non-writing health call to the **installed Google Web app** returned:
schema ready; capture true; synthetic capture false; email/followups/events false;
two prior test deliveries marked sent; no October 27 contract marker. The new
installed-key verifier therefore correctly refuses to label it ready for the
revised form. No key was printed, rotated or added to source. Private signing
continues to work. The old public deployment used live capture, contrary to the
stale handoff quoted in the request.

The October 27 Cloudflare review deployment intentionally changes to **preview**
(`FUNNEL_MODE=preview`, `CAPTURE_ENABLED=false`). Its form sends/saves nothing,
its handoff is explicitly preview, and Calendly is not embedded in preview.
Google's existing private capture flag is not changed. This prevents the revised
minimal form from hitting the older Google validator before publication/testing.

Connected tools expose Drive/Docs/Sheets and Gmail reads/mail actions, but no Apps
Script project-deployment action, Gmail settings/filter management or authenticated
Calendly management. The bound script's ID also is not a Drive-editable file
(metadata returned not found). No account scopes or sharing were expanded, and
the user's desktop was not controlled.

The public Calendly page was opened in isolated Chrome: reachable, title
**Free AI & Digitization Discovery Call**, 30-minute display and **Polaris Jumel**
display name. This verifies public display only, not the intended human host,
connected calendar, availability or plan. The sales inbox has a Calendly welcome
email addressed to sales@smartlearn.ca mentioning a 14-day trial; that is not proof
of ongoing paid feature eligibility or actual booking-notification routing.

## 1. Publish the prepared Google adapter in the existing project

Required access: editor/deployment authority for the existing bound script under
sales@smartlearn.ca. Open the existing lead tracker → **Extensions → Apps Script**
(or the existing SmartLearn funnel adapter project). Do not create another Sheet,
script project or Web app endpoint.

1. Run `npm run build` in this repository. It creates the ready-to-paste files:
   - `.review/SmartLearn-Capture.gs` — updated Core + capture implementation.
   - `.review/SmartLearn-Mail.gs` — updated existing mail component.
2. In **Editor → Code.gs**, replace its complete contents with
   `.review/SmartLearn-Capture.gs`. In **Mail.gs**, replace its complete contents
   with `.review/SmartLearn-Mail.gs`. Save. Do not paste the combined bundle as
   well: that would duplicate functions. Do not run initialization or change headers.
3. **Deploy → Manage deployments → select the existing Web app → Edit (pencil)
   → Version: New version → Deploy.** Keep its existing execute-as account and
   access setting. The paired `/exec` URL must remain the same. Saving code alone
   does not update a versioned Web app. [Google Web app documentation](https://developers.google.com/apps-script/guides/web)
4. Leave the current `APPS_SCRIPT_SECRET` and existing Cloudflare secrets untouched.
   Leave `EMAIL_ENABLED`, `FOLLOWUPS_ENABLED`, `EVENTS_ENABLED` and
   `TEST_EMAIL_ENABLED` false. Google `CAPTURE_ENABLED` may remain its current true.
5. From this Windows project terminal run:

   ```powershell
   .\scripts\verify-installed-google.ps1
   ```

   This reuses the already encrypted Windows-user recovery key through private
   stdin. It never displays it. Success requires `leadContract` equal to
   `generic-2026-10-27`, schema ready, email/followups false. On a different machine,
   use `npm run verify:google` in your own terminal with private input; never paste
   secrets into chat. If the old contract is reported, repeat the **existing
   deployment's version update**, not another code-only Save.

The new code accepts blank routing/headcount, a task of up to 1000 characters and
an allowlisted concept. Optional headcount writes a blank, never a fabricated zero.
Concept is appended to the new row's existing Notes; actual UTM content is retained.
Legacy canonical hashes remain unchanged so replayed historical requests do not
become new rows. Original category values and existing records are not migrated.
The revised server uses signed action `capture_v2`; the legacy Web app rejects
that action before any append. An accidental early live toggle therefore fails
visibly with `adapter_update_required`, rather than saving an incomplete new inquiry.

## 2. Verify one minimal synthetic row before enabling the revised website

1. Apps Script → **Project settings → Script properties**: set only
   `TEST_CAPTURE_ENABLED=true`. Leave email/followups/events disabled.
2. Run:

   ```powershell
   .\scripts\verify-installed-google.ps1 -Capture
   ```

   The helper checks the deployed contract, submits three concurrent attempts
   sharing one request ID, reconciles status, replays the same ID and resets the
   synthetic gate false. Test contact is `smartlearn-synthetic@example.invalid`,
   named **SYNTHETIC TEST - DO NOT CONTACT**, with Source **Integration test
   (synthetic)**. It cannot queue prospect mail in the prepared adapter.
3. In the actual tracker, search the returned **Website request ID**. Verify
   exactly one row, the free-text task, blank Team size and blank optional routing,
   `Notes` containing `Website concept: evening-paperwork`, and separate blank
   Meta lead ID. Retain the row as synthetic evidence. Verify the test gate is false.
4. If any result is uncertain, do **not** start another capture test. Reconcile the
   printed opaque ID first:

   ```powershell
   .\scripts\verify-installed-google.ps1 -Status YOUR-OPAQUE-REQUEST-UUID
   ```

   Check its actual row before another append. If a terminal is interrupted,
   inspect the actual synthetic row/request IDs before rerunning. Never delete
   IDs to make a replay appear new.

This live acceptance is currently blocked by step 1's manual Google publication.
The 36 local tests use mocked Google/Gmail; they are not a replacement for this row check.

## 3. Prepare sales-first messages, without turning delivery on

In the **same Apps Script → Project settings → Script properties**, prepare:

| Property | Value / source |
|---|---|
| `SENDER_EMAIL` | Previously chosen/tested `sales@smartlearn.ca`; reconfirm campaign sender authorization |
| `REPLY_TO_EMAIL` | Requested sales workflow: `sales@smartlearn.ca`; human response owner still needed |
| `OWNER_NOTIFICATION_EMAILS` | `sales@smartlearn.ca` |
| `OWNER_NOTIFICATION_CC` | `info@smartlearn.ca` — new optional CC, owner notifications only |
| `BOOKING_URL` | `https://calendly.com/smartlearn-sales/30min` |
| `BOOKING_CONFIRMATION_SYSTEM` | `calendar` — avoid a second confirmation system |
| `LEAD_OWNER` | The confirmed human owner; leave blank until assigned |
| `EMAIL_ENABLED` | `false` |
| `FOLLOWUPS_ENABLED` | `false` |
| `EVENTS_ENABLED` | `false` |
| `TEST_CAPTURE_ENABLED` | `false` after the synthetic capture test |

No additional secret is needed. The test function deliberately removes owner CC
and routes **both** test messages solely to its authorized test recipient.

After the new Mail file is installed, an authorized account user can set
`TEST_EMAIL=polarisjumel@gmail.com` (the already authorized test inbox), set
`TEST_EMAIL_ENABLED=true`, save and run **Editor → function selector →
sendSmartLearnTestMessages → Run**. Complete Google's normal authorization screen
under the intended sales account if required. Keep production email/followups off.
The one-time test gate resets itself. The October 27 test delivery keys permit one
new pair for the revised templates and deduplicate repeated runs. Verify actual
From/Reply-To, correct names/links and no literal merge brackets. Do not clear old
delivery records to force sends. `sending`/`uncertain` states require inspection
of Sent mail before any manual retry.

`verifySmartLearnSender` verifies that From is the effective account or an
authorized Gmail alias. Reply-To alone does not detect replies. Until an inbound
provider integration is separately configured, the response owner must use the
Sheet's **SmartLearn inquiry controls → Record reply / pause prompts** or
**Record stop request**. Refresh the Sheet to load the installed menu. Those
actions persist suppression across retries/imports without adding Status choices.
Do not enable prospect delivery merely because the two-message test passes.

## 4. Calendly notification routing — inspect first, then use one method

Sign into **Calendly as sales@smartlearn.ca**. Inspect **Account settings** (login
email and billing/plan), **Calendar settings / Calendar connections** (account,
conflict checks and destination calendar), and **Scheduling → the 30min event**
(host/display name, duration, location, time zone, hours, buffers, booking notice,
notifications/cancellation policy). Do not replace a connected calendar or host
merely to change recipients. Keep the existing public URL unless approved otherwise.

Current official docs support emailing non-participants through eligible
**Automations / Workflows → Email someone else**. Eligibility depends on the
actual plan, account creation and add-ons; do not buy an upgrade or rely on the
welcome trial. If already eligible, limit one such automation to this event type,
use info@smartlearn.ca as the additional recipient, and inspect supported booking,
reschedule and cancellation triggers. Do not duplicate an existing automation.
Do not add info as an attendee. [Calendly guidance](https://calendly.com/help/how-to-send-automation-emails-to-non-meeting-participants)

If that method is unavailable, use the simplest no-upgrade route:

1. In **Gmail as sales → Settings → See all settings → Forwarding and POP/IMAP →
   Add a forwarding address**, enter `info@smartlearn.ca`.
2. An authorized info-mailbox user must approve Google's verification link/code.
   Return to sales settings. Keep **global forwarding disabled**.
3. After an authorized synthetic booking establishes the actual notification
   sender and event title, paste this initial filter search into sales Gmail:

   ```text
   {from:notifications@calendly.com from:no-reply@calendly.com} "Free AI & Digitization Discovery Call"
   ```

   Inspect matches before creating a rule. Use the actual verified notification
   sender if the account's calendar-invitation method uses a different sender;
   keep the event-title condition. Never filter every sales email or all calendar mail.
4. **Search options → Create filter → Forward it to info@smartlearn.ca**. Keep
   existing-message forwarding unchecked. Retain the sales inbox copy. Do not add
   reciprocal forwarding from info back to sales. Check for an existing overlapping info-to-sales rule before enabling this route.
5. Verify one booking, one reschedule and one cancellation for the authorized
   test mailbox; sales and info should each receive one relevant notification
   per event, without unrelated mail. Use either forwarding or the Calendly
   additional-recipient automation, not both. [Gmail instructions](https://support.google.com/mail/answer/10957?hl=en)

No live rule was installed: the connected mail tools cannot manage forwarding
settings, info verification is not available, and authenticated Calendly plan/
calendar settings cannot be inspected. No notification to another person was sent.

The generic authenticated `/api/events` adapter is prepared and mock-tested; it
is **not** a connected native Calendly webhook. Keep `EVENTS_ENABLED=false`.
Do not point a raw Calendly webhook at it or treat iframe messages as verified
events. Until a provider-authenticated workflow is implemented and verified, a
human matches a real booking to the inquiry and updates `Status`, `Call date/time`,
`Attendance`, `Outcome` and `Notes`. Record cancellations/reschedules explicitly;
never infer a booking from a calendar click. The host/owner must confirm which
booking records are authoritative before those external tests.

## 5. Re-enable website capture only after the new contract/row check

After steps 1–2 pass and the response/privacy handling is confirmed, edit only
`wrangler.jsonc` variables `FUNNEL_MODE` to `live` and `CAPTURE_ENABLED` to `true`.
Keep `EVENTS_ENABLED=false`; no email flag is enabled by this file.

```powershell
git add wrangler.jsonc
git commit -m "Enable verified October 27 inquiry capture"
npm run deploy:cloudflare
```

Cloudflare needs the existing authenticated Workers deployment account. All
existing `APPS_SCRIPT_URL` / `APPS_SCRIPT_SECRET` server-side secrets stay unchanged.
`PRIVACY_POLICY_URL` and `BOOKING_URL` already point to the published notice and
supplied Calendly page. Read `/assets/config.js`: preview false, endpoint
`/api/leads`, correct links; `X-SmartLearn-Build` must match the deployed commit.
Test a clearly labeled synthetic website inquiry only with delivery off, verify
its tracker row and truthful handoff, then record a stop for that test contact
and label its Notes synthetic so it is excluded from campaign reporting.

This enables inquiry capture only. It does not authorize prospect messages,
automated follow-ups, ad spend, broader targeting or launch. Before paid traffic,
Zakir must confirm qualification, human owner/backup/response window, host/calendar
settings, sender/Reply-To, privacy ownership/retention, conversion route, tracking/
consent, follow-up timing, budget and launch approval. The current policy is an
implemented website notice; no legal-review approval is claimed.

## Rollback

Immediately before this revision: commit `b0cdef14ac242b4082472e7f62b09b67a5a721e0`,
Worker version `31abc45d-a2cd-4d75-9016-26e1076bc919`.

```powershell
npx wrangler rollback 31abc45d-a2cd-4d75-9016-26e1076bc919
```

Or Workers & Pages → smartlearn-funnel → Deployments → that version → Rollback.
That restores the former people-photo/full-required-form deployment and its live
capture setting, so review that consequence before rollback. The new Google
validator remains backward-compatible with legacy fields and hashes; secrets and
tracker history need no restoration. Never mix the revised minimal form with
an unverified old adapter and pretend it is live-ready.
