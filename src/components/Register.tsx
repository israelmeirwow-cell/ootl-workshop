import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Copy, CreditCard, DeviceMobile } from '@phosphor-icons/react'
import PixelButton from './PixelButton'
import { Container, Pending, SectionTitle, isDev, shekel, useCtaLabel } from './ui'
import useIsMobile from '../hooks/useIsMobile'
import { FORM } from '../content'
import { CONFIG } from '../config'
import { useSeats } from '../lib/seats'
import { newEntryCode, newOrderId, normalizePhone, payUrl, saveOrder, sendLead, sendPaidClaim, type Lead, type Order } from '../lib/order'
import { trackLead } from '../lib/track'

const ease = [0.16, 1, 0.3, 1] as const

type Errors = Partial<Record<keyof Lead | 'send', string>>

const EMPTY: Lead = {
  name: '',
  phone: '',
  email: '',
  age: '',
  instagram: '',
  describe: '',
  tried: [],
  status: '',
  idea: '',
  pairName: '',
  pairPhone: '',
  referrer: '',
  parentOk: false,
}

/* ---------- fields ---------- */

const inputCls = (bad: boolean) =>
  `block w-full rounded-[14px] border bg-paper px-4 py-3 text-[17px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink/55 focus:border-ink focus:shadow-[0_0_0_3px_rgba(224,68,47,0.25)] ${
    bad ? 'border-claret' : 'border-ink/20 hover:border-ink/40'
  }`

function Field({ id, label, optional, error, children }: { id: string; label: string; optional?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-[16px] font-semibold text-ink">
        {label}
        {optional ? <span className="ms-1 font-normal text-ink/55">{FORM.optional}</span> : <span className="ms-0.5 text-claret-deep" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-[15px] font-medium text-claret-deep">
          {error}
        </p>
      )}
    </div>
  )
}

function Chips({
  name,
  legend,
  hint,
  options,
  value,
  multi,
  error,
  onChange,
}: {
  name: string
  legend: string
  hint?: string
  options: string[]
  value: string | string[]
  multi?: boolean
  error?: string
  onChange: (v: string) => void
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0" aria-describedby={error ? `${name}-err` : undefined}>
      <legend className="mb-3 text-[16px] font-semibold">
        {legend}
        {hint && <span className="ms-1 font-normal text-ink/55">({hint})</span>}
        <span className="ms-0.5 text-claret-deep" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = multi ? (value as string[]).includes(o) : value === o
          return (
            <label
              key={o}
              className={`relative inline-flex min-h-[46px] cursor-pointer select-none items-center gap-2 rounded-full border px-4 text-[16px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-claret ${
                on ? 'border-ink bg-ink text-paper' : 'border-ink/20 bg-paper text-ink hover:border-ink/45'
              }`}
            >
              <input type={multi ? 'checkbox' : 'radio'} name={name} value={o} checked={on} onChange={() => onChange(o)} className="sr-only" />
              {multi && (
                <span className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${on ? 'border-paper bg-paper text-ink' : 'border-ink/35'}`} aria-hidden="true">
                  {on && <Check size={11} weight="bold" />}
                </span>
              )}
              {o}
            </label>
          )
        })}
      </div>
      {error && (
        <p id={`${name}-err`} role="alert" className="text-[15px] font-medium text-claret-deep">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/* ---------- validation ---------- */

function validate(v: Lead): Errors {
  const e: Errors = {}
  if (v.name.trim().split(/\s+/).filter(Boolean).length < 1) e.name = 'חסר שם מלא.'
  if (!normalizePhone(v.phone)) e.phone = 'מספר הטלפון לא תקין. כדאי לבדוק שהוקלד במלואו.'
  if (!v.email.trim()) e.email = 'חסר מייל. לשם יישלח קוד הכניסה.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'כתובת המייל לא תקינה. כדאי לבדוק שאין רווח או אות חסרה.'
  const age = Number(v.age)
  if (!v.age.trim()) e.age = 'חסר גיל.'
  else if (!Number.isFinite(age) || age < 10 || age > 99) e.age = 'הגיל לא תקין.'
  else if (age < 16) e.age = 'הסדנה מגיל 16.'
  else if (age < 18 && !v.parentOk) e.parentOk = 'מתחת לגיל 18 צריך אישור הורה כדי להירשם.'
  if (!v.describe) e.describe = 'צריך לבחור אחת מהאפשרויות.'
  if (!v.tried.length) e.tried = 'צריך לבחור לפחות אחת מהאפשרויות.'
  if (!v.status) e.status = 'צריך לבחור אחת מהאפשרויות.'
  if (!v.idea.trim()) e.idea = 'חסר משפט על הרעיון או העסק.'
  if (v.pairName.trim() && !normalizePhone(v.pairPhone)) e.pairPhone = 'חסר טלפון תקין של השותף.'
  if (!v.pairName.trim() && v.pairPhone.trim()) e.pairName = 'חסר שם של השותף.'
  return e
}

const ORDER: (keyof Errors)[] = ['name', 'phone', 'email', 'age', 'parentOk', 'describe', 'tried', 'status', 'idea', 'pairName', 'pairPhone']

/* ---------- the form ---------- */

function LeadForm({ existing, onDone }: { existing?: Order | null; onDone: (o: Order) => void }) {
  const s = useSeats()
  const [v, setV] = useState<Lead>(existing?.lead ?? EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const label = useCtaLabel(false)
  const set = <K extends keyof Lead>(k: K, val: Lead[K]) => {
    setV((p) => ({ ...p, [k]: val }))
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }))
  }
  const minor = Number(v.age) >= 16 && Number(v.age) < 18

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate(v)
    setErrors(e)
    const first = ORDER.find((k) => e[k])
    if (first) {
      const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] textarea`)
      el?.focus({ preventScroll: true })
      formRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const pair = !!v.pairName.trim()
    const order: Order = {
      // going back to fix details keeps the same id and code, so the sheet does not get a second row
      id: existing?.id ?? newOrderId(),
      code: existing?.code ?? newEntryCode(),
      lead: { ...v, email: v.email.trim(), phone: normalizePhone(v.phone), pairPhone: pair ? normalizePhone(v.pairPhone) : '' },
      pair,
      amount: pair ? s.tier.pair : s.tier.single,
      tierName: s.tier.name,
      waitlist: s.full,
    }
    setBusy(true)
    try {
      await sendLead(order)
      saveOrder(order)
      trackLead(order.amount)
      onDone(order)
    } catch {
      setErrors({ send: 'השליחה לא הצליחה. כדאי לבדוק את החיבור לאינטרנט ולנסות שוב.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <div data-field="name">
          <Field id="f-name" label={FORM.name} error={errors.name}>
            <input id="f-name" name="name" autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'f-name-err' : undefined} className={inputCls(!!errors.name)} />
          </Field>
        </div>
        <div data-field="phone">
          <Field id="f-phone" label={FORM.phone} error={errors.phone}>
            <input id="f-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={v.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'f-phone-err' : undefined} className={`${inputCls(!!errors.phone)} text-right`} placeholder="050-0000000" />
          </Field>
        </div>
        <div data-field="email">
          <Field id="f-email" label={FORM.email} error={errors.email}>
            <input id="f-email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" autoCapitalize="none" value={v.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'f-email-err' : 'f-email-hint'} className={`${inputCls(!!errors.email)} text-right`} />
            {!errors.email && (
              <p id="f-email-hint" className="text-[14px] text-ink/60">
                {FORM.emailHint}
              </p>
            )}
          </Field>
        </div>
        <div data-field="age">
          <Field id="f-age" label={FORM.age} error={errors.age}>
            <input id="f-age" name="age" inputMode="numeric" maxLength={2} value={v.age} onChange={(e) => set('age', e.target.value.replace(/\D/g, ''))} aria-invalid={!!errors.age} aria-describedby={errors.age ? 'f-age-err' : undefined} className={inputCls(!!errors.age)} />
          </Field>
        </div>
        <div data-field="instagram">
          <Field id="f-ig" label={FORM.instagram} optional>
            <input id="f-ig" name="instagram" dir="ltr" autoCapitalize="none" value={v.instagram} onChange={(e) => set('instagram', e.target.value)} className={`${inputCls(false)} text-right`} placeholder="@" />
          </Field>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {minor && (
          <motion.div data-field="parentOk" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-cream p-4 text-[16px]">
              <input type="checkbox" checked={v.parentOk} onChange={(e) => set('parentOk', e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#e0442f]" />
              <span>{FORM.parent}</span>
            </label>
            {errors.parentOk && (
              <p role="alert" className="mt-2 text-[15px] font-medium text-claret-deep">
                {errors.parentOk}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div data-field="describe">
        <Chips name="describe" legend={FORM.describe.label} options={FORM.describe.options} value={v.describe} error={errors.describe} onChange={(o) => set('describe', o)} />
      </div>
      <div data-field="tried">
        <Chips
          name="tried"
          legend={FORM.tried.label}
          hint={FORM.tried.hint}
          options={FORM.tried.options}
          value={v.tried}
          multi
          error={errors.tried}
          onChange={(o) => set('tried', v.tried.includes(o) ? v.tried.filter((x) => x !== o) : [...v.tried, o])}
        />
      </div>
      <div data-field="status">
        <Chips name="status" legend={FORM.status.label} options={FORM.status.options} value={v.status} error={errors.status} onChange={(o) => set('status', o)} />
      </div>

      <div data-field="idea">
        <Field id="f-idea" label={FORM.idea.label} error={errors.idea}>
          <textarea id="f-idea" name="idea" rows={2} value={v.idea} onChange={(e) => set('idea', e.target.value)} placeholder={FORM.idea.placeholder} aria-invalid={!!errors.idea} aria-describedby={errors.idea ? 'f-idea-err' : undefined} className={`${inputCls(!!errors.idea)} resize-y`} />
        </Field>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 text-[16px] font-semibold">
          {FORM.pair} <span className="font-normal text-ink/55">{FORM.optional}</span>
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-field="pairName">
            <input aria-label={FORM.pairName} placeholder={FORM.pairName} autoComplete="off" value={v.pairName} onChange={(e) => set('pairName', e.target.value)} aria-invalid={!!errors.pairName} className={inputCls(!!errors.pairName)} />
            {errors.pairName && <p role="alert" className="mt-2 text-[15px] font-medium text-claret-deep">{errors.pairName}</p>}
          </div>
          <div data-field="pairPhone">
            <input aria-label={FORM.pairPhone} placeholder={FORM.pairPhone} type="tel" inputMode="tel" dir="ltr" autoComplete="off" value={v.pairPhone} onChange={(e) => set('pairPhone', e.target.value)} aria-invalid={!!errors.pairPhone} className={`${inputCls(!!errors.pairPhone)} text-right placeholder:text-right`} />
            {errors.pairPhone && <p role="alert" className="mt-2 text-[15px] font-medium text-claret-deep">{errors.pairPhone}</p>}
          </div>
        </div>
      </fieldset>

      <div data-field="referrer">
        <Field id="f-ref" label={FORM.referrer} optional>
          <input id="f-ref" name="referrer" value={v.referrer} onChange={(e) => set('referrer', e.target.value)} className={inputCls(false)} />
        </Field>
      </div>

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-7">
        {errors.send && (
          <p role="alert" className="text-[15px] font-medium text-claret-deep">
            {errors.send}
          </p>
        )}
        <PixelButton as="button" type="submit" disabled={busy} className="flex min-h-[60px] w-full items-center rounded-[18px] bg-claret px-7 text-[19px] font-bold sm:w-auto sm:self-start">
          {busy ? 'שולחים…' : s.full ? label : FORM.submit}
        </PixelButton>
        <p className="text-[15px] leading-[1.5] text-ink/65">{FORM.under}</p>
      </div>
    </form>
  )
}

/* ---------- payment ---------- */

/** The Bit link as a QR, for desktop visitors who pay from their phone. Loaded only when needed. */
function Qr({ text }: { text: string }) {
  const [qr, setQr] = useState<{ d: string; n: number } | null>(null)
  useEffect(() => {
    let alive = true
    import('qrcode-generator').then(({ default: qrcode }) => {
      const q = qrcode(0, 'M')
      q.addData(text)
      q.make()
      const n = q.getModuleCount()
      let d = ''
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
      if (alive) setQr({ d, n })
    })
    return () => {
      alive = false
    }
  }, [text])
  if (!qr) return <span className="block h-40 w-40 rounded-[14px] bg-paper" aria-hidden="true" />
  return (
    <svg viewBox={`-2 -2 ${qr.n + 4} ${qr.n + 4}`} className="h-40 w-40 rounded-[14px] bg-paper" shapeRendering="crispEdges" role="img" aria-label="קוד QR לתשלום בביט">
      <path d={qr.d} fill="#0e0d0c" />
    </svg>
  )
}

function CopyNumber({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value.replace(/\D/g, '')).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1800)
        })
      }}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-ink/20 px-4 text-[15px] font-semibold hover:border-ink/50"
    >
      {done ? <Check size={16} weight="bold" aria-hidden /> : <Copy size={16} aria-hidden />}
      {done ? 'הועתק' : 'העתקת המספר'}
    </button>
  )
}

function Payment({ order, onBack, onPaid }: { order: Order; onBack: () => void; onPaid: () => void }) {
  const isMobile = useIsMobile()
  const { bitUrl, bitPhone, cardUrl } = CONFIG.payment
  const bit = bitUrl ? payUrl(bitUrl, order.amount) : ''
  // A personal Bit link opens Bit on the number but cannot carry the sum, so the sum is shown to type in.
  const typedAmount = !bitUrl.includes('{amount}')
  // A personal link (bitpay.co.il/app/me/…) only works on a phone, where it opens the Bit app;
  // on a computer the QR is the way in, so the button is not shown there.
  const phoneOnlyLink = /bitpay\.co\.il\/app\/me\//.test(bitUrl)
  const showBitButton = !!bit && (isMobile || !phoneOnlyLink)
  // A transfer to a number has no page to come back from, so "done" shows right away.
  const [started, setStarted] = useState(!!bitPhone)
  const done = () => {
    void sendPaidClaim(order)
    onPaid()
  }
  const card = cardUrl ? payUrl(cardUrl, order.amount) : ''
  const nothing = !bit && !bitPhone && !card
  const btn = 'flex min-h-[60px] w-full items-center rounded-[18px] px-6 text-[19px] font-bold'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[22px] bg-ink p-6 text-paper lg:p-8">
        <div>
          <p className="text-[15px] text-paper/70">
            {order.pair ? '2 כרטיסים' : 'כרטיס אחד'} · {order.tierName}
          </p>
          <p className="mt-1 text-[17px] font-semibold">{order.lead.name}</p>
        </div>
        <p className="tabular text-[44px] font-extrabold leading-none text-claret lg:text-[56px]">{shekel(order.amount)}</p>
      </div>

      <div className="flex flex-col gap-4">
        {(bit || bitPhone) && (
          <div className="flex flex-col gap-6 rounded-[22px] border border-ink/15 bg-paper p-6 lg:p-8">
            {bit && (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
                {showBitButton && (
                  <PixelButton href={bit} target="_blank" rel="noopener" onClick={() => setStarted(true)} className={`${btn} bg-claret lg:w-auto`}>
                    <DeviceMobile size={22} aria-hidden />
                    תשלום בביט
                  </PixelButton>
                )}
                {!isMobile && (
                  <div className="flex items-center gap-4">
                    <Qr text={bit} />
                    <p className="max-w-[18ch] text-[15px] leading-[1.5] text-ink/70">סורקים עם הטלפון ומשלמים בביט</p>
                  </div>
                )}
              </div>
            )}
            {bit && typedAmount && (
              <p className="text-[17px] leading-[1.6]">
                בביט מקלידים את הסכום: <strong className="tabular">{shekel(order.amount)}</strong>
              </p>
            )}
            {bitPhone && (
              <div className={`flex flex-col gap-3 ${bit ? 'border-t border-ink/10 pt-5' : ''}`}>
                <p className="text-[17px] leading-[1.6]">
                  {bit ? (
                    'או בהעברה בביט למספר'
                  ) : (
                    <>
                      מעבירים <strong className="tabular">{shekel(order.amount)}</strong> בביט למספר
                    </>
                  )}
                </p>
                <p dir="ltr" className="tabular text-right text-[30px] font-extrabold leading-none tracking-[0.02em] lg:text-[34px]">
                  {bitPhone}
                </p>
                <div>
                  <CopyNumber value={bitPhone} />
                </div>
              </div>
            )}
          </div>
        )}

        {card && (
          <PixelButton
            href={card}
            target="_blank"
            rel="noopener"
            onClick={() => setStarted(true)}
            textColor="#0e0d0c"
            hoverTextColor="#fbf8f3"
            className={`${btn} border border-ink/25 bg-paper lg:w-auto lg:self-start`}
          >
            <CreditCard size={22} aria-hidden />
            תשלום בכרטיס אשראי
          </PixelButton>
        )}

        {nothing && (
          <p className="text-[16px]">
            <Pending label="קישור או מספר לביט (config.ts → payment)" />
          </p>
        )}
      </div>

      <AnimatePresence>
        {(started || isDev) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <PixelButton as="button" onClick={done} textColor="#fbf8f3" className={`${btn} bg-ink lg:w-auto`}>
              <Check size={20} weight="bold" aria-hidden />
              סיימתי לשלם
            </PixelButton>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-6">
        <p className="text-[15px] leading-[1.5] text-ink/65">{FORM.under}</p>
        <button type="button" onClick={onBack} className="inline-flex min-h-[44px] items-center gap-2 self-start text-[15px] font-semibold text-ink/75 hover:text-ink">
          <ArrowRight size={16} aria-hidden />
          חזרה לפרטים
        </button>
      </div>
    </div>
  )
}

function Waitlisted() {
  return (
    <div className="rounded-[22px] bg-paper p-6 lg:p-8">
      <p className="text-[26px] font-extrabold leading-tight">נכנסת לרשימת ההמתנה.</p>
      <p className="mt-3 text-[17px] leading-[1.6] text-ink/75">אם יתפנה מקום, נחזור אליך בוואטסאפ.</p>
    </div>
  )
}

export default function Register({ onPaid }: { onPaid: () => void }) {
  const [step, setStep] = useState<'form' | 'pay' | 'waitlisted'>('form')
  const [order, setOrder] = useState<Order | null>(null)
  const top = useRef<HTMLDivElement>(null)
  const go = (s: typeof step) => {
    setStep(s)
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <section id="register" className="bg-paper py-20 lg:py-32">
      <Container>
        <div ref={top} className="mx-auto max-w-[760px] scroll-mt-24">
          <SectionTitle text={step === 'pay' ? 'תשלום' : FORM.title} />
          <div className="mt-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }}>
                {step === 'form' && (
                  <LeadForm
                    existing={order}
                    onDone={(o) => {
                      setOrder(o)
                      go(o.waitlist ? 'waitlisted' : 'pay')
                    }}
                  />
                )}
                {step === 'pay' && order && <Payment order={order} onBack={() => go('form')} onPaid={onPaid} />}
                {step === 'waitlisted' && <Waitlisted />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  )
}
