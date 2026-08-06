# Miro "VERSIE 2" — feedback van Jan, uitgewerkt

Bron: <https://miro.com/app/board/uXjVH70KQk8=/> — kolom **VERSIE 2** (rechts, donker).
VERSIE 1 (links, licht) is de vorige ronde; die feedback ("kleuren flippen: veel zwart
en geel, weinig wit") zit al in de huidige `index.html` / `css/flat.css`.

Uitgelezen op 2026-08-06 via de Miro Web SDK (`miro.board.get()`) in de browser, dus
letterlijke tekst — geen OCR-interpretatie. De pijlen/curves zijn per stuk visueel
nagelopen om te bepalen welk element ze aanwijzen.

## Tekstuele edits

| # | Element | Van → naar |
|---|---------|-----------|
| 1 | Hero eyebrow (`.kbadge`) | `Live cohort-based academy · worldwide` → `Live cohort training for (future) data & AI leaders.` |
| 2 | Hero-kaart `Starts` + prijsblok `Starts` | `Announced soon` → `January 18, 2027` (2 plaatsen) |
| 3 | Video H2 (beide varianten) | `Two minutes on why this academy exists` → `Why I built this Sprint` |
| 4 | Video lead-alinea | huidige alinea → `Two minutes: why 80% of your data & AI transformation isn't tech` — expliciete note: *"Plaats deze korte tekst ook bij de horizontale variant."* (landscape-variant had nog geen alinea) |
| 5 | CTA onder video (beide varianten) | `Join the cohort →` → `See the Program`, `href="#program"` (note: *"Scrollen naar de weekgrid"*) |
| 6 | CTA in `#gap` | `Join the cohort →` → `Check the Dates & Pricing` |
| 7 | CTA in Outcomes | `Join the cohort →` → `Claim Your Seat` |
| 8 | Trainer-CTA | `Reserve your seat →` → `Book a 15-minute Call`, link naar Calendly |
| 9 | Onder trainer-CTA | nieuwe regel: `Prefer to reach out directly? Mail me at jan@sievax.be or connect on LinkedIn.` |
| 10 | Onder testimonials-H2 | nieuwe regel: `The Sprint builds on nine editions of the in-person Data & AI Strategy Masterclass. Here's what participants say.` |
| 11 | Testimonials 1/2/3 | placeholders `[ Name ]` / `[ Organisation ]` → drie echte quotes (zie onder) |
| 12 | Formulier | veld `Organisation / role` → `Company name`; nieuw veld `Company VAT Number (optional)` |
| 13 | FAQ "Can my whole team join?" | `For 3 or more participants` → `For 2 or more participants` |
| 14 | Calendly-links (2×) | `calendly.com/jan-sievax/call-30-jan` → `calendly.com/jan-sievax/data-ai-strategy-sprint-intake` |
| 15 | Footer | `© 2026 Sievax Academy · …` → jaartal weg |

### De drie echte testimonials (volgorde zoals de pijlen ze aanwijzen)

1. "This training taught me to turn a future Data & AI vision into a story people
   actually understand. I now use these storytelling techniques in every data & AI
   change project. It gets all stakeholders on the same page and makes them part of
   the transformation." — **Charlotte De Waele**, Product Owner
2. "This training gave me the tools and frameworks to guide our company's data
   initiatives. I can now clearly articulate what we need, both inside our
   organization and towards external software partners." — **Marlies**, Business
   Project Manager
3. "Jan combines foundational and emerging data & AI topics in a new and refreshing
   way. It gave me new ideas across the board. Thank you, Jan, for sharing your
   knowledge!" — **Chris Van Daele**, Information Architecture & Governance Consultant

## Functioneel

- **"Dit lijkt nog niet te werken? Ik krijg geen email op jan@sievax.be"** — het
  formulier stond op `formspree.io/f/REPLACE_WITH_FORM_ID`, een placeholder-endpoint;
  `js/main.js` toonde daarom alleen de lokale succes-state. Vervangen door **Brevo**
  via het PHP-endpoint `www/api/lead.php` (zie `docs/BREVO.md`).

## Beslissingen (Stijn, 2026-08-06)

- **Calendly = click-to-load popup.** Link blijft een echte `<a href … target="_blank">`
  (fallback zonder JS); pas bij klik laadt `js/main.js` het Calendly-widgetscript en
  opent de popup. Zelfde patroon als de bestaande click-to-load YouTube-facade: geen
  third-party script bij pageload.
- **Brevo doet voorlopig alleen de transactionele mail naar `jan@sievax.be`.** Geen
  contact-in-lijst, geen bevestigingsmail naar de aanvrager. (Beide zijn later
  bij te zetten — `Brevo.php` in `reizen-van-laere_heen-en-weer` heeft `addContact`.)
- **Beide video-varianten blijven staan** (landscape `#video` + portrait
  `#video-vertical`) tot de echte video er is. Tekstedits zijn op allebei toegepast.
- **Footer: jaartal weg**, regel wordt `© Sievax Academy · An initiative by Sievax`.

## Nog open

- YouTube-ID (`REPLACE_WITH_YOUTUBE_ID`, 2 plaatsen) — video moet nog geleverd worden.
- Keuze landscape vs. portrait video-sectie.
