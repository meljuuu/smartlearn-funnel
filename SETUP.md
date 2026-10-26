# SmartLearn discovery funnel

## Included
- `dist/index.html`: landing page and two-step qualification/contact form.
- `dist/thank-you.html`: booking handoff page.
- `dist/assets/styles.css`: responsive base styles.
- `dist/assets/design.css`: centered reference-inspired layout, layered workflow cards and rounded yellow/charcoal sections.
- `dist/assets/app.js`: validation, step navigation, preview handoff, endpoint submission and error handling.
- `dist/assets/config.js`: configuration only; no passwords, tokens or private keys belong here.
- `dist/assets/logo.png`: original supplied logo, unchanged.

Open `dist/index.html` to review. Preview mode does not send or store personal information. All eight home-service categories from the brief are included. There is no automatic minimum-team-size rejection. No analytics or advertising pixel is loaded.

## Confirm before connecting
1. Zakir confirmed `info@smartlearn.ca` for discovery-call calendar bookings. Confirm whether this is a mailbox, alias or shared address, who owns the calendar and who can manage it. Sign in through the normal authorized account flow; do not copy chat credentials into source files.
2. Confirm call duration, host, service hours, time zone, booking notice and buffers, and produce the public calendar URL. The current SmartLearn website describes a free 30-minute discovery call, but the campaign calendar settings still need confirmation.
3. Confirm minimum company size, exclusions, response owner and backup, budget, duration and launch date.
4. Confirm the approved privacy-policy URL and final wording. The contact-details dialog in preview is not a substitute for the business privacy policy.

## Lead endpoint contract
Deploy a server-side webhook, for example through the team's chosen automation platform, and set its HTTPS URL as `leadEndpoint` in `dist/assets/config.js`. A front end alone does not write to Google Sheets or send email.

Accept POST JSON with these fields:

```json
{
  "request_id": "client-generated UUID",
  "source": "smartlearn_discovery_funnel",
  "submitted_at": "ISO timestamp",
  "business_name": "Example Services",
  "business_type": "Plumbing",
  "service_area": "Surrey",
  "team_size": "6–10",
  "main_challenge": "Customer inquiries and follow-ups",
  "full_name": "Example Contact",
  "email": "example@example.com",
  "phone": "",
  "contact_consent": true,
  "attribution": {"utm_source":"facebook","utm_medium":"paid_social","utm_campaign":"discovery","utm_content":"phone_a"}
}
```

The server must validate and bound fields, validate email and consent, reject spam/rate-limit abuse, and sanitize spreadsheet cells so input beginning with `=`, `+`, `-` or `@` cannot become a formula. Enforce allowed CORS origin(s), including a preflight response for cross-origin JSON requests. Do not put a secret webhook key in public JavaScript.

Use `request_id` as the idempotency key. Atomically write or queue the lead once before responding. Persist notification/acknowledgment delivery state and retry failures without creating duplicate leads or emails. A timeout can mean the server received the request; reconcile the request ID before retrying manually.

Return HTTP 200/201 JSON only after durable capture:

```json
{"ok":true,"leadId":"SERVER_ASSIGNED_ID"}
```

Errors must return non-2xx JSON. Never return success before capture. The page displays an error instead of a thank-you state when success is unconfirmed. It does not retry automatically.

## Tracker mapping and notification
Use the existing SmartLearn Leads & Discovery Calls spreadsheet. Map full name to Name; business_name to Business name; email to Email; phone to Phone; business_type to Business type; service_area to City/service area; team_size to Team size; main_challenge to Main administrative challenge. Set Date received from server time; Source to Website funnel; Status to New; assigned person to the confirmed owner. Store request_id, leadId and UTM fields in additional columns rather than a Meta lead-ID field.

Notify the confirmed owner and backup with a tracker link. Confirm sender identity and reply routing. `info@smartlearn.ca` is the booking contact; this does not prove that it is an authorized automated email sender. Send from a verified, authorized mailbox only. Use the campaign document's acknowledgment and follow-up copy.

The tracker metadata checked during this task showed only `sales@smartlearn.ca` as owner and no other permissions. Zakir's `smartlearncanada@gmail.com` and Ernell's `ai@smartlearn.ca` requested access. An owner should grant the agreed access and verify both can open the tracker. This build does not change sharing.

## Calendar and follow-up
Set `bookingUrl` to the confirmed HTTPS calendar page. Without it, the handoff offers `info@smartlearn.ca`; it does not invent available time slots. A submitted lead and a booked call are separate events. Configure the calendar's booking/rescheduling/cancellation events to update the matching lead and cancel stale booking prompts. Pause follow-up after a reply and permanently respect stop requests. Set one acknowledgment and one booking-confirmation sender.

## Meta lead route
Choose one initial conversion route:
- Meta Instant Form: Meta collects details; its completion screen links directly to the calendar or booking handoff. Use a separate Meta lead trigger to write to the same tracker. Do not make the prospect fill the website form a second time.
- Website lead form: ad links to the deployed landing page; the server captures the inquiry and then the page offers booking.

Preserve actual Meta lead IDs for Meta leads and request IDs for website leads. Decide the reconciliation rule before merging leads with the same email. If using website event measurement, configure the agreed Meta Pixel/Conversions API and applicable consent flow separately; fire Lead only for a confirmed capture and keep event IDs consistent. Do not place personal details in URLs. This build captures only allowlisted UTM parameters and does not add tracking scripts.

## Go live
1. Put the pages and assets on the approved public campaign domain/path. The private Sites preview is not an advertising destination or a shared review link for Zakir.
2. Configure `leadEndpoint`, `bookingUrl` and `privacyUrl`; set `previewMode: false` only after integration tests pass. Live submission requires a valid HTTPS endpoint and privacy URL.
3. Test an empty form, malformed email, absent consent, back navigation, one successful capture, repeated request ID, endpoint timeout/failure, notification failure, booking, rescheduling, cancellation and stop request. Reconcile against the tracker and calendar.
4. Check keyboard access and actual mobile layouts, final ad exports and destination previews.
5. Keep `noindex,nofollow` for a campaign-only page unless the team wants indexing. Preview banners disappear only when live settings are valid.
6. Obtain final campaign/budget approval, then launch. There is no live advertising configuration in this package.

## Claims
The brief mentions reducing administrative workload by up to 50%. This is not included in public copy because no supporting evidence was supplied. Obtain evidence and approval for the exact claim or keep the process-focused copy.

## Checks performed
JavaScript syntax checked. Browser preview verified empty-form validation, business qualification, contact step, invalid email rejection, consent handling and preview handoff. Preview submission sent no lead or email. Live webhook, Google Sheets, sender and calendar integrations are pending configuration and have not been tested end to end.

Website references: https://smartlearn.ca/ and https://smartlearn.ca/journey/ .

## Visual update
The funnel uses the supplied design references for centered composition, pill buttons, floating workflow cards and rounded feature sections. SmartLearn’s original logo, yellow/charcoal palette, people-free graphics and campaign content are retained. Desktop and 390-pixel mobile layouts were visually checked. Preview submission behavior remains unchanged.
