import { motion } from 'motion/react'
import { Container, InstagramLink, Photo, SectionTitle } from './ui'
import AnimatedLines from './AnimatedLines'
import { RAZ, WHY } from '../content'
import { CONFIG } from '../config'

const ease = [0.16, 1, 0.3, 1] as const

/** Why it exists: Raz's own words, set large in the brand's serif, her photo beside them. */
export default function Why() {
  return (
    <section id="why" className="py-20 lg:py-32">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease }}
            className="hidden lg:col-span-4 lg:block"
          >
            <Photo src={CONFIG.photos.raz} alt="רז בזק" initials="ר״ב" position="54% 22%" className="aspect-[4/5] w-full" />
          </motion.div>

          <div className="lg:col-span-8">
            <SectionTitle text={WHY.title} />
            <figure className="mt-8 lg:mt-12">
              <blockquote className="font-serif text-[25px] leading-[1.45] text-ink lg:text-[clamp(30px,2.6vw,40px)] lg:leading-[1.4]">
                <AnimatedLines text={`״${WHY.quote}״`} stagger={0.05} />
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4">
                <Photo src={CONFIG.photos.raz} alt="" round initials="ר״ב" position="54% 28%" className="h-16 w-16 shrink-0 lg:hidden" />
                <span className="hidden h-px w-8 shrink-0 bg-claret lg:block" aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="text-[17px] font-bold">{WHY.by}</span>
                  <span className="text-[15px] leading-[1.45] text-ink/65">{RAZ.fields.join(' · ')}</span>
                  <InstagramLink href={CONFIG.team.razInstagram} name={RAZ.instagramName} className="-mb-2 self-start" />
                </span>
              </figcaption>
            </figure>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.7, ease }}
              className="mt-10 max-w-[60ch] border-t border-ink/10 pt-6 text-[18px] leading-[1.65] text-ink/75 lg:mt-14 lg:text-[20px]"
            >
              {WHY.under}
            </motion.p>
          </div>
        </div>
      </Container>
    </section>
  )
}
