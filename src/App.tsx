import { useEffect, useState } from 'react'
import { Footer, Header, StickyBar } from './components/Chrome'
import Hero from './components/Hero'
import Pain from './components/Pain'
import Fit from './components/Fit'
import Why from './components/Why'
import Method from './components/Method'
import Shift from './components/Shift'
import Schedule from './components/Schedule'
import Team from './components/Team'
import Offer from './components/Offer'
import Faq from './components/Faq'
import Final from './components/Final'
import Register from './components/Register'
import ThankYou from './components/ThankYou'
import { SeatsProvider } from './lib/seats'
import { captureAttribution, initPixels } from './lib/track'

/** A payment provider sends paying visitors back with ?paid=1; the in-page flow uses #thanks. */
function isThanksUrl() {
  const q = new URLSearchParams(window.location.search)
  return q.get('paid') === '1' || window.location.hash === '#thanks'
}

function useInViewById(id: string, active: boolean) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!active) return
    const el = document.getElementById(id)
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '0px 0px -20% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [id, active])
  return inView
}

export default function App() {
  const [thanks, setThanks] = useState(isThanksUrl)
  const formInView = useInViewById('register', !thanks)

  useEffect(() => {
    captureAttribution()
    initPixels()
    const onPop = () => setThanks(isThanksUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const paid = () => {
    window.history.pushState(null, '', '#thanks')
    setThanks(true)
  }

  return (
    <SeatsProvider>
      <a href="#register" className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        דילוג לטופס ההרשמה
      </a>
      <Header showCta={!thanks && !formInView} />
      {thanks ? (
        <main>
          <ThankYou />
        </main>
      ) : (
        <main className="overflow-x-clip">
          <Hero />
          <Pain />
          <Fit />
          <Why />
          <Method />
          <Shift />
          <Schedule />
          <Team />
          <Offer />
          <Faq />
          <Final />
          <Register onPaid={paid} />
        </main>
      )}
      <Footer />
      {!thanks && <StickyBar hidden={formInView} />}
    </SeatsProvider>
  )
}
