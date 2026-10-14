import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { CONFIG, type Tier } from '../config'

export interface SeatState {
  sold: number
  total: number
  full: boolean
  tierIndex: number
  tier: Tier
  /** Seats left at the current price. */
  left: number
  /** Seats already taken inside the current tier. */
  takenInTier: number
  /** Whether the struck "full price" should show next to the current one. */
  showFull: boolean
}

export function seatState(soldRaw: number): SeatState {
  const tiers = CONFIG.tiers
  const total = tiers.reduce((s, t) => s + t.seats, 0)
  const sold = Math.max(0, Math.min(total, Math.floor(soldRaw) || 0))
  let start = 0
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i]
    if (sold < start + t.seats) {
      return {
        sold,
        total,
        full: false,
        tierIndex: i,
        tier: t,
        left: start + t.seats - sold,
        takenInTier: sold - start,
        showFull: t.single < CONFIG.fullPrice,
      }
    }
    start += t.seats
  }
  const last = tiers[tiers.length - 1]
  return { sold, total, full: true, tierIndex: tiers.length - 1, tier: last, left: 0, takenInTier: last.seats, showFull: false }
}

const SeatsContext = createContext<SeatState>(seatState(CONFIG.seats.sold))

export function SeatsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => seatState(CONFIG.seats.sold))

  useEffect(() => {
    const url = CONFIG.seats.remoteUrl
    if (!url) return
    const ctrl = new AbortController()
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { sold?: number }) => {
        if (typeof d?.sold === 'number') setState(seatState(d.sold))
      })
      .catch(() => {
        /* keep the number from config.ts */
      })
    return () => ctrl.abort()
  }, [])

  return <SeatsContext.Provider value={state}>{children}</SeatsContext.Provider>
}

export const useSeats = () => useContext(SeatsContext)

/** "נשארו 12 מקומות" / "נשאר מקום אחד" */
export function leftPhrase(left: number) {
  return left === 1 ? 'נשאר מקום אחד' : `נשארו ${left} מקומות`
}
