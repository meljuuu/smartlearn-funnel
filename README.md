# SmartLearn discovery funnel

Discovery funnel for businesses in Surrey and Langley. The October 27 review
uses the new pain-point copy, people-free stock imagery and a shorter form.
Cloudflare inquiry capture is now **live**, after the user published the revised
Google adapter and a real minimal inquiry passed concurrency/replay tests with
exactly one independently verified tracker row. Local development remains preview.
Automatic email, follow-ups and provider events remain disabled. See [current setup](OCT27-SETUP.md) and
[campaign copy/testing plan](CAMPAIGN-OCT27.md). Existing signing and tracker
connections are intact; the deployed adapter now reports the required October 27 contract.

The following October 26 deployment notes describe the previous live iteration.
Current October 27 preview/setup instructions take precedence.

October 26 update: the user authorized enabling website capture and publishing a
site-specific privacy policy. Cloudflare's checked-in runtime now uses live capture,
the hosted `/privacy.html` notice and the supplied Calendly booking URL. Local
development still defaults to preview; email, follow-ups and provider events stay off.
See [email authorization](EMAIL-SETUP.md) for the chosen sales mailbox setup.

Cloudflare review deployment: https://smartlearn-funnel.polarisjumel.workers.dev

The landing page now uses licensed Pexels workshop photography, a bold dark hero,
overlapping sections, yellow process numbers and a polished light form panel.
[Stock-photo sources](STOCK-PHOTOS.md) record current imagery and license checks;
[design notes](PHOTO-DESIGN.md) preserve the composition and earlier asset history;
[earlier research](DESIGN-RESEARCH.md) preserves the 35-site reference log.
No new dependencies or integration settings are required. Current design QA
covers 30 Node / 27 browser tests. Buttons and sections now include restrained
motion, with reduced-motion support and no dependency on animation for visibility.

After capture, the next-steps page now includes the supplied Calendly schedule
inline, with a new-tab fallback. Direct visits remain neutral; preview does not
load real booking. Appointment status still requires the separately verified event
integration. The privacy notice describes Calendly's embedded service.

The existing Google tracker and signed Web app are connected. A real synthetic
capture with three concurrent attempts and a replay produced exactly one row;
Cloudflare status reconciliation and manual reply/stop controls also passed.
Public capture is now enabled on explicit user instruction and passed a real
website test. Recipient automation remains off pending account authorization. See [verification evidence](VERIFICATION.md).

Deploy updates to the authenticated Cloudflare account with
`npm run deploy:cloudflare`. The Worker serves the existing pages and reuses the
same server handlers; [Cloudflare setup](CLOUDFLARE.md) covers runtime settings.

The existing root HTML/assets are retained. Vercel now builds an explicit static
`public/` output and two Node server functions in `api/`; it does not use `dist/`
or the unrelated private preview's `.openai/hosting.json`.

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4173. Run `npm test` and `npm run test:browser` (installed
Google Chrome required). Tests use synthetic addresses under `example.invalid`;
they never contact Google Sheets, Gmail, calendars or prospects.

`npm run verify:google` is a separate, explicitly live signed adapter check.
`npm run verify:google -- --capture` can create one clearly labeled synthetic row
only when `TEST_CAPTURE_ENABLED=true` in Apps Script. It keeps public capture and
all delivery off, reconciles concurrent attempts and disables the test gate afterward.

- [Setup and launch handoff](SETUP.md): exact account settings, verified tracker
  mapping, outstanding decisions, delivery reconciliation and external tests.
- [Implementation verification](VERIFICATION.md): what was checked and its limits.
- `.env.example`: server settings; never commit a filled environment file.
- `apps-script/SmartLearn.gs` and `shared/core.cjs`: adapter sources. Build creates
  `.review/SmartLearn-Capture.gs` for Sheets-only setup and optional
  `.review/SmartLearn.gs` with mail capability after sender approval.

The Vercel `main` branch remains unchanged. Both the Cloudflare review deployment
and Vercel branch preview can be used for review. Changing code alone
does not authorize advertising, media spend or automated delivery.
