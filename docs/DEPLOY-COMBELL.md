# Deploy via Combell autogit

Bedoeld om te *begrijpen* hoe het werkt, niet alleen om commando's te plakken.
Bronnen: <https://github.com/combell/autogit-tutorial> en
<https://github.com/combell/autogit-reference>.

## Gegevens van dit pakket

| | |
|---|---|
| Git-remote | `sievaxbe@ssh083.webhosting.be:auto.git` |
| Productiebranch | `master` |
| Hoofdsite | `sievax.academy` |

## Het model in één alinea

Op je hostingpakket staat een **bare git-repository** (`auto.git`). Die heeft een
`post-receive`-hook: zodra er iets binnenkomt, pakt Combell de code uit in een
**nieuwe map per commit** en verlegt daarna een **symlink**. Je overschrijft dus
nooit een draaiende site — je zet er een nieuwe versie naast en verlegt op het
laatste moment de wegwijzer. Dat maakt een deploy vrijwel instant en een
rollback net zo goedkoop.

```
~/checkout/
└── master/
    ├── a1b2c3.../          ← release per commit-id
    │   └── www/            ← DIT is de document root
    ├── d4e5f6.../          ← de nieuwste release
    ├── shared/             ← blijft staan tussen deploys
    │   ├── .env
    │   └── storage/
    └── current -> d4e5f6...   ← de symlink die verlegd wordt
```

De site zelf is een symlink naar `~/checkout/master/current/www` — per Combell-conventie
is `~/www` je webroot en wijst die naar de `www`-map van de huidige release. Combell
bewaart de **twee recentste releases** en ruimt oudere op.

Twee eigenschappen die de moeite zijn om te kennen:

- **Een mislukte deploy breekt de site niet.** Faalt er een stap, dan blijft `current`
  naar de vórige release wijzen. Je ziet een fout in de push-output, maar bezoekers
  merken niets.
- **PHP-FPM wordt herladen** zodra de symlink verlegd is, dus de opcache is vanzelf
  leeg. Je hoeft na een deploy niets te legen of te herstarten.

Dit is ook meteen de reden dat de repo een map **`www/`** moet hebben: die map
wordt de document root. Alles wat ernaast staat (`.env`, `storage/`, `docs/`,
`README.md`) staat *boven* de document root en is dus principieel onbereikbaar
via het web — geen `.htaccess` nodig om dat af te dwingen.

## De branch bepaalt de site

Dit is het stuk dat mensen verrast, en meteen het antwoord op je zorg:

- push je naar **`master`** → dat gaat naar de **hoofdsite van dit pakket**,
  hier `sievax.academy`.
- push je naar een **andere branchnaam** → Combell maakt automatisch een
  **subsite** `<branch>.<domein>` aan, met een eigen `~/checkout/<branch>/`-boom.
  Een push naar `staging` levert dus `staging.sievax.academy` op, volledig
  gescheiden van productie.

## Overschrijft dit sievax.be?

**Nee.** Drie redenen, in volgorde van hardheid:

1. **Autogit raakt alleen de site die aan dit pakket als hoofdsite hangt**, en dat
   is `sievax.academy`. `sievax.be` heeft zijn eigen document root; die staat niet
   in `~/checkout/` en wordt door de hook nooit aangeraakt.
2. **Een andere branchnaam maakt een subsite aan, geen overname.** Er bestaat geen
   branchnaam die "spring naar de docroot van sievax.be" betekent.
3. **De eerste deploy vernietigt niets.** Combell hernoemt de bestaande web root
   naar **`www_before_autogit`** en zet daar een symlink naast. Wat er stond,
   staat er dus nog — je kan altijd terug.

Wil je het met eigen ogen zien vóór de eerste push, log in via SSH en kijk waar de
docroots naartoe wijzen:

```sh
ssh sievaxbe@ssh083.webhosting.be
ls -la ~/                 # welke sites hangen aan dit pakket?
ls -la ~/checkout/        # bestaat nog niet vóór de eerste push
```

## Eenmalige opzet

**1 — Combell-remote toevoegen** (naast `origin`, die op GitHub blijft):

```sh
git remote add combell sievaxbe@ssh083.webhosting.be:auto.git
git remote -v
```

**2 — SSH-sleutel.** Autogit werkt over SSH. Staat je publieke sleutel nog niet
op het pakket, zet hem erop via het Combell-controlepaneel of met:

```sh
ssh-copy-id sievaxbe@ssh083.webhosting.be
ssh sievaxbe@ssh083.webhosting.be 'echo verbinding ok'
```

**3 — Eerst naar een subsite pushen, niet meteen naar productie.** Dit is de
goedkoopste manier om te zien of de opzet klopt zonder de hoofdsite te raken:

```sh
git push combell main:staging
```

Dit werkt alleen als je publieke sleutel op het pakket staat. Dat is de enige stap
die niet te automatiseren valt: ook de GitHub Action heeft een sleutel nodig die
Combell kent. Eén keer plaatsen met:

```sh
ssh-copy-id -i ~/.ssh/sievax_combell.pub sievaxbe@ssh083.webhosting.be
```

Bekijk daarna `https://staging.sievax.academy`. Klopt alles → door naar stap 4.

**4 — `.env` op de server zetten.** Die staat bewust niet in git. Hij hoort in de
`shared/`-map van de branch waar je naartoe pusht, want `.autogit.yml` declareert
hem als `shared_files`:

```sh
ssh sievaxbe@ssh083.webhosting.be
cd ~/checkout/master/shared        # of .../staging/shared
nano .env                          # inhoud: zie .env.example
chmod 600 .env
mkdir -p storage && chmod 755 storage
```

Permissies verder: mappen `755`, bestanden `644`, `.env` `600`. **Nooit 777.**

**4b — `.autogit.yml` tegen het servertemplate leggen.** Combell zet een sjabloon
klaar op het pakket. Het bestand in deze repo is handgeschreven op basis van de
officiële reference; vergelijk het één keer met wat de server verwacht:

```sh
scp sievaxbe@ssh083.webhosting.be:autogit.yml.example /tmp/autogit.yml.example
diff /tmp/autogit.yml.example .autogit.yml
```

Verschillen in de hooks zijn onschuldig (die staan allemaal op `exit 0`); gaat het
over sleutelnamen, neem dan die van de server over.

**5 — Naar productie:**

```sh
git push combell main:master
```

De `main:master`-vorm mapt onze GitHub-branch `main` op Combells productiebranch
`master`. Zo hoef je lokaal niets te hernoemen.

## Dagelijkse gang van zaken

```sh
git push origin main             # broncode naar GitHub
git push combell main:master     # publiceren naar sievax.academy
```

Twee losse handelingen, met opzet. **Combell trekt niets uit GitHub** — autogit is
een aparte bare repo op het hostingpakket die alleen reageert op een push. Er is dus
altijd een duwer nodig.

Dat automatiseren met een GitHub Action kan, maar is hier bewust *niet* gedaan: die
Action heeft een privésleutel nodig als repo-secret, en deze repo is publiek. Bovendien
zou elke push naar `main` dan meteen live gaan. Nu is publiceren een aparte,
bewuste stap — je kan committen en pushen zonder de klant iets te tonen.

> Ter vergelijking: `reizen-van-laere_heen-en-weer` doet dat wél automatisch, met
> rsync en het accountwachtwoord in een secret. Dat kan daar omdat die repo privé is
> én omdat er geen autogit draait. Rsync en autogit bijten elkaar: rsync schrijft in
> de huidige release, die de volgende deploy weggooit.

Wil je toch naar staging in plaats van productie:

```sh
git push combell main:staging    # → staging.sievax.academy
```

## Rollback

Omdat elke release blijft staan, is terugdraaien het verleggen van één symlink:

```sh
ssh sievaxbe@ssh083.webhosting.be
ls -la ~/checkout/master/                 # welke releases staan er nog (max 2)
ln -sfn ~/checkout/master/<oud-commit-id> ~/checkout/master/current
```

Staat de vorige release er niet meer, dan is de weg terug gewoon een nieuwe push
van de oude commit:

```sh
git push combell <oude-commit-sha>:master --force
```

## Als er iets misgaat

- **De push wordt geweigerd** → SSH-sleutel of gebruikersnaam. Test met
  `ssh sievaxbe@ssh083.webhosting.be`.
- **Site toont een directory listing of 403** → de repo mist `www/`, of de push
  ging naar een branch die je niet verwachtte. Check `~/checkout/`.
- **Formulier geeft een fout** → `.env` ontbreekt in `shared/`, of de Brevo-key is
  niet geldig. Kijk in `~/checkout/master/shared/storage/brevo-error.log`.
- **Wijziging niet zichtbaar** → browsercache, of de push ging naar de verkeerde
  branch. `git push combell main:master` en herlaad hard.

## Wat dit betekent voor de repo

- `www/` is de document root — nieuwe publieke bestanden horen daar.
- `.env` en `storage/` staan in `.autogit.yml` als shared en horen **nooit** in git.
- `docs/` en `.claude/` worden meegedeployed maar liggen buiten `www/`, dus ze zijn
  niet publiek opvraagbaar.
