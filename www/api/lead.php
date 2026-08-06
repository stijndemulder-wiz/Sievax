<?php
/* ============================================================
   Lead-formulier (#leadForm) → transactionele mail naar Jan via Brevo.

   Antwoordt JSON, want js/main.js post met fetch() en toont zelf de
   success-state; er wordt niet geredirect.

   Met BREVO_API_KEY leeg of 'dry' wordt er NIET gemaild maar gelogd in
   storage/leads.log — zo kan je lokaal testen zonder key en zonder mail.
   ============================================================ */
declare(strict_types=1);

require_once __DIR__ . '/inc/env.php';
require_once __DIR__ . '/inc/Brevo.php';

dotenv_load(__DIR__ . '/../../.env');

header('Content-Type: application/json; charset=utf-8');

/** Antwoord en stop. HTTP-status blijft 200 bij spam, zodat bots niets leren. */
function respond(bool $ok, string $reason = '', int $status = 200): never {
  http_response_code($status);
  echo json_encode(['ok' => $ok] + ($reason !== '' ? ['reason' => $reason] : []));
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  respond(false, 'method', 405);
}

// --- Spam: honeypot moet leeg zijn; bots krijgen een stille "ok" ---
if (!empty($_POST['_gotcha'])) {
  respond(true);
}

// --- Spam: ingevuld binnen 2s na renderen, of geen timestamp = bot ---
$ts = (int) ($_POST['_ts'] ?? 0);
if ($ts <= 0 || (time() - $ts) < 2) {
  respond(true);
}

// --- Validatie (CR/LF eruit tegen header-injectie) ---
$name  = preg_replace('/[\r\n]+/', ' ', trim((string) ($_POST['name']  ?? '')));
$email = preg_replace('/[\r\n]+/', '',  trim((string) ($_POST['email'] ?? '')));

if ($name === '' || mb_strlen($name) > 100) {
  respond(false, 'name', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
  respond(false, 'email', 422);
}

// --- Per-IP throttle: max 1 inzending per 5s ---
// storage/ ligt náást www/, dus boven de document root: er is geen URL die er
// naartoe wijst. De .htaccess hieronder is puur een tweede slot — als de docroot
// ooit verkeerd op de release-root wordt gezet, blijven de logs alsnog dicht.
$storage = __DIR__ . '/../../storage';
if (!is_dir($storage)) {
  @mkdir($storage, 0755, true);
}
if (!is_file($storage . '/.htaccess')) {
  @file_put_contents(
    $storage . '/.htaccess',
    "# Logs met persoonsgegevens. Nooit via het web opvraagbaar.\n"
    . "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n"
    . "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n"
  );
}
$ip     = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$rlFile = $storage . '/rl_' . hash('sha256', $ip) . '.txt';
$last   = is_file($rlFile) ? (int) file_get_contents($rlFile) : 0;
if (time() - $last < 5) {
  respond(false, 'throttled', 429);
}
@file_put_contents($rlFile, (string) time());

// --- Velden verzamelen ---
$labels = [
  'name'    => 'Full name',
  'email'   => 'Work email',
  'company' => 'Company name',
  'vat'     => 'Company VAT number',
  'message' => 'Goal for the cohort',
];
$rows = [];
foreach ($labels as $key => $label) {
  $val = trim((string) ($_POST[$key] ?? ''));
  if ($val === '') {
    continue;
  }
  $rows[$label] = mb_substr(preg_replace('/[\r\n]+/', "\n", $val), 0, 2000);
}

$dateStr = (new DateTime('now', new DateTimeZone('Europe/Brussels')))->format('d/m/Y H:i');
$subject = 'New Sievax Academy lead: ' . $name;

$html = '<h2>' . htmlspecialchars($subject, ENT_QUOTES) . '</h2>'
      . '<p style="color:#555">Received ' . $dateStr . '</p>'
      . '<table cellpadding="6" style="border-collapse:collapse">';
foreach ($rows as $label => $val) {
  $html .= '<tr><td style="border:1px solid #ddd;font-weight:bold">'
         . htmlspecialchars($label, ENT_QUOTES)
         . '</td><td style="border:1px solid #ddd">'
         . nl2br(htmlspecialchars($val, ENT_QUOTES))
         . '</td></tr>';
}
$html .= '</table>';

// --- Config uit .env ---
$apiKey      = dotenv_get('BREVO_API_KEY', 'dry');
$senderName  = dotenv_get('BREVO_SENDER_NAME', 'Sievax Academy');
$senderEmail = dotenv_get('BREVO_SENDER_EMAIL', 'jan@sievax.be');
$notifyEmail = dotenv_get('NOTIFY_EMAIL', 'jan@sievax.be');

// --- Dry-run: lokaal testen zonder key, log i.p.v. mailen ---
if ($apiKey === '' || strtolower($apiKey) === 'dry') {
  @file_put_contents(
    $storage . '/leads.log',
    $dateStr . "\t" . json_encode($rows, JSON_UNESCAPED_UNICODE) . "\n",
    FILE_APPEND | LOCK_EX
  );
  respond(true);
}

// --- Versturen: notificatie naar Jan, reply-to = de aanvrager ---
$brevo = new Brevo($apiKey, $senderName, $senderEmail);
$res   = $brevo->sendEmail(
  [['email' => $notifyEmail, 'name' => 'Jan Meskens']],
  $subject,
  $html,
  $email
);

if (!$res['ok']) {
  // Twee logs, met opzet gescheiden. brevo-error.log is voor jou: wat zei de API.
  // leads-failed.log is voor de lead: de ingevulde gegevens, zodat een mislukte
  // verzending nooit betekent dat de aanvraag zelf verloren is. De bezoeker
  // krijgt een foutmelding met mailto, maar reageert die niet, dan staat hij hier.
  @file_put_contents(
    $storage . '/brevo-error.log',
    '[' . $dateStr . '] ' . json_encode($res, JSON_UNESCAPED_UNICODE) . "\n",
    FILE_APPEND | LOCK_EX
  );
  @file_put_contents(
    $storage . '/leads-failed.log',
    $dateStr . "\t" . json_encode($rows, JSON_UNESCAPED_UNICODE) . "\n",
    FILE_APPEND | LOCK_EX
  );
  respond(false, 'send', 502);
}

respond(true);
