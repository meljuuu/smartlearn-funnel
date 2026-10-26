# Cloudflare deployment

Review URL: https://smartlearn-funnel.polarisjumel.workers.dev

Deployed October 26, 2026 to the existing Cloudflare account authenticated as
`polarisjumel@gmail.com`, Worker `smartlearn-funnel`. No existing Worker with that
name was found before deployment. The existing unrelated Pages project and Vercel
production project were left intact. No domain, DNS, plan, account permissions,
campaign budget or ad delivery settings were changed.

The deployment is a real Cloudflare Worker with static assets and both existing
API routes. It is **deliberately in preview mode**: no lead capture, email, events,
follow-ups or bookings are enabled by this deployment. It is not a connected
calendar or a verified Sheets integration.

Current Google preparation: the existing tracker schema is ready, the bound
`SmartLearn funnel adapter` project is installed and initialized under
`sales@smartlearn.ca`, and `APPS_SCRIPT_SECRET` is paired privately with this Worker.
The pending step is publication of its versioned Web app `/exec` URL and verification
of a real synthetic row. Installation/initialization alone does not prove HTTP capture.

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
| `FUNNEL_MODE` | Text | `preview` now; `live` only after approved test configuration |
| `CAPTURE_ENABLED` | Text | `false` now; `true` for controlled capture testing |
| `EVENTS_ENABLED` | Text | `false` until the verified calendar/reply/stop adapter is configured |
| `APPS_SCRIPT_URL` | Text or Secret | Approved Apps Script web-app `/exec` URL |
| `APPS_SCRIPT_SECRET` | Secret | Already generated and paired with the bound Apps Script property; do not replace during setup |
| `ALLOWED_ORIGINS` | Text | Already configured in Wrangler: `https://smartlearn-funnel.polarisjumel.workers.dev`; add only approved exact HTTPS origins, comma-separated |
| `PRIVACY_POLICY_URL` | Text | SmartLearn's approved public HTTPS privacy-policy URL |
| `BOOKING_URL` | Text | Confirmed public HTTPS calendar URL, or blank while missing |
| `EVENT_INGEST_SECRET` | Secret | Separate private secret for authorized automation, only if events are enabled |

Save/deploy the settings using the dashboard. The checked-in Wrangler vars always
default mode to preview and capture/events to false; a later CLI deploy reapplies
those safe defaults. Deliberately reconcile the versioned configuration before a
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

1. Complete the prepared Web app deployment in the bound
   [SmartLearn funnel adapter](https://script.google.com/u/3/home/projects/1bijcWxy-GWCcZHWwnnkLDhkjuo1ZDnFZ22QLunMJoFOzWMolPS0Tj_BE/edit):
   Web app, execute as the approved `sales@smartlearn.ca` account, access Anyone
   for the signed server endpoint. Owner approval of that API access is required;
   the Sheet's sharing is not changed. Do not substitute `/dev` or an editor URL.
2. Store the resulting `/exec` URL as `APPS_SCRIPT_URL` in this Worker's
   **Settings → Variables and Secrets**. All required signing-key pairing is
   already prepared. Keep `FUNNEL_MODE=preview`, both capture flags false and mail off.
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

The October 26 tested code is commit
`bff8ec4e89f09e4fdb3771b91638f35740019d1b`, deployed as Worker version
`a3d38935-8de4-42f0-bbf1-7288f17d321e`. The public config's
`X-SmartLearn-Build` header matches that commit. All seven deployed HTML/asset
files were downloaded and their SHA-256 hashes matched the generated build.
Later documentation-only commits do not change that deployed code revision.

`npm test` passes 28 checks, including Cloudflare adapter tests for public
config/invalid live mode, Request/Response capture/replay/status using the signed
mock adapter, trusted IP hashing, body limits, root routing and disabled APIs.
Wrangler's deployment dry run bundled successfully; deployment completed using
the actual Cloudflare runtime. Runtime integrations remain unconfigured.

The deployed smoke check covers the landing page, mobile overflow, both form steps,
no-send preview handoff, neutral direct `?mode=received` visits, disabled capture/
event JSON responses, security headers, public config and 404s for private source/
environment paths. No test inquiry is sent to the live tracker or any mailbox.
Local smoke script/screenshots are under ignored `.review/`.

The browser suite now has 15 passing checks, including headcount validation,
server rejection correction, pending-request reload recovery and return from
handoff. Local tests also cover partial calendar writes, semantic confirmation
deduplication, observable blocked delivery, manual suppression and fresh server/
adapter instances using shared durable mock storage. These remain mocked until
the signed real-adapter check above succeeds.

## Rollback

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

The Cloudflare dependency installation is pinned in `package-lock.json`. A patched
Undici override resolves the deployment tooling's transitive audit findings;
`npm audit` reported zero vulnerabilities after installation.
