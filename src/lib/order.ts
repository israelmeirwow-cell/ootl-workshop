import { CONFIG } from '../config'
import { attribution } from './track'

export interface Lead {
  name: string
  phone: string
  email: string
  age: string
  instagram: string
  describe: string
  tried: string[]
  status: string
  idea: string
  pairName: string
  pairPhone: string
  referrer: string
  parentOk: boolean
}

export interface Order {
  /** Joins the registration and the "I paid" report into one row in the sheet. */
  id: string
  /** The entry code: shown on the thank-you screen and emailed to the participant and the team. */
  code: string
  lead: Lead
  pair: boolean
  amount: number
  tierName: string
  waitlist: boolean
}

const ORDER_KEY = 'ootl-order'

export function saveOrder(o: Order) {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(o))
  } catch {
    /* the flow still works inside this tab */
  }
}

export function loadOrder(): Order | null {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY)
    return raw ? (JSON.parse(raw) as Order) : null
  } catch {
    return null
  }
}

/** 6 characters people can read out at the door: no 0/O or 1/I/L. */
export function newEntryCode() {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const out: string[] = []
  try {
    const r = crypto.getRandomValues(new Uint32Array(6))
    r.forEach((n) => out.push(abc[n % abc.length]))
  } catch {
    for (let i = 0; i < 6; i++) out.push(abc[Math.floor(Math.random() * abc.length)])
  }
  return out.join('')
}

export function newOrderId() {
  try {
    return crypto.randomUUID().slice(0, 8)
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

function payload(type: 'lead' | 'paid', o: Order): Record<string, unknown> {
  return {
    type,
    id: o.id,
    code: o.code,
    ...attribution(),
    ...o.lead,
    tried: o.lead.tried.join(', '),
    parentOk: o.lead.parentOk ? 'כן' : '',
    ticket: o.pair ? 'זוג' : 'יחיד',
    seats: o.pair ? 2 : 1,
    amount: o.amount,
    tier: o.tierName,
    waitlist: o.waitlist ? 'כן' : '',
  }
}

/**
 * Posts to the Google Apps Script web app (apps-script/Code.gs), which writes the sheet and emails the team.
 * text/plain + no-cors avoids the CORS preflight Apps Script cannot answer; the response is opaque,
 * so a network failure is the only error we can see. keepalive lets it finish if the visitor leaves.
 */
async function post(body: Record<string, unknown>) {
  await Promise.allSettled([toSheet(body), toNetlify(body)])
}

async function toSheet(body: Record<string, unknown>) {
  const url = CONFIG.leadsEndpoint
  if (!url) {
    if (import.meta.env.DEV) console.info('[dev] leadsEndpoint is empty; not sent to the sheet', body)
    return
  }
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
}

/**
 * Backup copy in Netlify Forms (Netlify dashboard → Forms), so no registration is lost even if the sheet
 * is not connected or fails. The form names and fields are declared in public/__forms.html.
 */
async function toNetlify(body: Record<string, unknown>) {
  if (import.meta.env.DEV || !window.location.hostname.endsWith('netlify.app')) return
  const form = body.type === 'paid' ? 'payments' : 'registrations'
  const data = new URLSearchParams({ 'form-name': form })
  Object.entries(body).forEach(([k, v]) => data.append(k, v === undefined || v === null ? '' : String(v)))
  await fetch('/__forms.html', {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data.toString(),
  })
}

/** The registration: a new row in the sheet and an email to the team. */
export function sendLead(o: Order) {
  return post(payload('lead', o))
}

/** "סיימתי לשלם": marks the row and emails the team to check Bit. Sent once per order. */
export function sendPaidClaim(o: Order) {
  const key = `ootl-claim-${o.id}`
  try {
    if (sessionStorage.getItem(key)) return Promise.resolve()
    sessionStorage.setItem(key, '1')
  } catch {
    /* send anyway; the sheet ignores repeats */
  }
  return post(payload('paid', o)).catch(() => {
    /* the thank-you screen must not depend on this */
  })
}

export function payUrl(template: string, amount: number) {
  return template.replace(/\{amount\}/g, String(amount))
}

/** Israeli phone: 05X-XXXXXXX, landlines, or +972. Returns digits only when valid. */
export function normalizePhone(v: string) {
  let d = v.replace(/[^\d+]/g, '')
  if (d.startsWith('+972')) d = '0' + d.slice(4)
  else if (d.startsWith('972')) d = '0' + d.slice(3)
  d = d.replace(/\D/g, '')
  return /^0\d{8,9}$/.test(d) ? d : ''
}
