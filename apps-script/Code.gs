/**
 * Workshop registrations → Google Sheet, entry code by email, summary to the team.
 *
 * The flow
 *  1. Someone fills the form on the page → a row in the "נרשמים" tab (no email yet).
 *  2. They pay in Bit and press "סיימתי לשלם" → the row gets the payment-report time and their entry code, and:
 *       - the participant gets an email with the entry code (to show at the door);
 *       - the team (Raz) gets an email with everything the person filled in, the amount and the code.
 *     Bit's personal link does not tell anyone that a payment arrived, so the team checks the Bit app
 *     and ticks ✓ in the "שולם" column. Only ticked rows count as sold seats on the page.
 *  3. Every evening a short summary email: who registered today, who registered but did not report a payment.
 *
 * Setup (once, about 5 minutes; step by step in README.md):
 *  1. New Google Sheet → Extensions → Apps Script → paste this file → Save.
 *  2. Pick "setup" at the top → Run → allow the permissions. (Optional: run "testEmail" to see both emails.)
 *  3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → Deploy → copy the /exec URL.
 *  4. Put that URL in the page's src/config.ts in BOTH leadsEndpoint and seats.remoteUrl, and build again.
 * The emails go out from the Google account that deployed the script. The team emails go only to NOTIFY_EMAILS.
 */

// ===== settings =====
/** The team's addresses for the team emails. Only these get them (the account that deploys the script is NOT added). */
var NOTIFY_EMAILS = ['yetziamehaloop@gmail.com'];
/** Also email the team when someone only fills the form (before paying). */
var NOTIFY_ON_REGISTER = false;
/** Shown in the participant's email when filled in. */
var EVENT_DATE = '';      // e.g. 'יום חמישי, 12.11, 17:00–21:00'
var EVENT_PLACE = '';     // until the address is public: leave empty (the email says it is sent in the group)
var GROUP_URL = '';       // the participants' WhatsApp group invite link
var TOTAL_SEATS = 25;
/** Hour of the evening summary email (Israel time). Use -1 to switch it off. */
var DAILY_SUMMARY_HOUR = 20;
var TZ = 'Asia/Jerusalem';

var LEADS_TAB = 'נרשמים';
var SUMMARY_TAB = 'סיכום';
/** The main site's "שיחת מיפוי" form (out_of_the_loop_vallora) lands here too. */
var CONTACT_TAB = 'פניות מהאתר';
var CONTACT_COLUMNS = [
  ['sentAt', 'נשלח'],
  ['name', 'שם'],
  ['phone', 'טלפון'],
  ['email', 'מייל'],
  ['channel', 'איך פנה/תה'],
  ['stage', 'איפה זה עומד'],
  ['goal', 'המטרה'],
  ['idea', 'הרעיון'],
  ['source', 'הגיע/ה מ'],
  ['opened_from', 'לחץ/ה על'],
  ['time_on_site', 'זמן באתר'],
  ['scroll_depth', 'כמה גלל/ה'],
  ['visits', 'ביקורים'],
  ['first_visit', 'ביקור ראשון'],
  ['first_source', 'מקור בביקור הראשון'],
  ['device', 'מכשיר'],
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_campaign', 'utm_campaign'],
  ['utm_content', 'utm_content'],
  ['utm_term', 'utm_term'],
  ['fbclid', 'fbclid'],
  ['gclid', 'gclid'],
  ['ttclid', 'ttclid'],
  ['referrer_url', 'כתובת מפנה'],
  ['landing', 'דף כניסה'],
  ['language', 'שפה'],
  ['page', 'מאיזה דף'],
];

/** The "how they found us" block in the team email. */
var VISIT_LINES = [
  ['source', 'הגיע/ה מ'],
  ['utm_campaign', 'קמפיין'],
  ['utm_content', 'מודעה'],
  ['opened_from', 'לחץ/ה על'],
  ['time_on_site', 'זמן באתר עד הפנייה'],
  ['scroll_depth', 'כמה מהדף ראה/תה'],
  ['visits', 'מספר ביקורים'],
  ['first_visit', 'ביקור ראשון'],
  ['first_source', 'מקור בביקור הראשון'],
  ['device', 'מכשיר'],
  ['landing', 'דף כניסה'],
];

var COLUMNS = [
  ['id', 'מזהה'],
  ['code', 'קוד כניסה'],
  ['sentAt', 'נרשם/ה'],
  ['name', 'שם מלא'],
  ['phone', 'טלפון'],
  ['email', 'מייל'],
  ['age', 'גיל'],
  ['instagram', 'אינסטגרם'],
  ['describe', 'מה הכי מתאר'],
  ['tried', 'מה ניסה'],
  ['status', 'מצב היום'],
  ['idea', 'הרעיון או העסק'],
  ['pairName', 'שם השותף'],
  ['pairPhone', 'טלפון השותף'],
  ['referrer', 'מי שלח'],
  ['parentOk', 'אישור הורה'],
  ['ticket', 'כרטיס'],
  ['seats', 'מקומות'],
  ['amount', 'סכום'],
  ['tier', 'שלב מחיר'],
  ['waitlist', 'רשימת המתנה'],
  ['paidClaimAt', 'דיווח ששילם'],
  ['paid', 'שולם ✓'],
  ['mailStatus', 'מיילים'],
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_campaign', 'utm_campaign'],
  ['utm_content', 'utm_content'],
  ['utm_term', 'utm_term'],
  ['fbclid', 'fbclid'],
  ['ttclid', 'ttclid'],
  ['referrer_url', 'הגיע מ'],
  ['landing', 'דף כניסה'],
];

// ===== web endpoints =====

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (!allowRequest_()) return json_({ ok: false, error: 'busy' });
    var data = clean_(JSON.parse(String((e && e.postData && e.postData.contents) || '{}').slice(0, 20000)));
    if (data.type === 'contact') {
      addContact_(data);
      return json_({ ok: true });
    }
    var sheet = leadsSheet_();
    if (data.type === 'paid') markPaid_(sheet, data);
    else addLead_(sheet, data);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** The page asks how many seats are sold (only rows ticked as paid, plus seats sold outside the site). */
function doGet() {
  var s = stats_(leadsSheet_());
  return json_({ sold: s.soldSeats });
}

// ===== registration =====

function addLead_(sheet, data) {
  var existing = data.id ? findRow_(sheet, data.id) : 0;
  if (existing) {
    updateRow_(sheet, existing, data); // came back and fixed the details
    return;
  }
  appendLead_(sheet, data);
  if (NOTIFY_ON_REGISTER || data.waitlist === 'כן') {
    teamEmail_(
      data.waitlist === 'כן' ? 'רשימת המתנה לסדנה: ' + (data.name || '') : 'מילא/ה את הטופס: ' + (data.name || '') + ' (עוד לא שילם/ה)',
      personLines_(data),
      stats_(sheet),
      data.waitlist === 'כן' ? 'נכנס/ה לרשימת ההמתנה (הסדנה מלאה).' : ''
    );
  }
}

// ===== payment reported → entry code =====

function markPaid_(sheet, data) {
  var row = data.id ? findRow_(sheet, data.id) : 0;
  // a payment report must belong to a registration from the form; one without it is kept for the
  // team to check, but nobody gets an entry code by email from it (security audit 15.10)
  var unknown = !row;
  if (!row) row = appendLead_(sheet, data);
  else updateRow_(sheet, row, data);

  var claimCell = sheet.getRange(row, col_('paidClaimAt'));
  if (claimCell.getValue()) return; // already reported, emails already sent
  claimCell.setValue(new Date());

  var codeCell = sheet.getRange(row, col_('code'));
  var code = String(codeCell.getValue() || data.code || '');
  if (!code || codeTaken_(sheet, code, row)) code = newCode_(sheet);
  codeCell.setValue(code);
  data.code = code;

  var status = [];
  if (unknown) {
    status.push('הדיווח הגיע בלי הרשמה קודמת: לבדוק בביט ולשלוח את הקוד ידנית');
  } else if (validEmail_(data.email)) {
    try {
      participantEmail_(data);
      status.push('נשלח למשתתף/ת');
    } catch (err) {
      status.push('שגיאה במייל למשתתף/ת: ' + err);
    }
  } else {
    status.push('אין מייל תקין למשתתף/ת');
  }

  try {
    teamEmail_(
      'שולם: ' + (data.name || '') + ' · ' + (data.amount || '') + ' ש״ח · קוד ' + code,
      [['קוד כניסה', code]].concat(personLines_(data)),
      stats_(sheet),
      'לבדוק באפליקציית ביט שהתשלום נכנס, ואז לסמן ✓ בעמודת "שולם" בשורה ' + row + '.'
    );
    status.push('נשלח לצוות');
  } catch (err) {
    status.push('שגיאה במייל לצוות: ' + err);
  }
  sheet.getRange(row, col_('mailStatus')).setValue(status.join(' · '));
}

// ===== main site: "שיחת מיפוי" requests =====

function contactSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(CONTACT_TAB) || ss.insertSheet(CONTACT_TAB);
  var head = CONTACT_COLUMNS.map(function (c) { return c[1]; });
  var current = sh.getLastRow() ? sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].join('|') : '';
  if (current !== head.join('|')) {
    // New columns were added: rewrite the header row (data rows keep their order of arrival).
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat('dd.MM.yyyy HH:mm');
  }
  return sh;
}

var CHANNEL_LABELS = { form: 'טופס באתר', whatsapp: 'ווטסאפ' };

function addContact_(d) {
  d.channel = CHANNEL_LABELS[d.channel] || d.channel || CHANNEL_LABELS.form;
  if (d.email && !validEmail_(d.email)) d.email = String(d.email).trim();
  var sh = contactSheet_();
  sh.appendRow(CONTACT_COLUMNS.map(function (c) {
    if (c[0] === 'sentAt') return new Date();
    var v = d[c[0]];
    if (v === undefined || v === null) return '';
    if (c[0] === 'phone' && v) return "'" + v;
    return v;
  }));

  // The person: a short confirmation, only for the form (the WhatsApp message is its own confirmation).
  // While the website also sends to the app of יציאה מהלופ, the app sends this email (no duplicates).
  if (d.channel === CHANNEL_LABELS.form && validEmail_(d.email) && !d.confirm_by_app) {
    try {
      contactConfirmEmail_(d);
    } catch (err) {
      console.error('confirmation email failed', err);
    }
  }

  // While the website also sends to the app, the app emails the business inbox itself.
  if (d.confirm_by_app) return;
  var to = teamAddresses_();
  if (!to.length) return;
  var lines = [['שם', d.name], ['טלפון', d.phone], ['מייל', d.email], ['איך פנה/תה', d.channel], ['איפה זה עומד', d.stage], ['המטרה', d.goal], ['הרעיון', d.idea]].filter(function (l) { return l[1]; });
  var digits = String(d.phone || '').replace(/\D/g, '');
  var wa = digits ? 'https://wa.me/' + (digits.charAt(0) === '0' ? '972' + digits.slice(1) : digits) : '';
  var url = SpreadsheetApp.getActive().getUrl();
  var note = d.channel === CHANNEL_LABELS.whatsapp ? 'בחר/ה לשלוח בווטסאפ. אם ההודעה לא הגיעה, כדאי לכתוב לו/ה.' : 'ביקש/ה שנחזור לתיאום שיחת מיפוי.';
  var text = note + '\n\n' + lines.map(function (l) { return l[0] + ': ' + l[1]; }).join('\n') +
    (wa ? '\n\nלכתוב לו/ה בוואטסאפ: ' + wa : '') + '\n\nנשמר בגיליון, בלשונית "' + CONTACT_TAB + '": ' + url;
  var visit = VISIT_LINES.map(function (l) { return [l[1], d[l[0]]]; }).filter(function (l) { return l[1]; });
  if (visit.length) text = text.replace('\n\nנשמר בגיליון', '\n\nמאיפה הגיע/ה:\n' + visit.map(function (l) { return l[0] + ': ' + l[1]; }).join('\n') + '\n\nנשמר בגיליון');
  var html = '<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.5;color:#0e0d0c"><p style="margin:0">' + esc_(note) + '</p>' + table_(lines) +
    (visit.length ? '<p style="margin:20px 0 0;font-weight:bold">מאיפה הגיע/ה</p>' + table_(visit) : '') +
    (wa ? '<p style="margin:16px 0 0"><a href="' + wa + '" style="color:#a8321f;font-weight:bold">לכתוב לו/ה בוואטסאפ</a></p>' : '') +
    '<p style="margin:12px 0 0"><a href="' + url + '" style="color:#6b655c">לפתוח את הגיליון</a></p></div>';
  var opts = { to: to.join(','), subject: 'פנייה חדשה לשיחת מיפוי: ' + (d.name || '') + (d.channel === CHANNEL_LABELS.whatsapp ? ' (ווטסאפ)' : ''), body: text, htmlBody: html, name: 'יציאה מהלופ · האתר' };
  if (validEmail_(d.email)) opts.replyTo = String(d.email).trim();
  sendMail_(opts);
}

function contactConfirmEmail_(d) {
  var first = String(d.name || '').trim().split(/\s+/)[0] || '';
  var lines = [['טלפון', d.phone], ['איפה זה עומד', d.stage], ['המטרה', d.goal], ['הרעיון', d.idea]].filter(function (l) { return l[1]; });
  var text = 'היי ' + first + ',\n\nקיבלנו את הפרטים שלך לשיחת מיפוי. נחזור אליך בימים הקרובים לתאם 20 דקות, בלי התחייבות.\n\n' +
    lines.map(function (l) { return l[0] + ': ' + l[1]; }).join('\n') + '\n\nיציאה מהלופ';
  var html = '<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#0e0d0c;max-width:520px">' +
    '<p style="margin:0;font-size:18px"><b>היי ' + esc_(first) + ',</b></p>' +
    '<p style="margin:12px 0 0">קיבלנו את הפרטים שלך לשיחת מיפוי. נחזור אליך בימים הקרובים לתאם 20 דקות, בלי התחייבות.</p>' +
    (lines.length ? table_(lines) : '') +
    '<p style="margin:20px 0 0;color:#6b655c">יציאה מהלופ</p></div>';
  sendMail_({ to: String(d.email).trim(), subject: 'קיבלנו! נחזור אליך לתיאום שיחת מיפוי', body: text, htmlBody: html, name: 'יציאה מהלופ' });
}

// ===== emails =====

function participantEmail_(d) {
  var first = String(d.name || '').split(' ')[0];
  var rows = [
    ['כרטיס', d.ticket === 'זוג' ? 'זוג (2 כרטיסים)' + (d.pairName ? ', עם ' + d.pairName : '') : 'כרטיס אחד'],
    ['סכום', d.amount ? d.amount + ' ש״ח' : ''],
    ['מתי', EVENT_DATE],
    ['איפה', EVENT_PLACE || 'תל אביב. הכתובת המדויקת נשלחת לנרשמים בקבוצת הוואטסאפ.'],
  ].filter(function (r) { return r[1]; });
  var subject = 'קוד הכניסה שלך לסדנה של יציאה מהלופ: ' + d.code;
  var text =
    'היי ' + first + ',\n\n' +
    'נרשמת לסדנה של יציאה מהלופ. הצעד הראשון כבר מאחוריך.\n\n' +
    'קוד הכניסה שלך: ' + d.code + '\n' +
    'מציגים אותו בכניסה לסדנה.\n\n' +
    rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') +
    (GROUP_URL ? '\n\nקבוצת המשתתפים: ' + GROUP_URL : '') +
    '\n\nביטול עד 72 שעות לפני הסדנה — החזר מלא.\n\nיציאה מהלופ';
  var html =
    '<div dir="rtl" style="font-family:Arial,sans-serif;background:#f4efe6;padding:28px 18px;color:#0e0d0c">' +
    '<div style="max-width:520px;margin:0 auto;background:#fbf8f3;border-radius:18px;padding:28px 24px">' +
    '<p style="margin:0 0 6px;font-size:17px">היי ' + esc_(first) + ',</p>' +
    '<p style="margin:0 0 22px;font-size:17px;line-height:1.6">נרשמת לסדנה של יציאה מהלופ. הצעד הראשון כבר מאחוריך.</p>' +
    '<div style="background:#0e0d0c;border-radius:14px;padding:18px 20px;text-align:center">' +
    '<div style="color:#d6d2c8;font-size:14px">קוד הכניסה שלך</div>' +
    '<div dir="ltr" style="color:#e0442f;font-size:40px;font-weight:bold;letter-spacing:6px;margin-top:6px">' + esc_(d.code) + '</div>' +
    '<div style="color:#d6d2c8;font-size:14px;margin-top:6px">מציגים אותו בכניסה לסדנה</div></div>' +
    table_(rows) +
    (GROUP_URL ? '<p style="margin:18px 0 0"><a href="' + esc_(GROUP_URL) + '" style="color:#a8321f;font-weight:bold">להצטרפות לקבוצת המשתתפים</a></p>' : '') +
    '<p style="margin:18px 0 0;font-size:14px;color:#6b655c">ביטול עד 72 שעות לפני הסדנה — החזר מלא.</p>' +
    '</div></div>';
  var opts = { to: String(d.email).trim(), subject: subject, body: text, htmlBody: html, name: 'יציאה מהלופ' };
  var reply = teamAddresses_()[0];
  if (reply) opts.replyTo = reply;
  sendMail_(opts);
}

function teamEmail_(subject, lines, s, note) {
  var to = teamAddresses_();
  if (!to.length) return;
  var url = SpreadsheetApp.getActive().getUrl();
  var shown = lines.filter(function (l) { return l[1] !== undefined && l[1] !== null && String(l[1]) !== ''; });
  var totals = [
    ['נרשמו עד עכשיו', s.registered + ' (' + s.tickets + ' כרטיסים)'],
    ['דיווחו ששילמו', s.claimed],
    ['מקומות ששולמו ואומתו ✓', s.soldSeats],
    ['מקומות פנויים', s.left + ' מתוך ' + TOTAL_SEATS],
  ];
  if (s.waitlist) totals.push(['ברשימת המתנה', s.waitlist]);
  var text = shown.map(function (l) { return l[0] + ': ' + l[1]; }).join('\n') +
    '\n\n' + totals.map(function (l) { return l[0] + ': ' + l[1]; }).join('\n') +
    (note ? '\n\n' + note : '') + '\n\nהגיליון: ' + url;
  var html = '<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.5;color:#0e0d0c">' +
    table_(shown) +
    '<div style="margin:16px 0;padding:12px 14px;background:#f4efe6;border-radius:10px">' + table_(totals) + '</div>' +
    (note ? '<p style="margin:0 0 12px;font-weight:bold">' + esc_(note) + '</p>' : '') +
    '<p><a href="' + url + '" style="color:#a8321f;font-weight:bold">לפתוח את הגיליון</a></p></div>';
  sendMail_({ to: to.join(','), subject: subject, body: text, htmlBody: html, name: 'סדנת יציאה מהלופ' });
}

function personLines_(d) {
  return [
    ['שם', d.name],
    ['טלפון', d.phone],
    ['מייל', d.email],
    ['גיל', d.age],
    ['מה הכי מתאר', d.describe],
    ['מה ניסה עד היום', d.tried],
    ['המצב היום', d.status],
    ['הרעיון או העסק', d.idea],
    ['אינסטגרם', d.instagram],
    ['כרטיס', d.ticket === 'זוג' ? 'זוג (2 כרטיסים)' : 'יחיד'],
    ['השותף', d.pairName ? d.pairName + ' · ' + (d.pairPhone || '') : ''],
    ['סכום', d.amount ? d.amount + ' ש״ח (' + (d.tier || '') + ')' : ''],
    ['מי שלח', d.referrer],
    ['אישור הורה', d.parentOk],
    ['הגיע מ', [d.utm_source, d.utm_campaign].filter(function (v) { return v; }).join(' / ') || d.referrer_url],
  ];
}

// ===== totals =====

function stats_(sheet) {
  var values = sheet.getDataRange().getValues().slice(1);
  var i = {};
  COLUMNS.forEach(function (c, k) { i[c[0]] = k; });
  var s = { registered: 0, tickets: 0, claimed: 0, paidSeats: 0, waitlist: 0, revenue: 0, unpaid: [] };
  values.forEach(function (r) {
    if (!r[i.id] && !r[i.name]) return;
    if (r[i.waitlist] === 'כן') { s.waitlist++; return; }
    var seats = Number(r[i.seats]) || 1;
    s.registered++;
    s.tickets += seats;
    if (r[i.paidClaimAt]) s.claimed++;
    else s.unpaid.push(r[i.name] + (r[i.phone] ? ' (' + String(r[i.phone]).replace(/^'/, '') + ')' : ''));
    if (r[i.paid] === true) { s.paidSeats += seats; s.revenue += Number(r[i.amount]) || 0; }
  });
  s.outside = outsideSeats_();
  s.soldSeats = s.paidSeats + s.outside;
  s.left = Math.max(0, TOTAL_SEATS - s.soldSeats);
  return s;
}

/** "סיכום"!B6: seats sold outside the site (cash, a friend's Bit…), typed in by hand. */
function outsideSeats_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SUMMARY_TAB);
  return sh ? Number(sh.getRange('B6').getValue()) || 0 : 0;
}

// ===== evening summary =====

function dailySummary() {
  var sheet = leadsSheet_();
  var s = stats_(sheet);
  var today = Utilities.formatDate(new Date(), TZ, 'dd.MM.yyyy');
  var values = sheet.getDataRange().getValues().slice(1);
  var iName = col_('name') - 1;
  var iSent = col_('sentAt') - 1;
  var newToday = values.filter(function (r) { return day_(r[iSent]) === today; }).map(function (r) { return r[iName]; });
  teamEmail_(
    'סיכום ערב · סדנת יציאה מהלופ · ' + s.registered + ' נרשמו, ' + s.left + ' מקומות פנויים',
    [
      ['נרשמו היום', newToday.length ? newToday.length + ': ' + newToday.join(', ') : 'אף אחד'],
      ['מילאו טופס ועוד לא דיווחו על תשלום', s.unpaid.length ? s.unpaid.join(', ') : 'אין'],
    ],
    s,
    ''
  );
}

// ===== one-time setup =====

function setup() {
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(TZ);
  var sheet = leadsSheet_();
  sheet.setRightToLeft(true);

  contactSheet_();
  var sum = ss.getSheetByName(SUMMARY_TAB) || ss.insertSheet(SUMMARY_TAB, 0);
  sum.setRightToLeft(true);
  var L = function (k) { return "'" + LEADS_TAB + "'!" + letter_(col_(k)) + '2:' + letter_(col_(k)); };
  var rows = [
    ['נרשמו (בלי רשימת המתנה)', '=COUNTIFS(' + L('name') + ',"<>",' + L('waitlist') + ',"<>כן")'],
    ['כרטיסים שהוזמנו', '=SUMIFS(' + L('seats') + ',' + L('waitlist') + ',"<>כן")'],
    ['דיווחו ששילמו', '=COUNTIF(' + L('paidClaimAt') + ',"<>")'],
    ['מקומות ששולמו (סומנו ✓)', '=SUMIFS(' + L('seats') + ',' + L('paid') + ',TRUE)'],
    ['הכנסה שאומתה (ש״ח)', '=SUMIFS(' + L('amount') + ',' + L('paid') + ',TRUE)'],
    ['מקומות שנמכרו מחוץ לאתר (להקליד ידנית)', 0],
    ['מקומות פנויים', '=MAX(0,' + TOTAL_SEATS + '-B4-B6)'],
    ['ברשימת המתנה', '=COUNTIF(' + L('waitlist') + ',"כן")'],
  ];
  sum.getRange(1, 1, rows.length, 2).setValues(rows);
  sum.getRange(1, 1, rows.length, 1).setFontWeight('bold');
  sum.getRange('B6').setBackground('#fff6d6');
  sum.setColumnWidth(1, 320);

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailySummary') ScriptApp.deleteTrigger(t);
  });
  if (DAILY_SUMMARY_HOUR >= 0) {
    ScriptApp.newTrigger('dailySummary').timeBased().atHour(DAILY_SUMMARY_HOUR).everyDays(1).inTimezone(TZ).create();
  }
  MailApp.getRemainingDailyQuota(); // asks for the mail permission now, during setup
}

/** Run from the editor: sends a sample participant email and a sample team email to the script owner. */
function testEmail() {
  var me = Session.getEffectiveUser().getEmail();
  var sample = { name: 'דוגמה לבדיקה', email: me, phone: '0500000000', age: '24', describe: 'רוצה להתחיל', tried: 'תוכן ברשת', status: 'סטודנט', idea: 'משפט לדוגמה', ticket: 'יחיד', amount: 49, tier: 'מחיר השקה', code: 'TEST42' };
  participantEmail_(sample);
  teamEmail_('בדיקה: ככה ייראה מייל התשלום לצוות', [['קוד כניסה', 'TEST42']].concat(personLines_(sample)), stats_(leadsSheet_()), 'זה מייל בדיקה.');
}

// ===== helpers =====

function leadsSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(LEADS_TAB);
  if (!sheet) {
    sheet = ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0 ? ss.getSheets()[0].setName(LEADS_TAB) : ss.insertSheet(LEADS_TAB);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(function (c) { return c[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    ['sentAt', 'paidClaimAt'].forEach(function (k) { sheet.getRange(2, col_(k), sheet.getMaxRows() - 1, 1).setNumberFormat('dd.MM.yyyy HH:mm'); });
  }
  return sheet;
}

function appendLead_(sheet, data) {
  data.seats = Number(data.seats) || (data.ticket === 'זוג' ? 2 : 1);
  var values = rowFrom_(data);
  values[col_('sentAt') - 1] = new Date();
  values[col_('paidClaimAt') - 1] = '';
  values[col_('mailStatus') - 1] = '';
  sheet.appendRow(values);
  var row = sheet.getLastRow();
  sheet.getRange(row, col_('paid')).insertCheckboxes();
  return row;
}

/** Refresh a row with newer form details, keeping the time, the code, the payment report and the ✓. */
function updateRow_(sheet, row, data) {
  var keep = ['id', 'code', 'sentAt', 'paidClaimAt', 'paid', 'mailStatus'];
  var vals = rowFrom_(data);
  COLUMNS.forEach(function (c, k) {
    if (keep.indexOf(c[0]) >= 0) return;
    if (data[c[0]] === undefined) return;
    sheet.getRange(row, k + 1).setValue(vals[k]);
  });
}

function rowFrom_(data) {
  return COLUMNS.map(function (c) {
    var k = c[0];
    if (k === 'paid') return false;
    var v = data[k];
    if (v === undefined || v === null) return '';
    // keep phone numbers as text so the leading 0 stays
    if ((k === 'phone' || k === 'pairPhone') && v) return "'" + v;
    return v;
  });
}

function findRow_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var ids = sheet.getRange(2, col_('id'), last - 1, 1).getValues();
  for (var r = 0; r < ids.length; r++) if (String(ids[r][0]) === String(id)) return r + 2;
  return 0;
}

function codeTaken_(sheet, code, exceptRow) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var codes = sheet.getRange(2, col_('code'), last - 1, 1).getValues();
  for (var r = 0; r < codes.length; r++) if (r + 2 !== exceptRow && String(codes[r][0]) === String(code)) return true;
  return false;
}

function newCode_(sheet) {
  var abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  for (;;) {
    var c = '';
    for (var i = 0; i < 6; i++) c += abc.charAt(Math.floor(Math.random() * abc.length));
    if (!codeTaken_(sheet, c, 0)) return c;
  }
}

function teamAddresses_() {
  var list = NOTIFY_EMAILS.slice();
  var seen = {};
  return list.filter(function (a) {
    var k = String(a).trim().toLowerCase();
    if (!k || seen[k]) return false;
    seen[k] = true;
    return true;
  });
}

function validEmail_(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
}

function table_(rows) {
  return '<table style="border-collapse:collapse;font-size:15px;margin-top:16px">' + rows.map(function (l) {
    return '<tr><td style="padding:4px 0 4px 16px;color:#6b655c;white-space:nowrap;vertical-align:top">' + esc_(l[0]) + '</td><td style="padding:4px 0;color:#0e0d0c">' + esc_(l[1]) + '</td></tr>';
  }).join('') + '</table>';
}

function esc_(v) {
  return String(v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

function col_(key) {
  for (var k = 0; k < COLUMNS.length; k++) if (COLUMNS[k][0] === key) return k + 1;
  throw new Error('no column ' + key);
}

function letter_(n) {
  var s = '';
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function day_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'dd.MM.yyyy') : String(v).slice(0, 10);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


// ===== protection (security audit 15.10) =====
/** At most this many emails a day from the script (Gmail's own cap is 100). */
var MAX_MAILS_PER_DAY = 60;
/** At most this many emails a day to the same address. */
var MAX_MAILS_PER_ADDRESS = 3;
/** At most this many requests from the websites per 10 minutes, all visitors together. */
var MAX_POSTS_PER_10_MIN = 60;

function allowRequest_() {
  var cache = CacheService.getScriptCache();
  var key = 'posts_' + Math.floor(Date.now() / 600000);
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 900);
  return n <= MAX_POSTS_PER_10_MIN;
}

/** Only short text values, never more than 80 fields, so junk cannot flood the sheet. */
function clean_(data) {
  var out = {};
  if (!data || typeof data !== 'object') return out;
  Object.keys(data).slice(0, 80).forEach(function (k) {
    var v = data[k];
    if (v === null || v === undefined) return;
    if (typeof v === 'boolean' || typeof v === 'number') { out[k] = v; return; }
    out[String(k).slice(0, 40)] = String(v).slice(0, 600);
  });
  return out;
}

/** MailApp.sendEmail with a daily ceiling and a per-address ceiling. Over the limit it throws (the caller logs it). */
function sendMail_(opts) {
  var props = PropertiesService.getScriptProperties();
  var day = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var key = 'mails_' + day;
  var sent = Number(props.getProperty(key) || 0);
  if (sent >= MAX_MAILS_PER_DAY) throw new Error('daily email limit reached');
  var cache = CacheService.getScriptCache();
  var to = String(opts.to || '').toLowerCase();
  var toKey = 'to_' + day + '_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, to));
  var toSent = Number(cache.get(toKey) || 0);
  if (to.indexOf(',') < 0 && toSent >= MAX_MAILS_PER_ADDRESS) throw new Error('too many emails to this address today');
  MailApp.sendEmail(opts);
  props.setProperty(key, String(sent + 1));
  cache.put(toKey, String(toSent + 1), 21600);
}
