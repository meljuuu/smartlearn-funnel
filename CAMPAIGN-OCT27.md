# SmartLearn — October 27 review copy and test preparation

This file contains the exact proposed replacements for the canonical **SmartLearn
Campaign** Google Doc. That document was read through the sales Workspace account
on October 27 and was not edited. Its older home-service wording, category-led
form description, info-only booking contact, ad A/B captions and hashtags need
these replacements. Conversation-supplied October 27 feedback takes precedence.

## Landing page and offer

**The jobs are finished. The paperwork isn't.**

Quotes to send. Customers waiting for updates. Invoices to follow up. The same
details entered into different systems.

SmartLearn helps businesses in Surrey and Langley simplify repetitive admin
through better workflows, software and practical AI automation.

**Request a Free Discovery Call**

Tell us which task takes up your time. We'll discuss how it works today and
whether automation could help.

The free AI & Digitization Discovery Call is an initial conversation about one
repetitive administrative workflow. It does not include a complete audit or an
on-site assessment. Assessments, implementation and ongoing services are scoped
separately. No percentage savings, testimonials, guarantees or client claims.

### Four recognizable problems

1. **One customer. The same details entered three times.** Information moves
   from messages to quotes to invoices through manual copying.
2. **A schedule change shouldn't mean five phone calls.** Changes create extra
   coordination when everyone works from different information.
3. **Who was supposed to call that customer back?** Inquiries can stall when
   the next action has no clear owner.
4. **The quote is sent. The follow-up is forgotten.** Busy days push potential
   work down the list.

### Discovery conversation

1. Bring one repetitive task. Explain who handles it and which tools you use.
2. Explore where it gets held up: copying, chasing and unclear handoffs.
3. Agree a possible next step. If there is a fit, a further assessment or
   implementation is scoped separately.

### Form and handoff

**Which admin task would you like off your plate?**

Request a free discovery call with our Digitization Team. Share your contact
details and one task you would like to simplify.

Required: business name, one task, full name, work email and the inquiry contact
acknowledgment. Phone, team size, business type and service area are optional.
Business type retains the original eight stored choices plus Other for routing;
those categories are not exclusive eligibility criteria. Standard personal email
providers are accepted. No team-size rejection rule was added.

**Request My Free Discovery Call**

A request does not confirm an appointment. After **verified live capture**, the
prospect can choose a time through the already supplied Calendly destination:
https://calendly.com/smartlearn-sales/30min. Calendly must confirm the appointment.
The revised Google adapter has now been published and its minimal capture verified
against the actual tracker. Public inquiry capture is enabled; local preview
sends/saves nothing and does not load Calendly. Public inquiry/scheduling contact: sales@smartlearn.ca.
Requested internal visibility: sales first, info@smartlearn.ca copied where
configured. This does not identify the meeting host or authorize a sender.

## Proposed ads — preparation only

Use **Learn More** for the proposed Facebook button and the clear free-call CTA
at the destination. The website-vs-Instant-Form route still needs approval; links
below demonstrate the website route without launching an ad. No paid targeting,
budget, account permissions or delivery settings were changed.

### A. Evening paperwork

**Primary text:** Still doing paperwork after the last job? Quotes, invoices and
follow-ups can keep your day going long after the customer work is finished.
SmartLearn helps businesses in Surrey and Langley identify repetitive admin that
could be simplified or automated. Start with a free discovery call about one task
taking up your team's time.

**Headline:** Less evening admin starts with one workflow

**Visual brief:** People-free desk with a lamp, laptop, quotes/invoices and an
unfinished follow-up list. Use a subtle evening cue, charcoal shadows, warm white
paper and selected yellow highlights. The current licensed empty-desk photo is
available in `assets/admin-desk-*.jpg`. Keep the headline and list editable in
HTML/design layers. All example business data must be fictional or unreadable.
Do not imply a real SmartLearn client or software product.

**Review destination:** https://smartlearn-funnel.polarisjumel.workers.dev/?concept=evening-paperwork

### B. Repeated entry

**Primary text:** Copying the same customer details into another system? From
inquiry to quote to invoice, repeated data entry takes time and creates
opportunities for mistakes. Explore a simpler workflow with SmartLearn. Tell us
about one repetitive task on a free discovery call.

**Headline:** Reduce repeated data entry

**Visual brief:** Inquiry → Quote → Invoice panels repeat the same fictional
“Example Company” / “Job details.” Show the repeated copying clearly using yellow
arrows. The landing page's `.repeat-workflow` is an editable implementation.
No people, fake client data, fake app interface or fabricated results.

**Review destination:** https://smartlearn-funnel.polarisjumel.workers.dev/?concept=repeated-entry

### C. Customer updates

**Primary text:** A customer update shouldn't take three phone calls. Checking
job details and calling people back can interrupt your team's day. SmartLearn
helps businesses explore simpler ways to manage updates, scheduling and approvals
using existing tools and suitable automation. Request a free discovery call with
our Digitization Team.

**Headline:** Simplify customer updates and follow-ups

**Visual brief:** Show objects and editable messages: a phone/status queue and
separate job updates resolving into a clear next-action list. Use fictional task
names, no phone numbers, no people and no invented SmartLearn dashboard. Retain
the exact free-call offer and sales contact.

**Review destination:** https://smartlearn-funnel.polarisjumel.workers.dev/?concept=customer-updates

## Proposed comparison — do not automatically run

First compare evening paperwork with repeated entry. Hold audience, location,
offer and page structure consistent; use native A/B testing if the approved
account supports it. The allowlisted `concept` parameter changes the opening,
not the offer or capture/booking state. Unknown concepts fall back to evening
paperwork. Existing UTM/ad identifiers are preserved. There is no Pixel or ad
spend API installed, and preview submissions are not conversions.

Keep Surrey and Langley. Generic public wording does not authorize a wider paid
audience, new industry targeting or expansion to Coquitlam, Port Coquitlam or
Port Moody. Those locations remain conditional suggestions. CAD $280 over 14
days and one-/three-business-day prompts are unapproved recommendations.

Only consider customer updates as a third comparison once results and approved
budget support it. Short video is an optional later test. Do not invent a winner,
sample size, test duration, qualification threshold, launch date or response-time
promise. A human owner/backup must agree a realistic response window first.

## Measurement and existing tracker mapping

The current 30-column header was re-read. No rows, permissions or structure were
changed. The adapter writes new captures only and preserves historical values.

| Information | Existing column / process |
|---|---|
| Source / business / contact / task | `Source`, `Business name`, `Name`, `Email`, `Phone`, `Main administrative challenge` |
| Optional routing/headcount | `Business type`, `City/service area`, `Team size`; unknown values remain blank, never zero |
| Concept | Existing `Notes`: `Website concept: evening-paperwork`, `repeated-entry` or `customer-updates` |
| Actual originating creative | `UTM content`, with other UTM columns unchanged |
| Ad identity | `Source ad ID`, `Source adset ID`, `Source campaign ID`; actual values only |
| Website identity | `Website request ID`, `Website lead ID`, `Website payload hash`; never write them into `Meta lead ID` |
| Response owner | `Assigned person`, populated only when `LEAD_OWNER` is actually confirmed |
| Qualification | `Outcome` and explanatory `Notes`; criteria pending, not inferred from category/team size |
| Appointment | `Status`, `Call date/time`, `Attendance`; enter from verified bookings/attendance, not link clicks |
| Next action / proposals | `Next follow-up date`, `Outcome`, `Notes`, existing `Proposal Sent` status |

Use one row per verified inquiry and deduplicated lead ID when counting. A booked
or attended status alone is not a qualification decision. Agree qualification
criteria, then count attended calls that separately meet those criteria.

Record spend, link clicks and landing views from the actual Ads Manager report
for the same dates/concept; the project does not automatically import them.
`campaign/measurement-template.csv` is an empty offline reporting template, not
a replacement tracker or claimed campaign result.

- Cost per inquiry = verified attributable spend / confirmed inquiries.
- Cost per attended qualified call = attributable spend / calls both attended
  and qualified under the approved criteria.
- When a denominator is zero or unknown, leave the cost blank, not zero.
- Review inquiries, qualification outcomes, calls booked/attended, proposals and
  opportunities together; do not choose a winner from low inquiry cost alone.

## Decisions still awaiting confirmation

Business: final route/targeting, qualification criteria/exclusions, response owner
and backup/window, intended human host and availability, approved sender/Reply-To,
privacy owner/retention review, follow-up timing, approved budget and launch date.
Technical: publish the prepared adapter version, verify a minimal synthetic row,
inspect actual Calendly plan/calendar settings, verify scoped sales→info calendar
notification routing, and finish controlled booking/reschedule/cancellation tests.
The supplied phone 778-237-5785 is recorded as supplied, but no phone was added
to the public page while final contact handling is being confirmed.
