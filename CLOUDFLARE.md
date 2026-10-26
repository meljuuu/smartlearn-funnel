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
| `APPS_SCRIPT_SECRET` | Secret | Same private random value as the Apps Script property; at least 32 characters |
| `ALLOWED_ORIGINS` | Text | `https://smartlearn-funnel.polarisjumel.workers.dev`; add only approved exact HTTPS origins, comma-separated |
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

Verify one actual row in the existing tracker, one-row replay, uncertain-timeout
reconciliation and the authorized test mailbox/provider evidence before claiming
the integrations work. No real-prospect development messages are permitted.

## Verification

`npm test` passes 18 checks, including three Cloudflare adapter tests for public
config/invalid live mode, Request/Response capture/replay/status using the signed
mock adapter, trusted IP hashing, body limits, root routing and disabled APIs.
Wrangler's deployment dry run bundled successfully; deployment completed using
the actual Cloudflare runtime. Runtime integrations remain unconfigured.

The deployed smoke check covers the landing page, mobile overflow, both form steps,
no-send preview handoff, neutral direct `?mode=received` visits, disabled capture/
event JSON responses, security headers, public config and 404s for private source/
environment paths. No test inquiry is sent to the live tracker or any mailbox.
Local smoke script/screenshots are under ignored `.review/`.

The Cloudflare dependency installation is pinned in `package-lock.json`. A patched
Undici override resolves the deployment tooling's transitive audit findings;
`npm audit` reported zero vulnerabilities after installation.
