# Product Wireframes - "Platform"
### Low-fidelity wireframes / design prompts for Claude's Design tool

| Field | Value |
|---|---|
| Version | 1.0 |
| Date | 2026-06-13 |
| Companion to | docs/PRD.md (v1.0) |
| Purpose | Per-screen structure + content + a paste-ready design prompt, to generate high-fidelity designs in Claude's Design tool |
| Status | Wireframes only - designs not yet produced |

---

## 0. How to use this document

These are **low-fidelity wireframes**: they fix *structure, hierarchy, content, components, and states*. They deliberately do **not** fix visual styling (color, type scale, spacing, imagery) - that is what Claude's Design tool will decide. For each screen you get:

1. **Route / purpose / phase** - where it lives and when we build it.
2. **ASCII layout** - spatial sketch (desktop; mobile notes where it differs).
3. **Sections** - what each region contains.
4. **Data / states** - dynamic content, empty/loading/error/edge cases.
5. **Paste-ready prompt** - a self-contained brief for the design tool.

**Workflow:** paste the *Master prompt preamble* (Section 0.2) once at the start of a design session, then paste a screen's **Paste-ready prompt** to generate that screen. Iterate in the tool. Keep the surface consistent by designing the shared shells first (site header/footer = A0; console app shell = B0), then the individual screens.

**Build phase tags:** `[v1]` = Phase 1 (build next, after designs). `[v1*]` = Phase 1 but only the safe-field subset. `[P2]` = Phase 2 tool (design now for a consistent system; build later).

### 0.1 ASCII legend
```
+-----+  container / frame          [Button]      button (primary if filled idea)
|=====|  section divider            [ Input.... ] text field
(img)    image / media              ( v ) dropdown / select
{icon}   icon                       [x] [ ] checkbox / toggle
<<  >>   carousel / scroller        > Label        expandable / accordion row
| | |    columns                    *               list bullet
@ KPI     stat / metric             ::: tab :::     active tab
```

### 0.2 Master prompt preamble (paste once per design session)
```
You are designing screens for "Platform", a polished, conversion-focused web product
for local service businesses (roofing, dental, restaurants, salons, etc.). There are
two surfaces:
  (A) PUBLIC MARKETING WEBSITES for each business - their public site that ranks on
      Google and turns visitors into phone calls and form leads.
  (B) A CLIENT CONSOLE where the (non-technical) business owner manages their leads,
      money, reviews, and site.

Audiences:
  - Public site visitors = homeowners / patients / diners, mostly on mobile, deciding
    whether to trust and contact this business. Conversion + trust is everything.
  - Console users = a busy, non-technical owner or their office manager, mobile-first,
    who wants to see "am I getting calls and is my money working" at a glance.

Visual direction (unless I give brand colors/tokens): clean, modern, high-contrast,
trustworthy, generous whitespace, strong typographic hierarchy, large confident imagery
on marketing pages, rounded corners but not bubbly, subtle depth. Accessible (WCAG 2.2
AA contrast, visible focus). Production-grade, NOT a generic template look.

Constraints:
  - Treat ALL copy and images as placeholder; keep them realistic for the niche.
  - Mobile-first: show the mobile layout and the desktop layout.
  - Marketing pages must have an always-reachable call-to-action (call / get a quote).
  - The console is data-dense but calm; prioritize scannability over decoration.
Design the screen I describe next.
```

### 0.3 Breakpoints & global notes
- Breakpoints: mobile (~360-430), tablet (~768), desktop (~1024-1280, content max ~1200).
- Public sites: every page reuses **Header (A0)** and **Footer (A0)**. A persistent mobile **call bar** is pinned bottom on all marketing pages.
- Console: every screen sits inside the **App shell (B0)** (sidebar on desktop, bottom tab bar on mobile).
- Structured-data, performance, and SEO requirements live in the PRD (Sections 9, 16); they do not affect layout but should be remembered when building.

---

# PART A - Public marketing site (Surface A)

Style note for this part: large hero imagery, trust signals high on the page (reviews, license/insurance, guarantees), repeated clear CTAs, local proof (city names, maps). Sample niche in examples = roofing; content varies per niche.

## A0. Global Header & Footer + navigation  [v1]
**Purpose:** consistent, conversion-forward chrome on every page; doubles as SEO internal-linking.

**Desktop header**
```
+----------------------------------------------------------------------+
| [Logo]   Home  Services(v)  Areas(v)  About  Reviews  Blog   {phone}  |
|                                                       (555) 123-4567  |
|                                                      [ Get a Quote ]  |
+----------------------------------------------------------------------+
   Services(v) opens a mega-menu:               Areas(v) opens a list:
   +--------------------------------------+     +--------------------+
   | Roof Repair      Roof Installation   |     | Tampa             |
   | Emergency Service  Maintenance Plans |     | St. Petersburg    |
   | [ View all services -> ]             |     | Clearwater  ...   |
   +--------------------------------------+     +--------------------+
```

**Mobile header + drawer + sticky call bar**
```
+--------------------------+        drawer (on {menu}):
| [Logo]        {menu} =   |        +----------------------+
+--------------------------+        | Home                 |
            ...                     | Services  >          |
+--------------------------+        | Areas     >          |
| {phone} Call  | Quote -> |  <-- pinned bottom call bar   |
+--------------------------+        | About / Reviews ...  |
                                    | [ Get a Quote ]      |
                                    +----------------------+
```

**Footer (all pages)**
```
+----------------------------------------------------------------------+
| [Logo]            Services         Service Areas      Company        |
| Short blurb.      * Roof Repair    * Tampa            * About        |
| {phone} {email}   * Installation   * St. Petersburg   * Reviews      |
| Hours: M-F 8-6    * Emergency      * Clearwater       * Blog/Contact |
| {social icons}    * Maintenance    * ...              * Legal        |
|----------------------------------------------------------------------|
| (c) Business Name  Lic# 12345  Insured   Privacy | Terms | Access.   |
+----------------------------------------------------------------------+
```
**Sections:** logo+NAP+hours+social; services links; service-area links; company/legal links; license/insurance line. **States:** phone always tap-to-call on mobile.
**Paste-ready prompt:**
```
Design a reusable site HEADER and FOOTER plus navigation for a local-business marketing
site (sample: a roofing company). Header: logo left; primary nav (Home, Services, Areas,
About, Reviews, Blog); a prominent phone number and a "Get a Quote" button on the right.
"Services" opens a mega-menu listing services in a grid with a "View all services" link;
"Areas" opens a dropdown list of cities. Show the sticky condensed mobile header with a
hamburger that opens a full drawer, and a persistent bottom call bar (Call | Get a Quote)
on mobile. Footer: a sitemap-style multi-column layout with business name + blurb, NAP
(name/address/phone), hours, social icons, columns for Services / Service Areas / Company,
and a bottom legal row with license number, "Insured", and Privacy/Terms/Accessibility
links. High trust, high contrast, accessible.
```

## A0 done. The screens below render INSIDE this header/footer.

## A1. Home  -  route: `/`  [v1]
**Purpose:** convert local intent ("[service] near me") into a call/quote; rank for the city.
```
+----------------------------------------------------------------------+
|  HERO (full-bleed img)                                               |
|  {stars 4.9 (212)}                                                   |
|  H1: Tampa's Trusted Roofing Experts                                 |
|  Sub: Repairs, replacements & emergency service. Free estimates.    |
|  [ Get a Free Quote ]   [ Call (555) 123-4567 ]                     |
|  {badge: Licensed}  {badge: Insured}  {badge: 25 yrs}               |
|======================================================================|
|  TRUST BAR:  {as-seen / brand logos / financing available}          |
|======================================================================|
|  SERVICES (grid of cards)                                           |
|  [ {icon} Roof Repair ] [ Installation ] [ Emergency ] [ Maint. ]   |
|              each card: title, 1-line, "Learn more ->"              |
|======================================================================|
|  WHY US  | | |   3-4 value props w/ {icon} (Fast, Warranty, Local)  |
|======================================================================|
|  BEFORE / AFTER  << slider >>     +  short proof copy + [CTA]        |
|======================================================================|
|  REVIEWS  << 3 cards >>   {stars} "quote..." - Name, City           |
|======================================================================|
|  SERVICE AREA  (map)  + city chips: Tampa, St. Pete, Clearwater...  |
|======================================================================|
|  FAQ  > How much does a new roof cost?  > Do you offer financing?   |
|======================================================================|
|  FINAL CTA BAND:  Ready to start?  [ Get a Free Quote ] {phone}     |
|----------------------------------------------------------------------|
|  (Footer A0)                                                         |
+----------------------------------------------------------------------+
```
**Sections:** hero (rating + H1 + dual CTA + trust badges); trust bar; services grid; why-us; before/after; reviews; service-area + map; FAQ accordion; final CTA band. **Mobile:** hero CTAs stack full-width; services single column; reviews horizontal scroll. **Data:** services from niche catalog; reviews + rating live; cities from serviceAreas. **States:** if no reviews yet, hide reviews block (don't show empty).
**Paste-ready prompt:**
```
Design the HOME page for a local roofing company's marketing site (inside the header/
footer already designed). Top to bottom: (1) a full-bleed hero with a star rating, a
strong city-specific H1, one supporting line, two CTAs ("Get a Free Quote" primary,
"Call (555) 123-4567" secondary), and small trust badges (Licensed, Insured, 25 yrs);
(2) a slim trust bar (financing/brand logos); (3) a services grid of 4 cards (icon, name,
one line, "Learn more"); (4) a "why choose us" row of 3-4 value props with icons; (5) a
before/after image slider with a short proof line and a CTA; (6) a reviews row of 3 cards
with stars and attribution; (7) a service-area section with a map and clickable city
chips; (8) an FAQ accordion; (9) a final full-width CTA band with the quote button and
phone. Mobile-first, conversion-focused, trustworthy, lots of confident imagery.
```

## A2. About  -  route: `/about`  [v1]
**Purpose:** build trust - story, team, credentials.
```
+----------------------------------------------------------------------+
|  PAGE HERO: H1 "About [Business]"  + 1-line + breadcrumb            |
|======================================================================|
|  STORY  | (img)            |  Founded 1998... family-owned...        |
|======================================================================|
|  STATS:  @ 5,000+ roofs   @ 25 yrs   @ 4.9 stars   @ 100% insured   |
|======================================================================|
|  CREDENTIALS / BADGES:  {license} {GAF certified} {BBB} {insured}   |
|======================================================================|
|  TEAM  | | |  photo + name + role cards                             |
|======================================================================|
|  VALUES / GUARANTEE  copy block + {icon}                            |
|======================================================================|
|  CTA BAND  [ Get a Free Quote ]  {phone}                            |
+----------------------------------------------------------------------+
```
**Sections:** page hero + breadcrumb; story (text+image split); stats strip; credentials/certifications; team grid; values/guarantee; CTA band. **Mobile:** split sections stack; team 1-2 cols. **Data:** team + credentials per tenant (optional; hide team if none).
**Paste-ready prompt:**
```
Design an ABOUT page for the roofing company (inside the shared header/footer). Include a
page hero with breadcrumb and H1; a story section (text beside an image); a stats strip
(roofs completed, years, rating, insured); a credentials/certifications row of badges; a
team grid (photo, name, role); a values/guarantee block; and a closing CTA band. Warm,
credible, human; mobile-first with stacking sections.
```

## A3. Services index (menu)  -  route: `/services`  [v1]
**Purpose:** hub linking every service; captures "services" intent.
```
+----------------------------------------------------------------------+
|  PAGE HERO: H1 "Our Roofing Services" + 1-line + breadcrumb         |
|======================================================================|
|  SERVICES GRID (large cards)                                        |
|  [ (img) Roof Repair        ]   [ (img) Roof Installation    ]      |
|  [  desc + "Learn more ->"  ]   [  desc + "Learn more ->"     ]      |
|  [ (img) Emergency Service  ]   [ (img) Maintenance Plans     ]      |
|======================================================================|
|  NOT SURE? band: "Tell us what's wrong" [ Get a Free Quote ]        |
|======================================================================|
|  SERVICE AREA chips + map                                           |
+----------------------------------------------------------------------+
```
**Sections:** page hero + breadcrumb; large service cards (img, name, 2-line desc, link to detail); helper CTA band; service-area. **Mobile:** cards single column. **Data:** services from niche catalog.
**Paste-ready prompt:**
```
Design a SERVICES index/menu page for the roofing site (shared header/footer): page hero
with breadcrumb and H1, then a grid of large service cards (image, service name, two-line
description, "Learn more" link to the service detail page) for ~4 services, a helper CTA
band for unsure visitors, and a service-area section with city chips. Clean, scannable,
mobile-first.
```

## A4. Service detail (+ service+city "money page" variant)  -  routes: `/services/<service>` and `/<service>/<city>`  [v1]
**Purpose:** rank + convert for a specific service (and, in the money-page variant, a specific city).
```
+----------------------------------------------------------------------+
|  SERVICE HERO: breadcrumb > Services > Roof Repair                   |
|  H1: Roof Repair in Tampa        {stars}                            |
|  Sub + [ Get a Free Quote ]  [ Call ]    | (side: quick form card)  |
|======================================================================|
|  WHAT'S INCLUDED  * bullet * bullet * bullet   | (sticky quote form) |
|======================================================================|
|  OUR PROCESS  (1)->(2)->(3)->(4) steps with {icon}                  |
|======================================================================|
|  GALLERY  << before/after of this service >>                        |
|======================================================================|
|  REVIEWS (filtered to this service if available)                    |
|======================================================================|
|  SERVICE FAQ  > accordion specific to this service                  |
|======================================================================|
|  NEARBY AREAS we serve: Tampa, St. Pete...  (money-page: link siblings)|
|======================================================================|
|  CTA BAND                                                            |
+----------------------------------------------------------------------+
```
**Sections:** service hero (H1 includes city on money-page variant) + inline/sticky quote form; what's-included; process steps; gallery; service-filtered reviews; service FAQ; nearby areas / related links; CTA. **Money-page variant:** H1 = "[Service] in [City]", localized copy, breadcrumb includes city, internal links to sibling city pages; identical layout. **Mobile:** sticky quote form becomes a button that scrolls to/opens the form; steps stack. **Data:** city must be in serviceAreas (else 404). **States:** reviews/gallery hide if empty.
**Paste-ready prompt:**
```
Design a SERVICE DETAIL page for "Roof Repair" on the roofing site (shared header/footer).
Layout: a service hero with breadcrumb, H1 ("Roof Repair in Tampa"), star rating, intro,
and two CTAs, with a quote-request form card that is sticky beside the content on desktop;
then sections for "What's included" (checklist), "Our process" (numbered steps with icons),
a gallery/before-after slider, service-specific reviews, a service FAQ accordion, a "nearby
areas we serve" list of city links, and a closing CTA band. Also show the variant where the
H1 and copy are localized to a specific city. Mobile: the sticky form collapses to a button
that opens it. Conversion-focused, locally relevant, trustworthy.
```

## A5. Areas hub + Area (city) page  -  routes: `/areas`, `/areas/<city>`  [v1]
**Purpose:** local coverage + internal linking; rank for city terms.
```
AREAS HUB /areas                          AREA PAGE /areas/<city>
+-----------------------------+           +-----------------------------+
| PAGE HERO H1 "Areas We Serve"|          | HERO H1 "Roofing in Clearwater"|
| + map of region             |           | + breadcrumb + [Quote][Call] |
|=============================|           |==============================|
| CITY GRID                   |           | LOCAL INTRO copy + (map)     |
| [Tampa ->] [St. Pete ->]    |           |==============================|
| [Clearwater ->] [Brandon->] |           | SERVICES in this city (grid) |
|=============================|           |  links to /<service>/<city>  |
| CTA BAND                    |           |==============================|
+-----------------------------+           | REVIEWS from this area       |
                                          |==============================|
                                          | NEARBY CITIES + CTA BAND     |
                                          +------------------------------+
```
**Sections (hub):** hero + region map; city grid (each links to area page); CTA. **(Area page):** localized hero + dual CTA; local intro + map; services-in-city grid (link to money pages); area reviews; nearby cities; CTA. **Mobile:** grids single/two col. **Data:** cities from serviceAreas.
**Paste-ready prompt:**
```
Design two related pages for the roofing site: (1) an AREAS hub with a hero, a regional map,
and a grid of city cards that link onward; (2) a CITY page ("Roofing in Clearwater") with a
localized hero + CTAs, a short local intro beside a map, a grid of services offered in that
city (linking to service+city pages), reviews from that area, and a nearby-cities list with
a CTA band. Shared header/footer, mobile-first, locally trustworthy.
```

## A6. Gallery / portfolio  -  route: `/gallery`  [v1]
**Purpose:** proof of work.
```
+----------------------------------------------------------------------+
|  PAGE HERO H1 "Our Work" + filter chips: All | Repair | Replace      |
|======================================================================|
|  MASONRY GRID of project images  (click -> lightbox)                |
|  (img)(img)(img)                                                     |
|  (img)(img)(img)         [ Load more ]                              |
|======================================================================|
|  FEATURED BEFORE/AFTER  << slider >>                                 |
|======================================================================|
|  CTA BAND                                                            |
+----------------------------------------------------------------------+
```
**Sections:** hero + category filter chips; image grid w/ lightbox; featured before/after; CTA. **Mobile:** 2-col grid; lightbox swipeable. **Data:** media from tenant; **States:** empty -> show placeholder + CTA "work coming soon".
**Paste-ready prompt:**
```
Design a GALLERY/portfolio page for the roofing site (shared header/footer): a hero with
category filter chips, a responsive masonry image grid where tapping an image opens a
lightbox, a featured before/after slider, and a CTA band. Include the empty state. Visual,
fast, mobile-first with a 2-column grid on phones.
```

## A7. Reviews  -  route: `/reviews`  [v1]
**Purpose:** social proof + fresh content; rank for "[business] reviews".
```
+----------------------------------------------------------------------+
|  PAGE HERO H1 "Customer Reviews"                                    |
|  @ 4.9 avg   @ 212 reviews   {stars}   [ Leave a Review ]           |
|======================================================================|
|  FILTER: ( All v )  ( Rating v )  ( Service v )                     |
|======================================================================|
|  REVIEW LIST (cards)                                                 |
|  {stars} "Great crew, fast work..." - Sarah M., Tampa  | {Google}   |
|  {stars} "..." - John D., Clearwater                   | {Google}   |
|                         [ Load more ]                               |
|======================================================================|
|  CTA BAND                                                            |
+----------------------------------------------------------------------+
```
**Sections:** hero with aggregate rating + count + "Leave a Review"; filters; review cards (stars, text, name, city, source badge); CTA. **Mobile:** single column. **Data:** reviews + aggregate live; **States:** empty -> "Be our first review" + request CTA.
**Paste-ready prompt:**
```
Design a REVIEWS page for the roofing site (shared header/footer): a hero showing the
average rating, total count, stars, and a "Leave a Review" button; filter controls
(rating, service); a list of review cards (stars, quote, reviewer name + city, source
badge like Google); a load-more; and a CTA band. Include the empty state. Trustworthy and
clean, mobile-first.
```

## A8. Blog index + Blog post  -  routes: `/blog`, `/blog/<slug>`  [v1 scaffold]
**Purpose:** SEO content engine (VA-fed).
```
BLOG INDEX /blog                          BLOG POST /blog/<slug>
+-----------------------------+           +-----------------------------+
| HERO H1 "Roofing Tips"      |           | breadcrumb > Blog > Title   |
|=============================|           | H1 Title                    |
| FEATURED post (big card)    |           | by Author . date . 5 min    |
|=============================|           | (cover img)                 |
| POST GRID                   |           |=============================|
| [card][card][card]          |           | ARTICLE BODY (prose)        |
| img+title+excerpt+date      |           |  h2 / p / list / image      |
|        [ More ]             |           |  (readable measure)         |
|=============================|           |=============================|
| (sidebar opt: categories)   |           | CTA inline: get a quote     |
+-----------------------------+           |=============================|
                                          | RELATED posts (3)           |
                                          |  + CTA BAND                 |
                                          +-----------------------------+
```
**Sections (index):** hero; featured post; post grid (img, title, excerpt, date); pagination; optional categories. **(Post):** breadcrumb + title + byline/meta + cover; prose body (constrained measure, h2/p/lists/images); inline CTA; related posts; CTA band. **Mobile:** single column; comfortable reading width. **Data:** `posts` table. **States:** index empty -> hide grid, show "articles coming soon".
**Paste-ready prompt:**
```
Design two blog screens for the roofing site (shared header/footer): (1) a BLOG INDEX with
a hero, one featured post card, and a grid of post cards (image, title, excerpt, date) with
pagination; (2) a BLOG POST with breadcrumb, title, author/date/read-time byline, cover
image, a clean readable article body (headings, paragraphs, lists, inline images at a
comfortable measure), an inline quote CTA, related posts, and a CTA band. Editorial,
legible, mobile-first.
```

## A9. FAQ  -  route: `/faq`  [v1]
**Purpose:** objection handling + long-tail SEO.
```
+----------------------------------------------------------------------+
|  PAGE HERO H1 "Frequently Asked Questions" + [ search faq ]         |
|======================================================================|
|  CATEGORY TABS (optional): General | Pricing | Process               |
|======================================================================|
|  ACCORDION                                                          |
|  > How much does a new roof cost?                                   |
|  > Do you offer financing?                                          |
|  > How long does a replacement take?           (expanded shows ans) |
|======================================================================|
|  STILL HAVE QUESTIONS? [ Contact us ] {phone}                       |
+----------------------------------------------------------------------+
```
**Sections:** hero + optional search; optional category tabs; accordion Q/A; contact CTA. **Mobile:** full-width accordion. **Data:** FAQ from config (emits FAQPage schema). **States:** search no-match -> "no results, contact us".
**Paste-ready prompt:**
```
Design an FAQ page for the roofing site (shared header/footer): a hero with an optional
search field, optional category tabs, an accordion of question/answer rows (one expanded
to show the answer style), and a "still have questions" contact CTA. Clean, calm,
mobile-first.
```

## A10. Contact  -  route: `/contact`  [v1]
**Purpose:** primary conversion surface.
```
+----------------------------------------------------------------------+
|  PAGE HERO H1 "Contact Us" + 1-line                                 |
|======================================================================|
|  | CONTACT FORM card          |  | INFO panel                  |    |
|  | [ Name....... ]            |  | {phone} (555) 123-4567      |    |
|  | [ Phone...... ]            |  | {email} hello@biz.com       |    |
|  | [ Email...... ]            |  | {pin} 123 Main St, Tampa    |    |
|  | ( Service v )              |  | Hours: M-F 8-6, Sat 9-2     |    |
|  | [ Message............... ] |  | (map embed)                 |    |
|  | [ Request a Quote ]        |  | {social}                    |    |
+----------------------------------------------------------------------+
```
**Sections:** hero; two-column split: form (name/phone/email/service/message + submit) and info (phone tap-to-call, email, address, hours, map, social). **Mobile:** form first, info below; map full-width. **Data:** posts to `/api/lead` (creates lead + fires notification). **States:** success -> inline confirmation ("Thanks - we'll call you shortly"); validation inline; submit disabled while sending.
**Paste-ready prompt:**
```
Design a CONTACT page for the roofing site (shared header/footer): a hero, then a two-
column layout - a contact/quote form (name, phone, email, service select, message,
"Request a Quote" button) and an info panel (click-to-call phone, email, address, hours,
a map embed, social). Show the post-submit success confirmation and inline validation.
Mobile: form first, info below. Conversion-focused, trustworthy.
```

## A11. Booking  -  route: `/book`  [P2] (appointment niches)
**Purpose:** let appointment businesses (dental, salon) take bookings on the site.
```
+----------------------------------------------------------------------+
|  H1 "Book an Appointment"   step 1 of 3                             |
|  [ 1 Service ]--[ 2 Time ]--[ 3 Details ]   (stepper)              |
|======================================================================|
|  STEP 1 Service: ( o ) Cleaning  ( o ) Exam  ( o ) Whitening        |
|  STEP 2 Time:  < June 2026 >  calendar grid; then time slots chips  |
|  STEP 3 Details: [ Name ][ Phone ][ Email ][ Notes ]  [ Confirm ]   |
|======================================================================|
|  CONFIRMATION: {check} Booked! Tue Jun 16, 10:00 AM + add to cal    |
+----------------------------------------------------------------------+
```
**Sections:** stepper; step 1 service select; step 2 date calendar + time-slot chips; step 3 contact details (+ optional deposit); confirmation screen. **Mobile:** one step per screen, big tap targets. **Data:** availability + appointments tables. **States:** no slots -> "no times this day"; deposit (optional) -> Stripe.
**Paste-ready prompt:**
```
Design a multi-step BOOKING flow for an appointment business (sample: a dental clinic),
inside the shared header/footer. Three steps with a stepper: (1) choose a service, (2)
pick a date on a month calendar then a time-slot chip, (3) enter contact details (and an
optional deposit). Then a confirmation screen with the booked time and an "add to calendar"
action. Mobile-first with one step per screen and large tap targets; friendly and simple.
```

## A12. Financing / Offers  -  routes: `/financing`, `/offers`  [v1*]
**Purpose:** trades upsell / promotions.
```
+----------------------------------------------------------------------+
|  OFFER HERO: "0% Financing for 12 Months"  [ Get Pre-Qualified ]    |
|======================================================================|
|  HOW IT WORKS  (1)->(2)->(3)                                        |
|  PLANS / TERMS  | | | cards                                         |
|  FINE PRINT / disclosures                                           |
|  CTA BAND                                                            |
+----------------------------------------------------------------------+
```
**Sections:** offer hero + CTA; how-it-works steps; plan/term cards; disclosures; CTA. **Mobile:** stack. **States:** static content.
**Paste-ready prompt:**
```
Design a FINANCING/offers page for the roofing site (shared header/footer): an offer hero
("0% financing for 12 months") with a CTA, a how-it-works steps row, plan/term cards, a
fine-print disclosures block, and a CTA band. Clear and credible, mobile-first.
```

## A13. Legal + 404  -  routes: `/privacy`, `/terms`, `/accessibility`, 404  [v1]
```
LEGAL (doc template)                       404
+-----------------------------+            +-----------------------------+
| H1 Privacy Policy           |            | Big "404"                   |
| updated date                |            | "Page not found"            |
| prose: h2 sections + lists  |            | [ Go home ] [ Call us ]     |
| (constrained measure, TOC?) |            | quick links: Services/Areas |
+-----------------------------+            +-----------------------------+
```
**Sections:** legal = simple typographic doc (title, updated date, sectioned prose, optional jump-links). 404 = friendly branded recovery with home/call CTAs + quick links (keeps header/footer). **Mobile:** readable width.
**Paste-ready prompt:**
```
Design two utility pages for the roofing site (shared header/footer): (1) a LEGAL document
template (title, "last updated" date, clean sectioned prose with headings and lists at a
readable width, optional jump-links); (2) a friendly branded 404 with a large "404", a
short message, "Go home" and "Call us" buttons, and quick links to Services/Areas.
```

**End of PART A.** Per-niche content differs but structure holds. Generated pages (service+city, area) reuse A4/A5.

---

# PART B - Tenant (client) console (Surface C)

Style note: calm, data-dense but scannable; the owner should grasp "calls + money + reputation" in 5 seconds. Big numbers, clear status colors (new/won/lost, paid/overdue), few accents, generous spacing. Mobile-first - many owners check on a phone.

## B0. App shell + auth  -  `[v1]`
**Purpose:** consistent navigation + tenant/org context for every console screen.
```
DESKTOP shell                                    MOBILE shell
+-----------------------------------------+      +--------------------------+
| [Logo]  Summit Roofing (v)      {bell} @|      | = Summit Roofing  {bell} |
|---------+-------------------------------|      +--------------------------+
| {home} Dashboard  | <screen content>   |      |   <screen content>       |
| {inbox} Leads (3) |                     |      |                          |
| {chat} Requests   |                     |      +--------------------------+
| {star} Reviews    |                     |      |{home}{inbox}{+}{star}{..}| bottom tabs
| {card} Invoices   |                     |      +--------------------------+
| {receipt} Expenses|                     |        (+ = quick create sheet)
| {chart} Reports   |                     |
| {gear} Settings   |                     |
+-----------------------------------------+
```
**Sections:** left sidebar (desktop) / bottom tab bar (mobile) with primary nav + badges (e.g., new-lead count); topbar with business name (read-only context; operator sees a switcher), notifications bell, account menu. Quick-create (+) on mobile -> sheet: New invoice / Add receipt / Request a change. **Auth screens:** sign-in (email + magic link / password via Clerk), invite-accept, and an empty "no access" state. **States:** loading skeletons; offline banner. 
**Paste-ready prompt:**
```
Design the CLIENT CONSOLE app shell for "Platform" (a non-technical local-business owner is
the user). Desktop: a left sidebar with the product logo, the business name as context at
top, and primary nav items with icons - Dashboard, Leads (with a count badge), Requests,
Reviews, Invoices, Expenses, Reports, Settings - plus a topbar with a notifications bell and
an account menu. Mobile: a bottom tab bar (Dashboard, Leads, a center "+" quick-create,
Reviews, More) and a top bar with the business name and bell; the "+" opens a sheet with
"New invoice / Add receipt / Request a change". Also design the sign-in screen (email +
magic-link), an invite-accept screen, and loading skeletons. Calm, modern, accessible,
mobile-first.
```

## B1. Dashboard (home)  -  route: `/`  [v1]
**Purpose:** the "is this worth it?" screen - leads, ROI, reviews, money at a glance.
```
+----------------------------------------------------------------------+
| Good morning, Mike.            This month (v)            {date range}|
|----------------------------------------------------------------------|
| @ LEADS        | @ CALLS        | @ REVIEWS     | @ EST. PIPELINE     |
|   23  ^15%     |  14 (2 missed) |  4.9  +0.1    |   ~$48,000          |
|   sparkline    |  sparkline     |  +6 new       |   from 23 leads     |
|----------------------------------------------------------------------|
| RECENT LEADS (mini list)            |  WHAT'S NEW FROM YOUR TEAM     |
|  {new}  Sarah M.  form  2h  ->      |  * Published: new gallery imgs |
|  {won}  John D.   call  1d  ->      |  * Monthly report ready  ->    |
|  {dot}  ...                          |  * 2 reviews responded         |
|  [ View all leads ]                 |                                |
|----------------------------------------------------------------------|
| QUICK ACTIONS:  [Request a change] [Send review requests] [Invoice]  |
|----------------------------------------------------------------------|
| MONEY (if invoicing on): Outstanding $3,200 | Next retainer Jul 1    |
+----------------------------------------------------------------------+
```
**Sections:** greeting + period selector; KPI cards (leads w/ trend + sparkline; calls w/ missed; reviews rating + new count; estimated pipeline value); recent leads mini-list (status dot, name, source, age) + view-all; "what's new from your team" (published changes, report ready, review responses); quick actions; money strip (outstanding invoices + next retainer date). **Mobile:** KPI cards 2x2 then sections stack; quick actions in the + sheet. **Data:** all per-tenant + period. **States:** new tenant w/ no data -> friendly onboarding checklist instead of zeros ("Connect your number, set who gets lead alerts, ...").
**Paste-ready prompt:**
```
Design the CLIENT CONSOLE DASHBOARD (inside the app shell). A greeting and a period selector
at top; a row of KPI cards - Leads (count, % trend, sparkline), Calls (count, missed count),
Reviews (rating, change, new count), and Estimated Pipeline ($ value, "from N leads"); a
"recent leads" mini-list with status dots, name, source, and age plus a "view all"; a
"what's new from your team" feed (published changes, "monthly report ready", review
responses); a quick-actions row (Request a change, Send review requests, Create invoice);
and a money strip (outstanding invoices, next retainer date). Also design the first-run
empty state as a setup checklist instead of zeros. Big readable numbers, calm, scannable,
mobile-first (KPIs as a 2x2 grid on phones).
```

## B2. Leads list (inbox + pipeline)  -  route: `/leads`  [v1]
**Purpose:** see and work every lead.
```
+----------------------------------------------------------------------+
| Leads                              [ + Add lead ]   ( Export v )     |
| ::: All ::: New(3) | Contacted | Quoted | Won | Lost   (status tabs) |
| [ search ]   ( Source v )  ( Date v )                                |
|----------------------------------------------------------------------|
| {new}  Sarah M.      form   "Need roof repair..."   $2,500   2h   >  |
| {new}  (no name)     call   inbound call            -        3h   >  |
| {cont} John D.       form   "Quote for..."          $8,000   1d   >  |
| {won}  Lisa R.       call   ...                      $6,200   3d   >  |
| {lost} ...                                                           |
|----------------------------------------------------------------------|
|                         [ Load more ]                               |
+----------------------------------------------------------------------+
   (toggle: List view  /  Pipeline board view)
PIPELINE (kanban) alt:
| New(3)      | Contacted(2) | Quoted(4)  | Won(8)     | Lost(1)       |
| [card]      | [card]       | [card]     | [card]     | [card]        |
```
**Sections:** title + add-lead + export; status tabs w/ counts; filters (search, source, date); rows (status chip, name/placeholder, source icon, snippet, value, age, chevron) OR kanban board (drag between stages); load-more/pagination. **Mobile:** list of stacked cards; status as colored left border; pipeline = horizontally scrollable columns. **Data:** leads + status + value + source. **States:** empty -> "No leads yet - they'll appear here the moment someone calls or submits your form."
**Paste-ready prompt:**
```
Design the LEADS list for the client console (inside the app shell). Top: title, "Add lead",
and an Export menu; status tabs with counts (All, New, Contacted, Quoted, Won, Lost);
filters (search, source, date). Then a list of lead rows: status chip/colored marker,
name (or "no name"), source icon (form/call), message snippet, estimated value, age, and a
chevron. Include a toggle to a Kanban PIPELINE board view with draggable cards across the
five stages. Show the empty state. Mobile: stacked cards with a colored status edge; the
pipeline scrolls horizontally. Calm, scannable, clear status colors.
```

## B3. Lead detail  -  route: `/leads/<id>`  [v1]
**Purpose:** work a single lead - contact, status, notes, timeline, convert.
```
+----------------------------------------------------------------------+
| < Back   Sarah M.   {new}                  ( Status: New  v )       |
|----------------------------------------------------------------------|
| | CONTACT / ACTIONS            |  | ACTIVITY TIMELINE              | |
| | {phone} (555) 222-1111       |  |  o Lead created - form  2h     | |
| |   [ Call ]  [ Text ]         |  |  o You called           1h     | |
| | {email} sarah@x.com [Email]  |  |  o Note: "left vm"      1h     | |
| | Source: Website form         |  |  o Status -> Contacted   1h    | |
| | Page: /roof-repair/tampa     |  |  ...                           | |
| | Est. value [ $2,500    ]     |  |--------------------------------| |
| | Message:                     |  |  [ Add a note............... ] | |
| | "Need roof repair after..."  |  |                       [ Save ] | |
| |------------------------------|  |--------------------------------| |
| | [ Mark Won ]  [ Mark Lost ]  |  |  WHEN WON: [ Send review req ] | |
| |                              |  |            [ Create invoice ]  | |
+----------------------------------------------------------------------+
```
**Sections:** header (name, status chip, status selector); left = contact + actions (call/text/email, source, page attribution, editable value, message, won/lost); right = activity timeline + add-note composer + on-won actions (send review request, create invoice). **Mobile:** stacked - actions first, timeline below; sticky call/text bar. **Data:** lead + lead_activities + calls/messages. **States:** call lead w/ no name shows phone as title; won reveals review/invoice CTAs.
**Paste-ready prompt:**
```
Design the LEAD DETAIL screen for the client console (inside the app shell). Header with the
lead name, a status chip, and a status dropdown (New/Contacted/Quoted/Won/Lost). Two
columns: left = contact + actions (click-to-call, click-to-text, email, the source and which
page it came from, an editable estimated value, the message, and Mark Won / Mark Lost
buttons); right = an activity timeline (created, calls, notes, status changes) with an
"add a note" composer, and - when the lead is Won - quick actions to "Send review request"
and "Create invoice". Mobile: stack with actions first and a sticky call/text bar. Clear,
efficient, friendly.
```

## B4. Requests list  -  route: `/requests`  [v1]
**Purpose:** the client's change requests to the agency, with status.
```
+----------------------------------------------------------------------+
| Requests                                   [ + New request ]        |
| ::: Open ::: | Completed                                            |
|----------------------------------------------------------------------|
| {dot} Update business hours        in progress    VA: Mia    2d  >  |
| {dot} Swap hero photo              preview ready   {!}        1d  >  |
| {dot} Add financing page           queued                    4h  >  |
| {ok}  Fix typo on About            published                 1w  >  |
+----------------------------------------------------------------------+
```
**Sections:** title + new-request; open/completed tabs; rows (title, status pill [queued/in-progress/preview-ready/approved/published], assignee, age, attention dot when preview ready). **Mobile:** stacked cards. **Data:** change_requests. **States:** empty -> "Need a change to your site? Request it here and we'll handle it."
**Paste-ready prompt:**
```
Design the REQUESTS list for the client console (inside the app shell): title and "New
request", Open/Completed tabs, and a list of request rows showing title, a status pill
(Queued, In progress, Preview ready, Approved, Published), the assigned team member, age,
and an attention indicator when a preview is ready for approval. Include the empty state.
Calm and reassuring, mobile-first.
```

## B5. Request create + Request detail (preview/approve)  -  routes: `/requests/new`, `/requests/<id>`  [v1]
**Purpose:** submit a change; review the agency's preview and approve -> publish.
```
NEW REQUEST                                REQUEST DETAIL
+-----------------------------+            +-----------------------------+
| New request                 |            | < Back  Swap hero photo     |
| Type ( v ) Content/Photo/.. |            |  status: Preview ready {!}  |
| Target page ( v ) Home/...  |            |-----------------------------|
| [ Describe what you want.. ]|            | THREAD                      |
| Attach: [ + files ]         |            |  You: "Use the new photo"   |
|   (img)(file)               |            |  Mia: "Preview is ready:"   |
| [ Submit request ]          |            |  [ Open preview -> ]        |
+-----------------------------+            |   (preview thumbnail)       |
                                           |-----------------------------|
                                           | [ Approve & publish ]       |
                                           | [ Request changes ]         |
                                           |-----------------------------|
                                           | [ reply............. ][send]|
                                           +-----------------------------+
```
**Sections (new):** type select; target-page select; description; attachments; submit. **(detail):** header + status; comment thread; preview link + thumbnail when ready; Approve&Publish / Request-changes; reply composer. **Mobile:** single column; approve button sticky. **Data:** change_requests + attachments + link to a draft/preview. **States:** before preview -> no approve button; after publish -> "Published" confirmation + link to live page. **Note:** approving here triggers the existing publish flow (operator-built).
**Paste-ready prompt:**
```
Design two screens for the client console (inside the app shell): (1) NEW REQUEST - a form
with a request type select, a target-page select, a description field, file attachments,
and a submit button; (2) REQUEST DETAIL - a header with title and status, a comment thread
between the owner and the assigned team member, a "preview ready" state showing an "Open
preview" link with a thumbnail, primary "Approve & publish" and secondary "Request changes"
buttons, and a reply composer. Show the pre-preview state (no approve button) and the post-
publish confirmation. Mobile: single column with a sticky approve action. Reassuring and
simple.
```

## B6. Billing & receipts (the agency retainer)  -  route: `/billing`  [v1]
**Purpose:** the client's view of their own subscription + downloadable receipts.
```
+----------------------------------------------------------------------+
| Billing                                                             |
|----------------------------------------------------------------------|
| PLAN CARD:  Growth - $649/mo   {active}                             |
|   Next charge Jul 1 . Visa ****6411 [ Update payment ]             |
|   What's included: leads, reviews, monthly report, ... [ Change ]  |
|----------------------------------------------------------------------|
| INVOICES / RECEIPTS                                                 |
|  Jun 1, 2026   $649.00   Paid     [ PDF ]                          |
|  May 1, 2026   $649.00   Paid     [ PDF ]                          |
|  ...                                                                |
|----------------------------------------------------------------------|
| (past-due variant) {!} Payment failed - update card to avoid pause |
+----------------------------------------------------------------------+
```
**Sections:** plan card (tier, price, status badge, next charge, payment method + update via Stripe portal, included features, change-plan); invoice/receipt history (date, amount, status, PDF download); past-due banner variant. **Mobile:** cards stack; table -> rows. **Data:** subscriptions + Stripe invoices. **States:** not configured (no Stripe) -> "Billing isn't set up yet"; past_due -> banner + update prompt.
**Paste-ready prompt:**
```
Design the BILLING screen for the client console (inside the app shell): a plan card showing
the tier and monthly price, an "active" status badge, next charge date, the saved card with
an "Update payment" button, the included features, and a "Change plan" link; below it, an
invoices/receipts history list (date, amount, Paid status, "PDF" download). Also show the
past-due variant with a warning banner and an update-card prompt, and the "billing not set
up" empty state. Trustworthy and clear, mobile-first.
```

## B7. Client invoicing (invoice YOUR customers, Stripe Connect)  -  routes: `/invoices`, `/invoices/new`, `/invoices/<id>`  [P2]
**Purpose:** the stickiest tool - the business bills its own customers and gets paid.
```
INVOICES LIST                              NEW / EDIT INVOICE
+-----------------------------+            +-----------------------------+
| Invoices     [ + New ]      |            | New invoice                 |
| @ Outstanding $3,200        |            | Customer [ name / select ]  |
| @ Paid (30d) $9,400         |            | [ + line item ]             |
|-----------------------------|            |  Desc        Qty  Price  Amt|
| #1042 Acme  $1,200  overdue |            |  Roof repair  1  $1200 $1200|
| #1041 J. Doe $800   paid    |            |  ...                        |
| #1040 ...    sent           |            | Tax [ ] . Notes [ ...... ]  |
| (status pills)              |            | Total: $1,200               |
+-----------------------------+            | [ Send invoice ] [ Save ]   |
                                           +-----------------------------+
CONNECT ONBOARDING (first run): "Get paid by card/ACH" [ Set up payouts -> Stripe ]
INVOICE DETAIL: status timeline (sent/viewed/paid) + [ Send reminder ] + hosted pay link
```
**Sections:** list (outstanding/paid KPIs + rows w/ status pills); create/edit (customer, line items, tax, notes, total, send/save); Connect onboarding gate (first run, "set up payouts" -> Stripe); detail (status timeline, reminder, pay link, record partial payment). **Mobile:** list cards; line items stack. **Data:** client_invoices + items + connect_accounts. **States:** not onboarded -> Connect CTA; overdue highlighted; payment via Stripe (Platform never handles card data).
**Paste-ready prompt:**
```
Design the CLIENT INVOICING tool for the console (the business invoices its own customers).
Three screens: (1) INVOICES list with "Outstanding" and "Paid (30d)" KPI tiles and invoice
rows (number, customer, amount, status pill: Draft/Sent/Viewed/Paid/Overdue), plus "New";
(2) NEW/EDIT invoice with a customer field, repeatable line items (description, qty, price,
amount), tax toggle, notes, a running total, and Send/Save; (3) INVOICE detail with a
status timeline (sent -> viewed -> paid), a "Send reminder" button, and a hosted pay link.
Also design the first-run Stripe Connect onboarding card ("Get paid by card or ACH - set up
payouts"). Mobile-first, clean, money-clear with strong overdue emphasis.
```

## B8. Expenses & receipts (records for the bookkeeper)  -  routes: `/expenses`, `/expenses/new`  [P2]
**Purpose:** capture/organize receipts; export for the accountant. (Records, NOT tax advice.)
```
EXPENSES LIST                              ADD EXPENSE
+-----------------------------+            +-----------------------------+
| Expenses    [ + Add ]  (Exp)|            | Add expense                 |
| @ This month $4,210         |            | [ Snap / upload receipt ]   |
| ( Category v )( Month v )    |            |   (receipt img preview)     |
|-----------------------------|            | Vendor [ Home Depot      ]  |
| Jun 12 Home Depot $312 Mat. |            | Amount [ $312.40         ]  |
|  (thumb) materials          |            | Date   [ Jun 12, 2026    ]  |
| Jun 10 Shell    $88  Fuel   |            | Category ( Materials v )    |
| Jun 09 ...                  |            | Method ( Card v ) Note [..] |
| [ Export CSV ] [ PDF pack ] |            | [ Save ]                    |
+-----------------------------+            +-----------------------------+
| disclaimer: "Records for your bookkeeper. Not tax advice."          |
```
**Sections:** list (month total KPI, filters, rows w/ thumbnail + vendor + amount + category, export CSV / PDF pack); add (receipt capture/upload + preview, vendor, amount, date, category, method, note, save - optional OCR prefill); persistent "records, not tax advice" disclaimer. **Mobile:** camera-first capture; list cards. **Data:** expenses + media. **States:** empty -> "Snap your first receipt"; OCR (later) prefills fields.
**Paste-ready prompt:**
```
Design the EXPENSES/receipts tool for the console (records for a bookkeeper - NOT tax
advice; show that disclaimer). Two screens: (1) EXPENSES list with a "This month" total
tile, category/month filters, rows with a receipt thumbnail, vendor, amount, and category,
and "Export CSV" / "PDF pack" actions; (2) ADD EXPENSE with a prominent "snap or upload
receipt" capture and image preview, then vendor, amount, date, category select, payment
method, and note fields with Save. Mobile-first and camera-friendly; include the empty
state. Clean and trustworthy.
```

## B9. Reviews (reputation engine)  -  route: `/reviews`  [P2]
**Purpose:** request, monitor, respond; grows Google rating + feeds the site.
```
+----------------------------------------------------------------------+
| Reviews          @ 4.9 avg  @ 212 total  @ +6 this month            |
|                                   [ Send review requests ]          |
| ::: All ::: | Needs response(2) | Requests sent                     |
|----------------------------------------------------------------------|
| {google} {stars} "Great crew..." - Sarah M.  2d                     |
|   [ Reply ]   (reply box expands; templates v)                      |
| {google} {stars 2} "Late..." - Anon  {needs response!}              |
|   [ Reply ]                                                         |
|----------------------------------------------------------------------|
| REQUESTS SENT: Sarah (clicked) . John (sent) . Lisa (completed)     |
+----------------------------------------------------------------------+
SEND REQUESTS sheet: pick won leads / enter contact -> SMS/email template -> [ Send ]
```
**Sections:** header KPIs + send-requests; tabs (all / needs-response / requests-sent); review cards (source, stars, text, author, age, reply action with templates); negative reviews flagged; requests-sent tracker; send-requests sheet (select won leads or enter contacts, choose channel + template, send). **Mobile:** cards stack; reply inline. **Data:** reviews + review_requests. **States:** empty -> "Start collecting reviews" + send CTA; negative -> highlighted + fast-response nudge.
**Paste-ready prompt:**
```
Design the REVIEWS tool for the console: a header with rating/total/"new this month" KPIs
and a "Send review requests" button; tabs (All, Needs response, Requests sent); review cards
showing source badge (Google), stars, text, author, age, and a "Reply" action that expands
a reply box with template options - with low-star reviews flagged as "needs response"; and a
"requests sent" tracker (sent / clicked / completed). Also design the "send review requests"
sheet (pick won customers or enter contacts, choose SMS/email + a template, send). Include
the empty state. Reputation-focused, calm, mobile-first.
```

## B10. Reports (monthly performance)  -  routes: `/reports`, `/reports/<period>`  [P2]
**Purpose:** the retainer justifier - results + work done, monthly.
```
REPORTS LIST                               REPORT DETAIL (Jun 2026)
+-----------------------------+            +-----------------------------+
| Reports                     |            | < Back  June 2026   [ PDF ] |
|-----------------------------|            | SUMMARY: 23 leads, ~$48k    |
| June 2026     ready   ->    |            |  pipeline for $649 retainer |
| May 2026      ready   ->    |            |-----------------------------|
| April 2026    ready   ->    |            | LEADS chart (by source)     |
+-----------------------------+            | CALLS answered/missed       |
                                           | REVIEWS rating trend +6     |
                                           | TRAFFIC + top pages         |
                                           | RANKINGS (keyword moves)    |
                                           |-----------------------------|
                                           | "WHAT WE DID THIS MONTH"    |
                                           |  * published 4 pages ...    |
                                           |  * responded to 6 reviews   |
+----------------------------------------------------------------------+
```
**Sections:** list of monthly reports (period, status, open); detail = headline ROI summary, then charts/sections (leads by source, calls, review trend, traffic + top pages, keyword rankings) and a plain-language "what we did this month" narrative; PDF export. **Mobile:** single column; charts simplified. **Data:** reports payload. **States:** none yet -> "Your first report arrives at month end."
**Paste-ready prompt:**
```
Design the monthly REPORTS feature for the console: (1) a REPORTS list of monthly entries
(period, "ready" status, open); (2) a REPORT detail page opening with a plain-language ROI
summary ("23 leads, ~$48k estimated pipeline for your $649 retainer"), then sections with
simple charts - leads by source, calls answered vs missed, review rating trend, traffic and
top pages, keyword ranking movement - and a friendly "what we did this month" narrative list,
plus a PDF export. Mobile-first with simplified charts. Make it feel like clear proof of
value, not a data dump.
```

## B11. Booking management  -  route: `/appointments`  [P2] (appointment niches)
**Purpose:** the in-console side of A11 bookings.
```
+----------------------------------------------------------------------+
| Appointments        [ Today ] [ Week ] [ Month ]   [ + Add ]        |
|----------------------------------------------------------------------|
| (calendar or agenda list)                                           |
|  Tue Jun 16  10:00  Cleaning - Sarah M.  {confirmed}                |
|              13:30  Exam - John D.       {booked}                   |
|  Wed Jun 17  ...                                                    |
|----------------------------------------------------------------------|
| AVAILABILITY settings link . Reminders: on (SMS 24h before)         |
+----------------------------------------------------------------------+
```
**Sections:** view toggle (today/week/month) + add; agenda/calendar of appointments (time, service, customer, status); availability settings entry; reminder status. **Mobile:** agenda list default. **Data:** appointments + availability. **States:** empty day -> "No appointments"; manage availability screen (hours, slot length, buffers).
**Paste-ready prompt:**
```
Design the APPOINTMENTS management screen for the console (appointment niche): a today/week/
month toggle and "Add", an agenda or calendar list of bookings (time, service, customer
name, status chip), a link to availability settings, and a reminders status line. Include
the empty state and a simple availability settings view (working hours, slot length,
buffers). Mobile-first with an agenda list default. Calm and operational.
```

## B12. Site appearance / profile (safe-field editing)  -  route: `/site`  [v1*]
**Purpose:** let the client edit safe fields directly; route structural changes to a request.
```
+----------------------------------------------------------------------+
| Your Site            [ View live site -> ]                          |
| ::: Basics ::: | Photos | Hours | Services                          |
|----------------------------------------------------------------------|
| BASICS (auto-publish safe fields)                                   |
|  Phone   [ (555) 123-4567 ]                                         |
|  Email   [ hello@biz.com   ]                                       |
|  Address [ 123 Main St...   ]                                      |
|  Social  [ fb ][ ig ][ ... ]                                       |
|  Holiday banner [ on ] [ message...... ]                           |
|  [ Save changes ]   (saved -> "Live in a few minutes")             |
|----------------------------------------------------------------------|
| PHOTOS: gallery grid, drag to reorder, [ + upload ], delete         |
|----------------------------------------------------------------------|
| STRUCTURAL (copy, services, layout):                                |
|  "Want to change wording, services, or layout?"                    |
|  [ Request a change ] -> goes to B5                                 |
+----------------------------------------------------------------------+
```
**Sections:** view-live link; tabs (basics/photos/hours/services); basics = safe auto-publish fields (phone, email, address, social, holiday banner) + save; photos = gallery manage (upload/reorder/delete); hours editor; a clear hand-off to "Request a change" for structural edits. **Mobile:** stacked; tab bar. **Data:** writes safe tenant/config fields; validated by existing Zod. **States:** save confirmation ("live in a few minutes"); structural edits never auto-publish.
**Paste-ready prompt:**
```
Design the "Your Site" appearance screen for the console, where a non-technical owner can
edit only SAFE fields directly. A "View live site" link and tabs (Basics, Photos, Hours,
Services). Basics: editable phone, email, address, social links, and a toggleable holiday
banner with a Save button and a "live in a few minutes" confirmation. Photos: a gallery grid
with upload, drag-reorder, and delete. Hours: a simple weekly hours editor. Then a clearly
separated card explaining that wording/services/layout changes go through "Request a change"
(button). Mobile-first, friendly, guardrailed.
```

## B13. Notification settings  -  route: `/settings/notifications`  [v1]
**Purpose:** who gets alerted, on which channel, for which events. (Directly powers the notifications spine.)
```
+----------------------------------------------------------------------+
| Notifications                                                       |
|----------------------------------------------------------------------|
| RECIPIENTS                                                          |
|  Alert email  [ owner@biz.com           ]                          |
|  Alert phone  [ (555) 123-4567          ]  (for SMS)               |
|----------------------------------------------------------------------|
| WHAT TO SEND ME            Email   SMS                              |
|  New lead                  [x]     [x]                             |
|  Missed call               [x]     [x]                             |
|  New / negative review     [x]     [ ]                             |
|  Invoice paid              [x]     [ ]                             |
|  Appointment booked        [x]     [x]                             |
|  Monthly report ready      [x]     [ ]                             |
|----------------------------------------------------------------------|
| Quiet hours [ 9pm ]-[ 7am ]   [ Save ]                             |
+----------------------------------------------------------------------+
```
**Sections:** recipients (alert email + alert phone -> these set the tenant `notify_email`/`notify_phone`); per-event channel matrix (email/SMS toggles); quiet hours; save. **Mobile:** matrix becomes per-event rows with two toggles. **Data:** tenant notify fields (+ a prefs table later). **States:** if SMS not configured platform-wide, show "SMS coming soon" note; saving updates recipients used by lead alerts.
**Paste-ready prompt:**
```
Design the NOTIFICATIONS settings screen for the console: a "Recipients" section with an
alert email and an alert phone (for SMS); a "What to send me" matrix of events (New lead,
Missed call, New/negative review, Invoice paid, Appointment booked, Monthly report ready)
each with Email and SMS toggles; a quiet-hours range; and Save. Mobile: each event becomes a
row with two toggles. Simple and clear - this controls the instant lead alerts.
```

## B14. Account & data  -  route: `/settings`  [v1]
**Purpose:** team, account, export.
```
+----------------------------------------------------------------------+
| Settings   ::: Account ::: | Team | Notifications | Data            |
|----------------------------------------------------------------------|
| ACCOUNT: name, email, password (Clerk), sign out                   |
| TEAM (client_admin only): list members + role; [ Invite ]          |
|   owner@biz.com  Admin                                             |
|   office@biz.com Staff   [ remove ]                                |
| DATA: [ Export leads CSV ] [ Invoices ] [ Expenses ] [ Reviews ]   |
+----------------------------------------------------------------------+
```
**Sections:** tabbed settings; account (profile/password via Clerk, sign out); team (members + roles + invite/remove, admin-only); data export buttons. **Mobile:** stacked. **Data:** memberships + export endpoints. **States:** staff role sees account only (no team/billing).
**Paste-ready prompt:**
```
Design the SETTINGS screen for the console with tabs (Account, Team, Notifications, Data).
Account: name, email, change password, sign out. Team (admin only): a member list with roles
and "Invite"/"remove". Data: export buttons for Leads, Invoices, Expenses, and Reviews (CSV).
Mobile-first, clean. Show that a "staff" member sees only Account.
```

**End of PART B.** Console v1 build set = B0, B1, B2, B3, B4, B5, B6, B12, B13, B14 (the `[v1]`/`[v1*]` screens). B7-B11 (`[P2]`) are designed now so the system is consistent when those tools ship.

---

# PART C - Operator console (Phase 1 additions only)

These are agency/operator-facing and lower design priority than A & B, but they're part of Phase 1 (Step 4) and benefit from the same system. Kept brief.

## C1. Onboarding wizard  -  route (operator): `/onboard`  [v1]
**Purpose:** create a new tenant end-to-end in minutes.
```
+----------------------------------------------------------------------+
| New client onboarding        [ 1 ]-[ 2 ]-[ 3 ]-[ 4 ]-[ 5 ]         |
|----------------------------------------------------------------------|
| 1 BUSINESS: name, niche(v), city, state  {exclusivity check: OK/!}  |
| 2 PLAN: Basic / Growth / Scale  + build fee                         |
| 3 THEME: pick a preset (thumbnails) + brand color                   |
| 4 CONTENT: services (prefilled from niche), service areas, contact  |
| 5 INVITE + DOMAIN: client email invite + add domain (-> C2)         |
|----------------------------------------------------------------------|
| [ Back ]                                   [ Continue / Finish ]    |
+----------------------------------------------------------------------+
```
**Sections:** stepper; (1) business + live exclusivity check on niche+city+state; (2) plan + build fee; (3) theme preset + brand color; (4) services/areas/contact (prefilled from niche catalog); (5) invite client + add domain. **States:** exclusivity conflict -> blocking warning ("a roofer in Tampa already exists"); finish -> summary + "go to tenant".
**Paste-ready prompt:**
```
Design an operator ONBOARDING wizard to create a new client tenant: a 5-step stepper - (1)
Business details (name, niche, city, state) with a live "exclusivity" check that warns if
that niche+city is taken; (2) Plan select (Basic/Growth/Scale) + build fee; (3) Theme preset
picker (thumbnails) + brand color; (4) Content (services prefilled from the niche, service
areas, contact info); (5) Invite the client by email + add their domain. Back/Continue
navigation and a final summary. Efficient, confident, desktop-first (this is an internal
tool) but responsive.
```

## C2. Custom domain provisioning  -  route (operator): `/tenants/<id>/domain`  [v1]
**Purpose:** connect a real domain with SSL (Cloudflare for SaaS).
```
+----------------------------------------------------------------------+
| Domain                                                              |
|  Current: summitroofing.localhost  [ primary ]                     |
|  [ + Add custom domain ]                                            |
|----------------------------------------------------------------------|
|  Add: [ www.summitroofing.com ]  [ Add ]                           |
|  DNS instructions:                                                  |
|   Add CNAME  www -> cname.platform.app                             |
|  Status: o Pending verification  ->  o Issuing SSL  ->  o Active   |
+----------------------------------------------------------------------+
```
**Sections:** current domains (primary marker); add-domain field; DNS (CNAME) instructions; SSL status progression (pending -> issuing -> active). **States:** verifying (spinner + recheck), active (green), error (misconfigured DNS help).
**Paste-ready prompt:**
```
Design an operator DOMAIN provisioning screen: list current domains with a "primary" marker,
an "Add custom domain" field, copyable DNS (CNAME) instructions, and an SSL status indicator
that progresses Pending verification -> Issuing SSL -> Active (with verifying and error
states). Clear, technical-but-friendly, desktop-first.
```

---

## Appendix - screen index & build order

**Public site (Part A) - all `[v1]` except where noted:** A0 header/footer, A1 Home, A2 About, A3 Services index, A4 Service detail (+ city money page), A5 Areas hub + city page, A6 Gallery, A7 Reviews, A8 Blog index+post, A9 FAQ, A10 Contact, A11 Booking `[P2]`, A12 Financing `[v1*]`, A13 Legal+404.

**Tenant console (Part B):** B0 shell+auth, B1 Dashboard, B2 Leads list, B3 Lead detail, B4 Requests list, B5 Request create+approve, B6 Billing+receipts, B12 Site appearance `[v1*]`, B13 Notifications, B14 Account+data are `[v1]`. B7 Invoicing, B8 Expenses, B9 Reviews, B10 Reports, B11 Booking mgmt are `[P2]`.

**Operator (Part C) - `[v1]`:** C1 Onboarding wizard, C2 Domain provisioning.

**Suggested design order in Claude's Design tool:** shells first (A0, B0) to lock the system -> public Home/Services/Service-detail/Contact (highest conversion value) -> rest of Part A -> console Dashboard/Leads/Lead-detail -> rest of `[v1]` console -> operator C1/C2 -> `[P2]` console tools.

*End of wireframes v1.0. Structure is fixed here; visual design is delegated to Claude's Design tool. Build order and phase tags align with PRD Section 18.*
