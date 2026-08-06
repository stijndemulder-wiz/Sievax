# Leadformulier → Brevo

Het formulier `#leadForm` postte naar een dummy Formspree-endpoint
(`formspree.io/f/REPLACE_WITH_FORM_ID`). Daardoor toonde `js/main.js` alleen de
lokale succes-state en kwam er nooit mail aan — precies wat Jan meldde op het
Miro-board ("Dit lijkt nog niet te werken? Ik krijg geen email op jan@sievax.be").

Vervangen door een eigen PHP-endpoint dat via **Brevo** mailt. De site draait op
Combell (shared PHP, deploy via autogit), dus de key hoort server-side — nooit in
de client, nooit in de repo.

## Onderdelen

```
www/                     ← document root (zie docs/DEPLOY-COMBELL.md)
├── api/lead.php         de handler: validatie, spamfilters, mail via Brevo
├── api/inc/Brevo.php    dependency-vrije client voor api.brevo.com/v3 (cURL)
├── api/inc/env.php      minimale .env-loader (dotenv_load / dotenv_get)
└── .htaccess            blokkeert /api/inc/
.env                     secrets — ALLEEN op de server, chmod 600, gitignored
.env.example             sjabloon
storage/                 leads.log, brevo-error.log, throttle-bestanden (gitignored)
.autogit.yml             declareert .env + storage/ als shared
```

`.env` en `storage/` liggen bewust **náást** `www/`, dus boven de document root.
Zelfs zonder `.htaccess` is de Brevo-key daardoor niet via het web op te vragen.

`api/inc/Brevo.php` is overgenomen uit
`~/Sites/reizen-van-laere_heen-en-weer/files/inc/Brevo.php` — dezelfde host, hetzelfde
patroon. Die versie heeft naast `sendEmail()` ook `addContact()`, mocht je leads later
in een Brevo-lijst willen zetten.

## Wat er gebeurt bij een inzending

1. `js/main.js` post het formulier met `fetch()` naar `api/lead.php` en verwacht JSON.
2. `lead.php` weigert alles wat geen POST is, laat honeypot-invullers en
   binnen-2-seconden-inzendingen stil doorlopen (bot krijgt `{"ok":true}` en leert niets),
   valideert naam + e-mail, en throttlet op 1 inzending per IP per 5 seconden.
3. Er gaat één transactionele mail naar `NOTIFY_EMAIL` met **reply-to = het werkadres
   van de aanvrager**, zodat Jan gewoon kan antwoorden.
4. Bij succes toont de pagina de bestaande success-state; bij falen verschijnt
   `#leadError` met een mailto-alternatief. Een lead verdwijnt dus nooit in stilte.

Bewust **niet** (voorlopig): contact toevoegen aan een Brevo-lijst, en een
bevestigingsmail naar de aanvrager zelf.

## Wat er misgaat, en wat er dan gebeurt

| Situatie | Bezoeker ziet | HTTP | Log |
|---|---|---|---|
| Alles ok | success-state | 200 | — |
| `BREVO_API_KEY=dry` | success-state | 200 | `storage/leads.log` |
| Brevo weigert (ongeldige key, niet-geverifieerde afzender, rate limit) | foutmelding + mailto | 502 | `brevo-error.log` **en** `leads-failed.log` |
| Brevo onbereikbaar (timeout, DNS) | foutmelding + mailto | 502 | idem (`status: 0`, cURL-melding) |
| Ongeldige naam of e-mail | HTML5-validatie vangt dit meestal af; anders foutmelding | 422 | — |
| Meer dan 1 inzending per IP per 5s | foutmelding + mailto | 429 | — |
| Honeypot ingevuld of binnen 2s verzonden (bot) | success-state | 200 | — (stil genegeerd) |

De twee logs bij een mislukte verzending zijn met opzet gescheiden:

- **`brevo-error.log`** — wat de API terugzei (status + body). Voor de diagnose.
- **`leads-failed.log`** — de ingevulde gegevens zelf. Dit is het vangnet: mailt
  de bezoeker niet alsnog, dan staat de aanvraag hier en is ze niet verloren.

Er is bewust **geen stille fallback naar `mail()`**. Op shared hosting komt zulke
mail vaak in spam terecht, en dan denk je dat het werkt terwijl er niets aankomt —
precies het probleem dat we net opgelost hebben. Liever een zichtbare fout plus een
log dan een valse bevestiging.

Na een storing:

```sh
ssh sievaxbe@ssh083.webhosting.be
cd ~/checkout/master/shared/storage
tail -20 brevo-error.log      # waaróm faalde het
tail -20 leads-failed.log     # wélke aanvragen zijn niet doorgekomen
```

## Instellen op de server

`.env` staat in de `shared/`-map van de branch, want `.autogit.yml` declareert hem
als `shared_files` — zo overleeft hij elke deploy:

```bash
ssh sievaxbe@ssh083.webhosting.be
cd ~/checkout/master/shared        # of .../staging/shared voor de subsite
nano .env                          # inhoud: zie .env.example
chmod 600 .env
mkdir -p storage && chmod 755 storage
```

`.env`:

| Sleutel | Betekenis |
|---|---|
| `BREVO_API_KEY` | de API-key (Brevo → SMTP & API → API keys). `dry` of leeg = niet mailen, wel loggen |
| `BREVO_SENDER_NAME` | afzendernaam, standaard `Sievax Academy` |
| `BREVO_SENDER_EMAIL` | afzenderadres — **moet een geverifieerde sender of geverifieerd domein in Brevo zijn**, anders weigert de API |
| `NOTIFY_EMAIL` | waar de lead naartoe gaat, standaard `jan@sievax.be` |

Permissies verder: mappen `755`, bestanden `644`, `.env` `600`. Nooit `777`.

## Lokaal testen

Laat `BREVO_API_KEY` op `dry` (of maak geen `.env` aan — de default is `dry`). Dan
mailt er niets en komt elke inzending in `storage/leads.log`:

```bash
cd www && php -S localhost:8000    # serveert index.html én api/lead.php
tail -f ../storage/leads.log
```

## Nog te doen op Brevo-zijde

1. Afzenderadres of het domein `sievax.be` verifiëren in Brevo (SPF/DKIM), anders
   komt de mail niet aan of belandt hij in spam.
2. API-key aanmaken en in de `.env` op de server zetten.
3. Eén testinzending doen en bevestigen dat de mail bij Jan aankomt.
