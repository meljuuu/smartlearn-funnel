# Authorize SmartLearn email

Chosen sender and Reply-To: `sales@smartlearn.ca`. The booking contact remains
`info@smartlearn.ca`. The account's connected Gmail sender test reached the
explicitly authorized test inbox with the correct From/Reply-To headers. That
connector test does not authorize this Apps Script project or enable automation.

## 1. Add the prepared mail file

1. Sign into `sales@smartlearn.ca` and open the existing
   [SmartLearn funnel adapter](https://script.google.com/u/3/home/projects/1bijcWxy-GWCcZHWwnnkLDhkjuo1ZDnFZ22QLunMJoFOzWMolPS0Tj_BE/edit).
2. Leave the installed `Code.gs` and existing Script properties intact.
3. In the editor, choose **Files + → Script**, name it `Mail`, and paste the
   complete contents of generated `.review/SmartLearn-Mail.gs` into that file,
   replacing its blank starter function. Save the project.
4. If the local file is missing, run `npm run build` from this repository first.
   Use either this additional mail-only file or the combined full bundle, never
   both; duplicate functions make the installation ambiguous.

The mail-only source adds no trigger. The already published capture-only Web app
does not need redeployment just to run these editor functions. After future
capture-code changes, explicitly deploy a new version of that Web app.

## 2. Set private test properties

Open **Project settings → Script properties → Edit script properties**. Keep
the existing signing key unchanged. Configure:

| Property | Value |
| --- | --- |
| `SENDER_EMAIL` | `sales@smartlearn.ca` |
| `REPLY_TO_EMAIL` | `sales@smartlearn.ca` |
| `BOOKING_URL` | `https://calendar.app.google/d7D49Ut8wifKxTRB8` |
| `TEST_EMAIL` | The test inbox explicitly authorized in this conversation |
| `TEST_EMAIL_ENABLED` | `true`, only for this manual test |
| `EMAIL_ENABLED` | `false` |
| `FOLLOWUPS_ENABLED` | `false` |
| `EVENTS_ENABLED` | `false` |
| `TEST_CAPTURE_ENABLED` | `false` |
| `BOOKING_CONFIRMATION_SYSTEM` | `calendar` |

Save. `CAPTURE_ENABLED` can remain true for the now-authorized website capture.
No password, API token or new send-as alias is required when executing as the
actual `sales@smartlearn.ca` mailbox. Do not paste credentials into chat.

## 3. Authorize and run the isolated email test

1. Return to **Editor**. In the function dropdown choose
   `sendSmartLearnTestMessages`, then click **Run**.
2. If Google requests authorization, choose **Review permissions**, select
   `sales@smartlearn.ca`, inspect the requested permissions and complete consent
   yourself. This uses the existing `GmailApp` adapter, which requests Gmail
   capability, not just the ChatGPT Gmail connection. If Workspace policy blocks
   it, ask your administrator about this specific project; do not bypass policy.
3. The function sends exactly two clearly labeled synthetic test messages to
   `TEST_EMAIL`: an acknowledgment template and an owner-notification template.
   It does not scan or send to inquiry rows. Production `EMAIL_ENABLED` stays false.
4. Check the authorized inbox, Spam and the sender's Sent folder. Verify From,
   Reply-To, the booking URL and complete template text. No brackets or fictional
   appointment details should appear. The owner template intentionally includes
   the private tracker link; this grants no new tracker access.
5. Check `_SmartLearnDelivery`: two `mail-test:` keys should be `sent`.
   `TEST_EMAIL_ENABLED` resets to false. Re-enabling the test gate and running
   again must send no duplicates. A `sending` or `uncertain` record is held;
   reconcile its actual Sent/inbox evidence rather than deleting keys or resending.

No development test should target a prospect or an unapproved mailbox.

## 4. Before automatic production acknowledgments

The response owner and backup still need confirmation. Set
`OWNER_NOTIFICATION_EMAILS` to their approved addresses, comma-separated, and
`LEAD_OWNER` to the agreed tracker assignment. Run `verifySmartLearnSender`.
Ensure staff monitor the actual Reply-To inbox and record replies/stops through
**SmartLearn inquiry controls** until a verified inbound workflow is installed.

Only after the test and production-delivery approval, set `EMAIL_ENABLED=true`
and add an authorized time trigger for `processSmartLearnNotifications` through
**Apps Script → Triggers → Add Trigger → Time-driven**. A scheduled trigger is
required; the website capture does not itself invoke the mail worker.
Keep `FOLLOWUPS_ENABLED=false` until timing is approved. Keep
`BOOKING_CONFIRMATION_SYSTEM=calendar` to avoid duplicate booking confirmations.

Google references: [Apps Script authorization](https://developers.google.com/apps-script/guides/services/authorization)
and [GmailApp capability](https://developers.google.com/apps-script/reference/gmail/gmail-app).
