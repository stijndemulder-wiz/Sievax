# Project context — Sievax Academy landing page

> Ground truth for every worker. Read this fully before touching anything.
> Grounded in the current `css/flat.css` + `index.html` (commit 2badd3f), not guesses.

## What this is

A single-page, no-build landing page (`index.html` + `css/flat.css` + `js/main.js`,
plain HTML/CSS/vanilla JS) for the **Sievax Academy Data & AI Strategy Sprint** — a
live cohort-based program for the leaders who have to make AI actually land in an
organization. Audience is senior and non-technical-ish: CDOs, data leads, transformation
leads, consultants. The page's single job is **lead capture** (the form at `#apply`).

Voice: direct, plain, a little blunt. Short declaratives. No hype, no SaaS-speak,
no exclamation marks. "Plenty of pilots. No strategy." is the register.

## THE DESIGN IDEA — "the strategist's blackboard"

The brand language is Jan's whiteboard: yellow highlighter, black marker. This page
**inverts** it into a blackboard:

- The board is **near-black**. Yellow is **the marker** — highlights, underlines,
  arrows, number discs, key surfaces.
- **White is almost absent by design.** The client asked for "veel zwarte en gele
  achtergrond, weinig wit". White is reserved for the hand-drawn sketches, which stay
  on paper, and for form inputs. White is what's *pinned to* the board, not the board.
- Depth comes from **surface lift + hairline borders. There are NO shadows anywhere.**
  Do not add box-shadow. There are deliberately no `--shadow` tokens.

## Design tokens — use ONLY these, no new hex values

```
--yellow      #fee447   the marker. Accents + full-bleed yellow sections.
--yd          #ffef8a   yellow hover (brightens on dark; do not darken)
--board       #0b0b0b   page background
--surface     #171716   raised panel (cards) — lifts without a shadow
--surface-2   #1f1f1d   second lift (roadmap discs, trainer photo bg)
--paper       #ffffff   TRUE WHITE — sketch frames + form inputs ONLY
--fg          #f7f6f2   primary text on dark
--muted       rgba(247,246,242,0.7)    secondary text
--faint       rgba(247,246,242,0.55)   small labels ONLY, never body copy
--on-yellow   #0b0b0b   text on yellow — NEVER flips to light
--line        rgba(247,246,242,0.16)   hairline borders
--line-strong rgba(247,246,242,0.32)   outlined pills/toggles
--radius      22px
```

Arrow tokens `--arrR / --arrL / --arrD` are yellow-stroked SVG data-URIs used by the
program roadmap connectors.

**The two-token rule that trips people up:** `--fg` is "text on dark" and `--on-yellow`
is "text on yellow". They are not interchangeable. Anything sitting on a yellow surface
uses `--on-yellow` and stays black.

## Type

- **Poppins** for both display and body (mirrors the live sievax.be). No second family.
- Headings: weight 600, `line-height: 1.14`, `letter-spacing: -0.01em`, `text-wrap: balance`.
- Body: `line-height: 1.7` (light-on-dark needs more leading than the light theme did).
- Section h2: `clamp(30px, 4.7vw, 50px)`. Eyebrow labels: 12px, 700, `0.16em` tracking, uppercase.
- Paragraphs get `text-wrap: pretty`.

## Established component patterns — reuse, don't reinvent

- `.btn` + `.btn-yellow` / `.btn-dark` / `.btn-ghost` — pill buttons, `border-radius: 999px`.
- `.mid-cta` — the sized-up mid-page pill (`17px 34px`, `16.5px`). Already used in the
  gap + audience sections.
- `.alt-line` — muted copy with a marker-yellow underlined link ("Not ready to apply?").
- `.uline` — the marker underline. Real `text-decoration` with
  `text-decoration-skip-ink: none` so the stroke runs unbroken through descenders.
  **Do not** reimplement this as an absolutely-positioned pseudo-element; it was
  deliberately migrated away from that because a pseudo can only underline one line box.
- `.on-yellow` — put on a `<section>` to make it a full-bleed yellow section; flips all
  text inside to `--on-yellow`. Currently on Outcomes and the final CTA.
- `.eyebrow` — small uppercase label with a yellow tick before it.
- `.gap-img` — the white sketch frame (white bg + padding + hairline + 20px radius).

## Voice / content rules

- **Keep the real copy** unless the brief explicitly asks for new copy. Copy is the
  client's; they are actively editing it.
- Write `&amp;` for every literal ampersand, and `&nbsp;` where two words must not break.
- Placeholders that are intentionally live right now: `[ Name ]` / `[ Organisation ]` in
  testimonials, "Announced soon" dates, "On request" price, `REPLACE_WITH_FORM_ID`,
  `REPLACE_WITH_YOUTUBE_ID`. **Leave these as placeholders** — do not invent real names,
  prices, dates, or testimonials.

## Acceptance criteria — the quality bar. Verify before reporting.

1. **No horizontal overflow at 390 / 768 / 1440.** Assert
   `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
   This is the single most common failure — check it.
2. **Contrast**: body text ≥4.5:1, large text ≥3:1 against its actual background.
   `--faint` is for small labels only; never body copy.
3. **No new hex values, no new fonts, no shadows.**
4. `prefers-reduced-motion: reduce` is already handled globally — don't add motion that
   escapes it.
5. Keyboard focus must stay visible. Focus rings are yellow by default and flip to
   `--on-yellow` inside `.on-yellow` sections and `.form-card`.
6. Mobile: a fixed `.sticky-cta` bar occupies the bottom ~76px below 720px. Don't put
   anything critical under it.

**How to verify:** serve the worktree and render it headless. Chrome is at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Screenshot your section
at 1440 and 390 and actually look at it. Report what you checked.

## Contracts that MUST NOT break

`js/main.js` and the nav anchors depend on these. Changing one breaks the page:

- **IDs:** `#main`, `#top`, `#gap`, `#audience`, `#program`, `#trainer`, `#video`,
  `#apply`, `#navToggle`, `#navmenu`, `#leadForm`, `#leadSuccess`, `#leadError`,
  `#videoEmbed`, `#f-ts`
- **Calendly:** every booking link carries `data-calendly` plus a real `href` and
  `target="_blank"`. JS upgrades it to a click-to-load popup; the attribute is the
  hook, the href is the fallback. Don't strip either.
- **Form:** `#leadForm` posts to `api/lead.php`. The field `name` attributes
  (`name`, `email`, `company`, `vat`, `message`, `_gotcha` honeypot, `_ts`) are read
  by that handler — renaming one silently drops it from the mail. `#leadSuccess` is
  revealed by JS on success, `#leadError` on failure. The floating-label CSS depends
  on inputs keeping `placeholder=" "` and the `<label>` being the *next sibling* of
  the input.
- **Video:** `#videoEmbed` keeps its `data-video-id` attribute and must contain a
  `.vid-play` button. JS swaps the whole frame's innerHTML for an iframe on click.
- **Nav:** `#navToggle` / `#navmenu`, and the `.open` class the JS toggles.
- `.sticky-cta` and its `aria-label`.
- Global tokens in `:root` — **do not redefine them.**

## Scope discipline

Every worker edits the SAME two files (`index.html`, `css/flat.css`) in a separate
worktree. To keep merges clean:

- Touch **only your own section's markup** and **only your own section's CSS rules**.
- Do **not** edit `:root`, the reset/base block, `.btn`, `.wrap`, `section`, nav,
  footer, `.uline`, `.eyebrow`, `.mid-cta`, `.alt-line`, or the shared responsive
  media-query blocks at the bottom of the file. If you need a responsive tweak, add a
  **new** narrowly-scoped media query next to your own rules instead of editing the
  shared one at the bottom.
- If you genuinely need a global change, **don't make it** — describe it and hand it
  back to the orchestrator.

## Preview / run

**`www/` is the document root.** `index.html`, `css/`, `js/`, `assets/` and `api/`
all live there; `.env`, `storage/` and `docs/` sit deliberately above it, out of web
reach. The lead form needs PHP, so a plain static server no longer covers the page:

```sh
cd www && php -S localhost:8000
```

Without a `.env` the Brevo key defaults to `dry` — the form confirms but sends no
mail, and every submission is appended to `storage/leads.log`.

Deploy is Combell autogit (`git push combell main:master` → sievax.academy). The
branch name decides which site receives the push. See `docs/DEPLOY-COMBELL.md`.
