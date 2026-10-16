/**
 * Everything that changes between now and the workshop lives here.
 * Empty strings are "still missing": the page hides them in the live build
 * and marks them in dev (npm run dev) so nothing is forgotten.
 */
export const CONFIG = {
  /** The page's public address, used in the WhatsApp share message. Empty = the current address. */
  siteUrl: 'https://israelmeirwow-cell.github.io/ootl-workshop/',


  event: {
    city: 'תל אביב',
    /** e.g. 'יום ה׳, 12.11' */
    date: '',
    /** e.g. '17:00–21:00' */
    hours: '',
  },

  seats: {
    /** Seats already PAID (a pair counts as 2). Update by hand after each payment. */
    sold: 0,
    /**
     * Optional: the Google Apps Script web app URL (apps-script/Code.gs). When set,
     * the page reads the live "sold" number from the sheet instead of the number above.
     */
    remoteUrl: 'https://script.google.com/macros/s/AKfycbyjMaRoidcgZq-V-BtKyFh3Mh6S0LS2wc5E-f_dElTyQ0iGZbSzq7NYMGhiHUMl3bkkRw/exec',
  },

  /** Price ladder from the brief. Seats per tier add up to 25. */
  tiers: [
    { name: 'מחיר השקה', label: 'הראשונים', seats: 12, single: 49, pair: 89 },
    { name: 'שלב שני', label: 'הבאים', seats: 8, single: 69, pair: 119 },
    { name: 'מקומות אחרונים', label: 'האחרונים', seats: 5, single: 97, pair: 159 },
  ],
  /** Shown struck through next to the current price while it is lower. */
  fullPrice: 97,

  payment: {
    /**
     * A link that opens Bit straight on the receiving number. Two kinds work:
     *  - the personal Bit link from the Bit app (the personal QR code → share as a link), or
     *  - a payment-provider page with Bit (Grow / Morning / PayMe…). There, {amount} is replaced by the sum,
     *    and the provider can send paying visitors back to <siteUrl>/?paid=1.
     */
    bitUrl: 'https://www.bitpay.co.il/app/me/26A865C1-D0D1-457C-8972-5DCF74A68D91',
    /** The Bit number that receives the money, e.g. '050-1234567'. Shown with a copy button (also next to the link). */
    bitPhone: '055-553-0881',
    /** Optional credit-card payment page (same {amount} rule). Leave empty to offer Bit only. */
    cardUrl: '',
  },

  /**
   * Google Apps Script web app URL (apps-script/Code.gs): every registration becomes a row in the sheet;
   * "סיימתי לשלם" emails the participant their entry code and emails Raz the full summary with the code.
   * Put the same URL in seats.remoteUrl. (Every submission is also kept in Netlify Forms as a backup.)
   */
  leadsEndpoint: 'https://script.google.com/macros/s/AKfycbyjMaRoidcgZq-V-BtKyFh3Mh6S0LS2wc5E-f_dElTyQ0iGZbSzq7NYMGhiHUMl3bkkRw/exec',

  /** Invite link of the participants' WhatsApp group (thank-you screen). */
  whatsappGroupUrl: '',

  pixels: {
    metaId: '',
    tiktokId: '',
  },

  /** Real photos only. Put the files in public/images/ and write their path, e.g. '/images/raz.jpg'. */
  photos: {
    hero: '',
    raz: '/images/raz.jpg',
    partner: '/images/levav.jpg',
    alon: '',
    miriam: '',
  },

  team: {
    /** Raz's Instagram (display name "רז בזק | יוצאות מהלופ"), shown on her card, under her quote and in the footer. */
    razInstagram: 'https://www.instagram.com/raz_bezek_/',
    partnerName: 'לבב מלכה',
    /** One or two sentences, first person. */
    /** Levav's own words (Israel's WhatsApp note, 16.10.2026). */
    partnerText:
      '״היו לי אינסוף רעיונות, וכל אחד מהם הרגיש כמו הדבר הבא שלי. הייתי מתחילה משהו, משקיעה בו, חוקרת ולומדת, ואז פתאום היה צץ רעיון חדש שהלהיב אותי יותר, והייתי עוברת אליו. ככה מצאתי את עצמי קופצת בין כיוונים, מתחילה שוב ושוב, אבל מתקשה להתמיד בדרך אחת ולבנות ממנה משהו אמיתי. עד שהבנתי שאני לא צריכה עוד רעיון, אלא את היכולת לבחור כיוון, להתמקד בו ולהתחיל להפוך אותו למציאות. ומשם התפתחה יציאה מהלופ.״',
    alonText: '',
    miriamSurname: '',
    miriamText: '',
  },
}

export type Tier = (typeof CONFIG.tiers)[number]
