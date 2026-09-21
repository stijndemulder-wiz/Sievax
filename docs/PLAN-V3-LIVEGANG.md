# Plan: Miro versie 3 en livegang

Bron: mail Jan 18/9/2026 ("Feedback en filmpje sievax.academy"), Miro-kolom VERSIE 3
(board `uXjVH70KQk8=`, x ≈ 14650), Notion-checklist, memory. Deadline: live vóór 30/9.
Stand 21/9: `https://sievax.academy/` geeft 401, de login wall staat er nog op.

## Stand 21/9 avond

A, B en C zijn klaar en staan online achter de login wall. GA4: property 555253626,
`G-XX4CZLMZ4N`, key events `generate_lead` + `book_call_completed`, bewaring 14 maanden.
Open: D (livegang) en E.

## A. Miro versie 3 (10 notities)

**Video**
1. YouTube-ID `HRG52LZxAeA` invullen (`data-video-id`, nu `REPLACE_WITH_YOUTUBE_ID`).
2. **Verticale videosectie (`#video-vertical`) verwijderen.** Jan heeft ze doorgekruist en
   kiest dus landscape.
3. Subtitel onder "Why I built this Sprint": "Two minutes: why 80% of your Data & AI
   transformation isn't tech." wordt **"One minute: 80% of your Data & AI transformation
   isn't tech"**.
4. Label op de facade: "Jan explains the academy / 2 min watch" wordt **"Jan explains the
   Data & AI Strategy Sprint / 1 Min watch"**, ook in de `aria-label`. Jan: "als deze tekst
   zichtbaar blijft". Nakijken of de YouTube-thumbnail zelf al tekst draagt.

**Groepsgrootte**
5. Hero-kaart: "Seats left 20" wordt **"Group size: Max 20"**.
6. Pricing, cohort details: "20, kept small on purpose" wordt **"Max 20 …"**.

**1 uur coaching (nieuw in het aanbod)**
7. Outcomes: **7e punt** "A personal 1-hour coaching session with Jan to put your strategy
   into practice." Het grid telt nu 6 (2×3); met 7 moet de layout mee (laatste item volle
   breedte of 4+3).
8. Programma, gele "Your move"-kaart: toevoegen "Your seat includes a personal 1-hour
   coaching session with Jan on your strategy."
9. Pricing, onder de prijs, klein: "Includes all live sessions, recordings, slides,
   practical workshops and a personal 1-hour coaching session with Jan."
10. Cohort details: extra rij na Duration: **Coaching · 1h personal session included**.
11. FAQ: nieuwe vraag na "How much time does it take per week?":
    **"Is the coaching session extra?"** / "No. One personal hour with Jan after week 7 is
    included for every participant. Optional, one on one, focused on your strategy."

**Mee te trekken (niet op Miro, wel nodig voor consistentie)**
- FAQPage JSON-LD: nieuwe vraag toevoegen (blok "KEEP IN SYNC WITH THE PAGE").
- Course JSON-LD / meta description: coaching vermelden waar de inhoud opgesomd wordt.

## B. Bug gevonden bij het nalopen

- Final CTA (`index.html:519`): "Next cohort starts — announced soon". Moet
  **January 18, 2027** zijn; bij versie 2 over het hoofd gezien.

## C. GA4 en cookiebanner

Afspraak 3/9: alleen GA4, zonder akkoord laadt er niets. Ads, GTM en pixels vallen buiten scope.
- Consent-laag overnemen uit `~/Sites/wizarts-v3-agentic/site/src/components/analytics/`
  (`ConsentBanner.astro`, `HeadTags.astro`), omzetten naar vanilla JS voor deze statische site.
  Consent Mode v2, standaard alles `denied`, gtag pas laden na "Accept".
- `js/analytics.js` met het eventplan: `generate_lead`, `form_error`, `book_call_completed`
  (Calendly `postMessage`), `cta_click`, `video_start`, `faq_open`.
- Link "Cookie settings" in de footer, zodat de keuze te herroepen is.
- **Nodig van Jan:** GA4 Measurement ID (G-…) of toegang tot zijn property, en de URL van
  de verbrede privacy/cookie-policy op sievax.be.
- Toets: in DevTools geen request naar `google-analytics.com` vóór akkoord; na akkoord
  events zichtbaar in GA4 DebugView.

## D. Livegang

1. Testinzending van het formulier: mail komt aan bij jan@sievax.be (staat sinds augustus open).
2. og-image 1200×630 maken (nu `illustration-gap.png`).
3. Login wall eraf (`.htaccess` basic-auth), `sitemap.xml` `<lastmod>` bijwerken.
4. Search Console: domein verifiëren (DNS-TXT via Combell), sitemap indienen.
5. Na livegang controleren: 200 op `/`, formulier, Calendly, video, banner.

## E. Openstaand / beslissingen

1. Jan: GA4-ID + policy-URL (zie C).
2. Jan: wat gebeurt er met het academy-luik op sievax.be? (301 + interne link naar sievax.academy)
3. Jan: livegangdatum bevestigen (conferentie).
4. Oude feedback juli, nog open: twee foto-blokken onder elkaar; "get in touch"-links in de
   FAQ naar het "Let's talk"-blok laten springen.
5. Opruimen server: branch `autogit-probe` in `auto.git` en subsite `autogit-probe.sievax.academy`.
6. Notion-checklist bijwerken met blok "Miro versie 3".

## Volgorde

A + B (één commit, deploy naar de afgeschermde site) → mail naar Jan met de vragen uit E →
C zodra het GA4-ID binnen is → D.
