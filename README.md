# Sievax Academy — landing page

Landing page for the Sievax Academy Data &amp; AI Strategy Sprint. No build step,
no framework — plain HTML, CSS, a little vanilla JavaScript, and one PHP endpoint
for the lead form.

The page mirrors the live sievax.be look: Poppins, flat surfaces, no shadows,
pill buttons, generous radii.

## Structure

```
.
├── www/                   # ← DOCUMENT ROOT (Combell autogit publishes this folder)
│   ├── index.html         # The page
│   ├── css/flat.css       # Styles
│   ├── js/main.js         # Nav toggle · lead form · video facade · Calendly popup
│   ├── api/
│   │   ├── lead.php       # Lead form → transactional mail via Brevo
│   │   └── inc/           # Brevo.php + env.php (blocked from the web)
│   ├── assets/            # images/ + the Sievax logo kit
│   └── .htaccess
├── .autogit.yml           # Combell deploy config (shared files/folders, hooks)
├── .env                   # Secrets — server only, chmod 600, NEVER committed
├── .env.example           # Template
├── storage/               # leads.log, brevo-error.log, throttle files (gitignored)
└── docs/                  # Briefing, brand guide, BREVO.md, MIRO-V2-EDITS.md
```

Everything outside `www/` sits above the document root and cannot be requested
over the web. That is deliberate: it is what keeps the Brevo key out of reach.

The stylesheet follows a fixed section order — see the table of contents at the
top of the file. Design ground truth (tokens, the "blackboard" concept, the
contracts that must not break) lives in `.claude/context/project-context.md`.

## Local preview

The lead form needs PHP, so serve the docroot with PHP's built-in server:

```sh
cd www && php -S localhost:8000
# then open http://localhost:8000
```

Without a `.env`, `BREVO_API_KEY` defaults to `dry`: the form validates and
confirms but sends no mail — every submission lands in `storage/leads.log`.

## Deploy — Combell autogit

Publishing is a separate, deliberate step — pushing to GitHub does not deploy.
The **branch decides which site** the Combell push lands on:

```sh
git push combell main:master     # → the main site, sievax.academy
git push combell main:staging    # → staging.sievax.academy (auto-created subsite)
```

Combell unpacks each push into `~/checkout/<branch>/<commit-id>/` and points
`current` at it, keeping the two most recent releases. `.env` and `storage/` are
declared as shared in `.autogit.yml`, so they live once in
`~/checkout/<branch>/shared/` and survive every deploy.

Full walkthrough, including first-time setup and the safety notes: `docs/DEPLOY-COMBELL.md`.

## Working-copy convention

The git working copy lives outside any cloud-sync folder (`~/Sites/sievax-academy`)
because Google Drive / Dropbox / OneDrive corrupt `.git` by syncing mid-write. A
Drive folder may hold a **backup mirror without `.git`** for team access; link the
two with a `.local-worktree` file containing the absolute path of this working
copy. Never put `.git` or `.env` on a shared Drive.

## Going live — still open

- **Explainer video** — replace `REPLACE_WITH_YOUTUBE_ID` in the `data-video-id`
  attribute (two places: `#videoEmbed` and `#videoEmbedVertical`). Until then the
  play button does nothing.
- **Video format** — the landscape (`#video`) and portrait (`#video-vertical`)
  sections both exist. Delete the one that isn't used once the video is delivered.
- **Brevo** — verify the sender domain and set `BREVO_API_KEY` in the server
  `.env`. See `docs/BREVO.md`.
- **Social image** — point `og:image` / `twitter:image` at a dedicated 1200×630
  image.
