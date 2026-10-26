# Cloudflare deployment

Review URL: https://smartlearn-funnel.polarisjumel.workers.dev

## Current photographic redesign (October 26)

The latest visual update adds original workshop photography, a full-width dark
hero, an overlapping workflow strip, a varied problem layout, a dark connected
process band and a polished light form panel. [PHOTO-DESIGN.md](PHOTO-DESIGN.md)
records asset sources, prompts, verification and the unavailable-attachment limit.
Runtime settings and integrations are unchanged. No real leads or messages were
sent for visual QA. The updated suite has 30 Node and 25 Chrome browser tests.

The immediately preceding deployment is Worker version
`ee180500-847d-4359-9446-6af64feac276`, commit
`db1165500f1ca12ef09938482a0db24a43cd8d40` (cream editorial layout).
To restore it, use Workers & Pages → smartlearn-funnel → Deployments → that
version → Rollback, or run
`npx wrangler rollback ee180500-847d-4359-9446-6af64feac276`.
Check `/assets/config.js` for the restored build ID and unchanged capture/calendar
settings. No secret changes are needed.

## Earlier editorial redesign (October 26)

The presentation update keeps the existing runtime configuration and capture
contract. It removes the decorative badges, floating cards and glows; adds an
original responsive workflow illustration; rewrites the public explanation; and
improves form text and responsive layout. See [design research](DESIGN-RESEARCH.md)
for all 35 references, asset provenance and the generation prompt.

Verification: `npm run build`, 30 Node tests and 24 Chrome browser tests passed.
Screenshots reviewed at 320, 390, 768 and 1440 pixels, including both form steps.
Browser capture/calendar responses are mocked; this redesign did not submit a
live inquiry, book a call, send mail or change delivery gates. Original logo bytes
and every input/select definition were compared with the preceding commit.
The live build is identified by `X-SmartLearn-Build` on `/assets/config.js`.

Before this redesign, the Worker version was
`9397254d-3191-4eda-a459-9d6ec30397d8`, code commit `6e84f38274fae8f3212980805c9c66d62e388ae3`.
To undo just the redesign, use Cloudflare dashboard → Workers & Pages →
smartlearn-funnel → Deployments → that preceding version → Rollback; or run
`npx wrangler rollback 9397254d-3191-4eda-a459-9d6ec30397d8` from this repository.
Then verify the former page and that `/assets/config.js` still reports live
capture and the existing Calendly/privacy URLs. Do not change server secrets.

Deployed October 26, 2026 to the existing Cloudflare account authenticated as
`polarisjumel@gmail.com`, Worker `smartlearn-funnel`. No existing Worker with that
name was found before deployment. The existing unrelated Pages project and Vercel
production project were left intact. No domain, DNS, plan, account permissions,
campaign budget or ad delivery settings were changed.

Current update: the user authorized publishing a site-specific privacy notice and
enabling website capture. The public form now saves inquiries through the existing
signed Google adapter. Booking URL: https://calendly.com/smartlearn-sales/30min.
The next-steps page embeds that Calendly schedule inline, with an external fallback
link. Only the exact Calendly origin is permitted by frame-src; no external embed
script or appointment-event listener was added. Preview does not load the calendar.
The parent page does not infer a booking or update a tracker status from frame events.
Privacy URL: https://smartlearn-funnel.polarisjumel.workers.dev/privacy.html.
The notice describes the implemented workflow; no legal-review approval is claimed.

The earlier full capture acceptance used code
`47100bf486ffc925107acb0d4cfd65f112e47719`, Worker version
`3d62ed81-172b-4063-8bab-a609165c7cf3`. Subsequent booking/embed updates retain
that capture implementation; read X-SmartLearn-Build for the current revision.
A real website inquiry survived a deliberately lost response, status recovery and
three concurrent same-ID replays. The actual tracker has exactly one matching row.
Email, follow-ups and authenticated provider events remain disabled. The supplied
booking page opens, but an actual appointment/reschedule/cancellation was not created.

Google Web app version 1 remains the capture-only deployment under
`sales@smartlearn.ca`. Its URL and signing key are paired privately in Cloudflare.
The user set Google `CAPTURE_ENABLED=true`; `TEST_CAPTURE_ENABLED` was reset false.
The mail component is installed and passed its actual two-message test. Production
delivery stays disabled. Its separate Apps Script `BOOKING_URL` property must also
be changed to the new Calendly URL before future email delivery; see
[EMAIL-SETUP.md](EMAIL-SETUP.md).

## Updating it

Required access: the Cloudflare account containing this Worker, with Workers
deployment access. An existing Wrangler OAuth session was reused; no new scopes
or tokens were requested or added to the repository.

```sh
npm ci
npm test
npm run deploy:cloudflare
```

If the local session expires, run `npx wrangler login` yourself and complete the
normal Cloudflare account flow. Do not paste tokens into chat or the repo.
`wrangler.jsonc` defines the Worker entry point, Node compatibility and `public/`
static assets. Its build runs `npm run build`; docs, source adapters and environment
files are not copied into that directory. Runtime functions reuse `api/leads.js`,
`api/events.js` and the existing signed Apps Script adapter through
`cloudflare/worker.mjs`. The Worker overrides the Node handler's client-IP input
with Cloudflare's platform header and retains the same request-ID contract.
The deployment command now requires a clean committed tree and automatically sets
`BUILD_COMMIT` to that commit. `/assets/config.js` returns it in
`X-SmartLearn-Build`, so the deployed server can be matched to the tested code.

Public `/assets/config.js` is generated from Worker runtime bindings on each
request. Only mode, endpoint, policy/calendar URLs and booking contact are returned;
server secrets are never included. Invalid live configuration visibly disables
the client rather than falling back to preview. Vercel's existing build behavior
is preserved separately.

## Settings when approved for controlled capture testing

First complete [SETUP.md](SETUP.md)'s Apps Script installation, privacy and sender/
calendar decisions. Cloudflare authorization does not authorize Google access or
sending as `info@smartlearn.ca`.

In **Cloudflare Dashboard → Workers & Pages → smartlearn-funnel → Settings →
Variables and Secrets**, configure:

| Name | Type | Value |
| --- | --- | --- |
| `FUNNEL_MODE` | Text | `live` now for authorized website capture; `preview` to disable public capture |
| `CAPTURE_ENABLED` | Text | `true` now; set `false` to disable new public inquiries |
| `EVENTS_ENABLED` | Text | `false` until the verified calendar/reply/stop adapter is configured |
| `APPS_SCRIPT_URL` | Secret | Already configured: the approved version 1 Web app `/exec` URL |
| `APPS_SCRIPT_SECRET` | Secret | Already generated and paired with the bound Apps Script property; do not replace during setup |
| `ALLOWED_ORIGINS` | Text | Already configured in Wrangler: `https://smartlearn-funnel.polarisjumel.workers.dev`; add only approved exact HTTPS origins, comma-separated |
| `PRIVACY_POLICY_URL` | Text | `https://smartlearn-funnel.polarisjumel.workers.dev/privacy.html` |
| `BOOKING_URL` | Text | `https://calendly.com/smartlearn-sales/30min` |
| `EVENT_INGEST_SECRET` | Secret | Separate private secret for authorized automation, only if events are enabled |

Save/deploy the settings using the dashboard. The checked-in Wrangler vars now enable the user-authorized website capture;
a later CLI deploy preserves that choice. Events stay false. Deliberately reconcile the versioned configuration before a
permanent approved live launch rather than silently relying on dashboard-only
flag changes. Secrets remain private server bindings. For CLI secret entry use
`npx wrangler secret put APPS_SCRIPT_SECRET` or
`npx wrangler secret put EVENT_INGEST_SECRET` and type the value only at its local
secret prompt; never place it in an argument, query string or public JavaScript.

Also set `CAPTURE_ENABLED=true` in Apps Script properties only for the agreed
controlled capture test. Email and suggested follow-ups stay off independently.
The authenticated workflow event destination, once approved, is
`https://smartlearn-funnel.polarisjumel.workers.dev/api/events`; all provider
verification, identity mapping, sender and stop-handling requirements in SETUP.md
remain applicable.

Preview mode now blocks direct public capture API attempts even if someone
accidentally sets `CAPTURE_ENABLED=true`. The separately signed synthetic-test
action is available only inside the Google adapter and cannot be requested through
the public `/api/leads` route. This permits integration testing while the public
form and all recipient delivery remain disabled.

## Verify Google without enabling the public form

1. The Web app deployment is complete in the bound
   [SmartLearn funnel adapter](https://script.google.com/u/3/home/projects/1bijcWxy-GWCcZHWwnnkLDhkjuo1ZDnFZ22QLunMJoFOzWMolPS0Tj_BE/edit):
   Web app, execute as the approved `sales@smartlearn.ca` account, access Anyone
   for the signed server endpoint. Owner approval of that API access is required;
   the Sheet's sharing was not changed. Do not substitute `/dev` or an editor URL.
2. The resulting `/exec` URL is already stored as `APPS_SCRIPT_URL` in this Worker's
   **Settings → Variables and Secrets**. Signing-key pairing is complete.
   For isolated adapter tests, keep the public Worker in preview and mail off;
   restore the deliberately selected public operating mode afterward.
3. Run `npm run verify:google` in your own interactive terminal. It asks for the
   `/exec` URL and a hidden signing-key input, then prints only readiness flags and
   aggregate delivery counts. `inspectSmartLearnSetup` in Google logs the same
   non-sensitive readiness information without making an HTTP request.
4. For an explicitly authorized live synthetic-row check, temporarily set only
   the Apps Script property `TEST_CAPTURE_ENABLED=true`, leaving
   `CAPTURE_ENABLED`, `EMAIL_ENABLED`, `FOLLOWUPS_ENABLED` and `EVENTS_ENABLED=false`.
   Run `npm run verify:google -- --capture`. The command makes three concurrent
   signed attempts with one request ID, checks status, replays it and disables the
   test gate. The adapter enforces a fixed non-deliverable synthetic address and
   test label and excludes test rows from mail processing even if mail is later enabled.
5. In the actual tracker, filter `Website request ID` for the printed opaque ID.
   There must be exactly one row with Source `Integration test (synthetic)`, Notes
   identifying the test, a real date and numeric team size. Keep the labeled row as
   evidence; do not delete IDs to test retries. If a command fails after a possible
   write, first run `npm run verify:google -- --status <request-uuid>` for its printed
   ID and inspect the tracker before starting another test. If test-gate reset
   could not be verified, set `TEST_CAPTURE_ENABLED=false` manually.

The signing recovery copy is encrypted with Windows DPAPI for this Windows user at
ignored `.review/smartlearn-signing-secret.dpapi`; no plaintext key file was written.
If you personally need to paste the existing key into a hidden local terminal
prompt or repair its approved Script property, run
`./scripts/copy-signing-secret.ps1` yourself, paste only into that secure destination,
then clear the clipboard (`Set-Clipboard -Value ""`). The value is not printed.
`scripts/provision-signing-secret.ps1` reuses that encrypted copy and refuses to
create a replacement when the remote key exists but recovery is unavailable.
This file is not portable to another Windows account; do not rotate keys merely
because the encrypted file is absent on another machine.

Verify one actual row in the existing tracker, one-row replay, uncertain-timeout
reconciliation and the authorized test mailbox/provider evidence before claiming
the integrations work. No real-prospect development messages are permitted.

## Verification

Current deployed code is `47100bf486ffc925107acb0d4cfd65f112e47719`, version
`3d62ed81-172b-4063-8bab-a609165c7cf3`. The public config's X-SmartLearn-Build
matches. All eight public static files, including privacy.html, matched local
SHA-256 hashes. Setup docs, Apps Script source and environment paths return 404.

`npm test`: 30 passing Node/service-harness tests. `npm run test:browser`: 16
passing isolated Chrome checks, including privacy readability at 320/390/1440px.
Calendar and automatic mail behavior are tested with mocks and need external checks.

The actual live website acceptance request is
`0545f78c-7e5e-4cb6-b492-188a91444e31`, lead
`6af46c6f-f6d3-40ec-8e97-407d4d417c56`. A repeated click produced one capture
POST. The test deliberately lost its response after durable Google capture;
status recovery and the handoff confirmed receipt. Three concurrent replays
returned that same lead. An independent full website-ID-column read found exactly
one matching row with correct attribution, native date, numeric headcount and blank
Meta ID. Only that test row's Source/Notes were labeled to exclude future mail.

The test also passed invalid data rejection, neutral direct handoff visits,
connected booking/privacy links and no contact details in browser storage or URLs.
The public Google booking URL returned 200 and the correct discovery-call title.
A real appointment, reschedule or cancellation was not created during this check.

The approved sales sender/Reply-To test reached the authorized Gmail inbox through
the connected Gmail tool. This is account/connector delivery evidence, not proof
that the optional Apps Script mail worker has runtime authorization. See
[EMAIL-SETUP.md](EMAIL-SETUP.md) for its owner-run test.

Final signed Google health: capture true; synthetic test, events, email and
follow-ups false; no automatic delivery records. See [VERIFICATION.md](VERIFICATION.md)
for historical setup evidence and remaining limits. Deployed test scripts and
screenshots are retained under ignored .review/.

## Rollback

For the inline-calendar change only, roll back to
`e65fd015-764e-4ab8-9337-0d0cc0bfb7fa`, which keeps live capture, Calendly's
external link and the current signing-key binding without the embed.

To return to the immediately preceding deliberate-preview deployment, run
`npx wrangler rollback 6e60b725-d77d-4012-832d-3590b11c9078 --name smartlearn-funnel`.
This disables the public capture path through the prior Worker mode. It does not
remove Google records or change Google Script properties. For a new CLI deployment
to remain off, also change checked-in `FUNNEL_MODE` to `preview` and
`CAPTURE_ENABLED` to `false`; otherwise this branch deliberately redeploys live.


In **Cloudflare → Workers & Pages → smartlearn-funnel → Deployments**, select the
recorded previous version and choose **Rollback**. The CLI equivalent is
`npx wrangler rollback <previous-version-id> --name smartlearn-funnel`.
The prior original review version was `c4eaba1e-e14b-41b1-a65f-f3350976aad5`;
the immediate pre-fix version, including the paired secret binding, is
`cee82b46-01cd-4f25-b77f-95b29a797284`. Use
`npx wrangler rollback cee82b46-01cd-4f25-b77f-95b29a797284 --name smartlearn-funnel`
to return to that review build. A Worker rollback
does not undo Google Sheet records, script properties or the Apps Script deployment.
Keep those records/IDs; restore Google code through a new versioned deployment only
if required. An older Worker version may lack the signing-secret binding; the
encrypted recovery helper can restore that binding without changing the key.

To undo only the new Google URL binding while retaining the tested code fixes,
roll back to `a3d38935-8de4-42f0-bbf1-7288f17d321e`. That version still has the
paired signing key but no Google endpoint URL. The separately published Google
Web app can be archived by its owner through **Deploy → Manage deployments**;
do not delete tracker IDs, test evidence or suppression records during rollback.

The Cloudflare dependency installation is pinned in `package-lock.json`. A patched
Undici override resolves the deployment tooling's transitive audit findings;
`npm audit` reported zero vulnerabilities after installation.
