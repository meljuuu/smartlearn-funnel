# SmartLearn discovery funnel

Review build for Surrey and Langley home-service businesses. Real capture, email,
follow-ups and calendar integration are **disabled by default**.

October 26 update: the user authorized enabling website capture and publishing a
site-specific privacy policy. Cloudflare's checked-in runtime now uses live capture,
the hosted `/privacy.html` notice and the supplied Google booking URL. Local
development still defaults to preview; email, follow-ups and provider events stay off.
See [email authorization](EMAIL-SETUP.md) for the chosen sales mailbox setup.

Cloudflare review deployment: https://smartlearn-funnel.polarisjumel.workers.dev

The existing Google tracker and signed Web app are connected. A real synthetic
capture with three concurrent attempts and a replay produced exactly one row;
Cloudflare status reconciliation and manual reply/stop controls also passed.
Public capture and recipient delivery remain off pending approved settings and
end-to-end acceptance. See [verification evidence](VERIFICATION.md).

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
