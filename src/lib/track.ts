import { CONFIG } from '../config'

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyFn = (...args: any[]) => void
declare global {
  interface Window {
    fbq?: AnyFn & { queue?: unknown[]; loaded?: boolean; version?: string; push?: AnyFn; callMethod?: AnyFn }
    _fbq?: unknown
    ttq?: any
    TiktokAnalyticsObject?: string
  }
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid'] as const
const STORE_KEY = 'ootl-attribution'

/** Keep where the visitor came from for the whole visit (the form sends it with the lead). */
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search)
    const found: Record<string, string> = {}
    UTM_KEYS.forEach((k) => {
      const v = params.get(k)
      if (v) found[k] = v
    })
    const prev = JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}')
    const merged = { ...prev, ...found }
    if (!merged.referrer_url && document.referrer) merged.referrer_url = document.referrer
    if (!merged.landing) merged.landing = window.location.pathname + window.location.search
    sessionStorage.setItem(STORE_KEY, JSON.stringify(merged))
  } catch {
    /* storage can be blocked; attribution is a nice-to-have */
  }
}

export function attribution(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

function loadMeta(id: string) {
  if (window.fbq) return
  const f: any = function (...args: unknown[]) {
    if (f.callMethod) f.callMethod(...args)
    else f.queue.push(args)
  }
  f.push = f
  f.loaded = true
  f.version = '2.0'
  f.queue = []
  window.fbq = f
  window._fbq = f
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)
  window.fbq!('init', id)
  window.fbq!('track', 'PageView')
}

function loadTikTok(id: string) {
  if (window.ttq) return
  window.TiktokAnalyticsObject = 'ttq'
  const ttq: any = (window.ttq = window.ttq || [])
  ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent']
  ttq.setAndDefer = (t: any, e: string) => {
    t[e] = (...args: unknown[]) => t.push([e, ...args])
  }
  ttq.methods.forEach((m: string) => ttq.setAndDefer(ttq, m))
  ttq.load = (e: string) => {
    const url = 'https://analytics.tiktok.com/i18n/pixel/events.js'
    ttq._i = ttq._i || {}
    ttq._i[e] = []
    ttq._t = ttq._t || {}
    ttq._t[e] = +new Date()
    ttq._o = ttq._o || {}
    const s = document.createElement('script')
    s.async = true
    s.src = `${url}?sdkid=${e}&lib=ttq`
    document.head.appendChild(s)
  }
  ttq.load(id)
  ttq.page()
}

export function initPixels() {
  const { metaId, tiktokId } = CONFIG.pixels
  if (metaId) loadMeta(metaId)
  if (tiktokId) loadTikTok(tiktokId)
}

/** Form sent: the brief's "Lead" event on both pixels. */
export function trackLead(value: number) {
  window.fbq?.('track', 'Lead', { value, currency: 'ILS' })
  window.ttq?.track?.('Lead', { value, currency: 'ILS' })
}

/** Thank-you screen: "Purchase", once per visit. */
export function trackPurchase(value: number) {
  try {
    if (sessionStorage.getItem('ootl-purchase-sent')) return
    sessionStorage.setItem('ootl-purchase-sent', '1')
  } catch {
    /* fire anyway */
  }
  window.fbq?.('track', 'Purchase', { value, currency: 'ILS' })
  window.ttq?.track?.('Purchase', { value, currency: 'ILS' })
}
