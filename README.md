# SmartLearn discovery funnel

Review build for Surrey and Langley home-service businesses. Real capture, email,
follow-ups and calendar integration are **disabled by default**.

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

- [Setup and launch handoff](SETUP.md): exact account settings, verified tracker
  mapping, outstanding decisions, delivery reconciliation and external tests.
- [Implementation verification](VERIFICATION.md): what was checked and its limits.
- `.env.example`: server settings; never commit a filled environment file.
- `apps-script/SmartLearn.gs` and `shared/core.cjs`: owner-installed Sheets/mail
  adapter. `npm run build` combines them into `.review/SmartLearn.gs` for installation.

The Vercel `main` branch remains the production source. Use the review branch's
preview deployment for integration testing before merging. Changing code alone
does not authorize advertising, media spend or automated delivery.
