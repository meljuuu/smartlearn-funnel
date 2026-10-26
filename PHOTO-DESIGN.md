# SmartLearn photographic redesign

## Motion update

`assets/motion.js` progressively enhances the landing page with one-time section
reveals using IntersectionObserver and the Web Animations API. Content is never
hidden by default. Keyboard focus cancels a target's reveal; changing to reduced
motion cancels running effects and disconnects the observer. CSS adds a brief hero
entrance, button hover/press feedback, arrow movement and restrained image/icon
hover effects. Hover movement requires a fine pointer. No looping or flashing
effects, parallax, dependencies or integration changes were introduced.

The browser suite now has 27 tests, including button states, one-time reveals,
runtime reduced-motion changes and content visibility without JavaScript.

This revision follows the user's written description of the website inside the
second promotional reference: strong headlines, dark photography, layered section
boundaries, light/dark contrast, clear actions and distinctive process steps.
Neither referenced attachment was present in the available conversation/files, so
no direct screenshot-to-reference comparison was possible. No poster surround,
watermarks, third-party branding or cybersecurity messaging was reproduced.

## Implemented composition

- Full-width photographic charcoal hero, a real HTML headline with yellow emphasis,
  a readable dark overlay and one primary inquiry button. Mobile keeps the text
  over a solid-dark portion, revealing the photograph below it.
- An overlapping cream workflow strip illustrates inquiry → schedule → follow-up
  with HTML and decorative SVG icons. This describes a process to explore, not a
  working software product or a claim that a booking has occurred.
- A warm-neutral problem section pairs a substantial original desk photograph,
  an offset yellow backing and four concrete administrative situations. One
  emphasized item and open supporting items avoid a repetitive card grid.
- A single subtle angled transition leads into a dark photographic process band.
  Large yellow 01/02/03 steps are connected horizontally on desktop and vertically
  on mobile, with their real explanations in HTML.
- The form has a light panel with a yellow top edge against a dark photographic
  setting, a clearer step indicator and practical supporting copy. Required fields,
  categories, all input/select attributes and the backend contract are unchanged.
- Existing Inter supplies the heavier display weights and readable body type;
  no fonts, libraries, tracking or project dependencies were added.

## Asset provenance

Both photographs are new images made with the built-in image-generation tool,
opaque background. They are illustrative, not photographs of SmartLearn staff,
customers, projects or premises. The hero's alt text and the nearby desk caption
explain that context. No real people, client stories or results are identified.
There is no software dashboard. The original logo and its existing optimized
derivative are retained unchanged. Prior workflow illustrations remain available
in the repo, but are no longer used by the landing page.

Responsive photographic JPEGs were encoded using the existing Windows
System.Drawing library (quality 85); no project dependency was required.

| Asset | Bytes |
|---|---:|
| `assets/workshop-hero-640.jpg` | 34,884 |
| `assets/workshop-hero-1000.jpg` | 69,345 |
| `assets/workshop-hero-1600.jpg` | 141,003 |
| `assets/workshop-detail-640.jpg` | 76,692 |
| `assets/workshop-detail-1000.jpg` | 152,991 |
| `assets/workshop-detail-1400.jpg` | 250,289 |

The hero uses responsive srcset/sizes, explicit dimensions and high loading
priority. The problem image uses srcset, explicit dimensions and lazy loading.
Process/form backgrounds reuse those photographs. The generated PNG sources are
preserved in ignored `.review/workshop-hero-source.png` and
`.review/workshop-detail-source.png`, plus the original generated-image directory.

### Hero generation prompt

Original photographic website hero, panoramic landscape 16:9 composition. Candid editorial photograph of a home-service business owner in a modest practical workshop office, seated at a real timber desk reviewing job paperwork beside an open laptop. Person positioned in the RIGHT THIRD, three-quarter profile, quietly concentrating, normal work clothing charcoal overshirt, believable hands and posture. On right workbench are neatly used tools, tape measure with a restrained yellow accent, shelves and rolled plans. Natural window light from far right, dimensional realistic textures, warm neutral wood and charcoal shadows, professional documentary photography, subtle film grain. LEFT HALF is quiet dark workshop wall and shadowed empty desk, uninterrupted negative space for a website headline added later in HTML. High quality visual depth, grounded ordinary small-business environment, no luxury-office cliches. Dark charcoal dominant with selective warm yellow details, warm cream paper. No readable words, letters, numbers or logos anywhere, laptop screen seen at oblique angle showing only indistinct neutral light, NO dashboard, NO futuristic graphics, no handshake, no looking at camera, no branding, no watermarks. Illustrative person, not a representation of any actual company or client. Composition must work when right side is cropped for mobile.

### Desk generation prompt

Original editorial photograph for a practical home-service business consultancy website. Landscape 4:3 composition, close-up of a grounded real workshop office desk, no people or hands. A simple paper job sheet on a clipboard at left with faint indistinct rules and no readable writing, a small open weekly paper planner with a few plain yellow blocks at center, face-down dark phone beside a pencil, tape measure and neat small work materials at right. Warm natural side window light, cream paper, weathered timber, charcoal black details, one restrained warm-yellow highlight. Beautiful realistic material textures and soft shadows, slightly elevated three-quarter camera angle, balanced intentional composition with useful subject detail even on a phone. Focus on the real administrative work behind home services. No screens showing UI, no fake software dashboard, no words letters numbers logos watermarks, no futuristic technology symbols, no glowing effect, no floating objects, no studio-perfect symmetry. High-end candid documentary still-life photography, matching a modest workshop environment.

## Verification and boundaries

Build: `npm run build`. Backend/adapter checks: `npm test` (30 tests, mocked
external services). Browser checks: `npm run test:browser` (25 tests). Layout and
both form steps are checked at 320, 390, 768, 1024 and 1440 pixels; saved screenshots
are `.review/redesign-WIDTH.png` and `.review/redesign-contact-WIDTH.png`.
Existing checks cover validation, keyboard/back navigation, duplicate clicks,
uncertain timeouts/reconciliation, malformed/server failures, privacy, neutral
handoff visits, preview/no-write safeguards and calendar fallback behavior.
New visual checks cover the actual photo loading, overlapping strip, absence of
old hero cards/badges, readable minimum text sizes and reduced-motion behavior.

No integration was activated or reconfigured. Public Google capture was already
enabled before this work; email/follow-ups/provider events remain disabled.
No real lead, email or appointment is created by these design tests. Local
development still defaults to preview. Public verification checks build/asset
identity and renders the live page without posting a submission.
