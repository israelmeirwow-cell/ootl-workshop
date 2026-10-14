import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Container, InstagramLink, Pending, Photo, SectionTitle } from './ui'
import { RAZ, TEAM_COPY } from '../content'
import { CONFIG } from '../config'

const ease = [0.16, 1, 0.3, 1] as const

interface Person {
  name: string
  /** What to show in the heading (a name, or a name with a missing part marked). */
  title: ReactNode
  initials: string
  role: string
  text: string
  pendingText?: string
  inWorkshop: string
  photo: string
  /** Face position for the round crop. */
  position?: string
  fields?: string[]
  instagram?: string
  lead: boolean
}

function people(): Person[] {
  const t = CONFIG.team
  const p = CONFIG.photos
  return [
    {
      name: 'רז בזק',
      title: 'רז בזק',
      initials: 'ר״ב',
      role: 'מייסדת שותפה, יציאה מהלופ',
      text: '״הייתי בדיוק בלופ הזה. ניסיתי, פתחתי עסקים, החלפתי כיוונים — שיווק דיגיטלי, סושיאל, UGC — ושאלתי את עצמי שוב ושוב מה באמת מתאים לי. מה שתקע אותי לא היה חוסר ידע, אלא חוסר מיקוד. היום אני עוזרת לאנשים לעבור את הדרך הזו מהר יותר ממני.״',
      inWorkshop: 'פתיחה, בהירות ומכירות',
      photo: p.raz,
      position: '54% 28%',
      fields: RAZ.fields,
      instagram: t.razInstagram,
      lead: true,
    },
    {
      name: t.partnerName || 'השותפה',
      title: t.partnerName || <Pending label="שם השותפה" />,
      initials: 'ל״מ',
      role: 'מייסדת שותפה, יציאה מהלופ',
      text: t.partnerText,
      pendingText: 'משפט או שניים בגוף ראשון',
      inWorkshop: 'פתיחה, בהירות ומכירות',
      photo: p.partner,
      position: '60% 36%',
      lead: true,
    },
    {
      name: 'אלון אזולאי',
      title: 'אלון אזולאי',
      initials: 'א״א',
      role: 'יוצר תוכן · מותג אישי',
      text: t.alonText,
      pendingText: 'טקסט שיישלח אחרי אישור של אלון',
      inWorkshop: 'איך בונים מותג אישי וסרטון שאנשים רוצים לראות',
      photo: p.alon,
      lead: false,
    },
    {
      name: t.miriamSurname ? `מרים ${t.miriamSurname}` : 'מרים',
      title: t.miriamSurname ? `מרים ${t.miriamSurname}` : (
        <>
          מרים <Pending label="שם משפחה" />
        </>
      ),
      initials: 'מ',
      role: 'יוצרת תוכן · AI',
      text: t.miriamText,
      pendingText: 'טקסט שיישלח אחרי אישור של מרים',
      inWorkshop: 'איך משתמשים ב-AI כדי לייצר תוכן שנשמע כמוך',
      photo: p.miriam,
      lead: false,
    },
  ]
}

function Card({ person, i }: { person: Person; i: number }) {
  const big = person.lead
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay: (i % 2) * 0.1, ease }}
      className={`flex flex-col rounded-[28px] border border-ink/[0.07] bg-paper p-6 lg:p-8 ${big ? 'lg:flex-row lg:gap-8' : 'lg:flex-row lg:items-center lg:gap-6'}`}
    >
      <Photo
        src={person.photo}
        alt={person.name}
        round
        initials={person.initials}
        position={person.position}
        className={`shrink-0 ${big ? 'h-28 w-28 lg:h-40 lg:w-40' : 'h-20 w-20 lg:h-24 lg:w-24'}`}
      />
      <div className="mt-5 lg:mt-0">
        <h3 className={`font-extrabold leading-tight tracking-[-0.01em] ${big ? 'text-[26px] lg:text-[30px]' : 'text-[22px] lg:text-[24px]'}`}>
          {person.title}
        </h3>
        <p className="mt-1 text-[15px] font-medium text-ink/60">{person.role}</p>
        {person.fields && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="תחומי עיסוק">
            {person.fields.map((f) => (
              <li key={f} className="rounded-full border border-ink/12 bg-cream px-3 py-1 text-[14px] font-medium text-ink/75">
                {f}
              </li>
            ))}
          </ul>
        )}
        {person.text ? (
          <p className="mt-4 text-[16px] leading-[1.6] text-ink/80 lg:text-[17px]">{person.text}</p>
        ) : (
          person.pendingText && (
            <p className="mt-4">
              <Pending label={person.pendingText} />
            </p>
          )
        )}
        <p className="mt-4 text-[15px] leading-[1.5] text-ink/70">
          <span className="font-bold text-claret-deep">{TEAM_COPY.inWorkshop}</span> {person.inWorkshop}
        </p>
        {person.instagram && <InstagramLink href={person.instagram} name={RAZ.instagramName} className="mt-2 -mb-2" />}
      </div>
    </motion.article>
  )
}

export default function Team() {
  const list = people()
  return (
    <section id="team" className="py-20 lg:py-32">
      <Container>
        <SectionTitle text={TEAM_COPY.title} />
        <p className="mt-5 max-w-[60ch] text-[18px] leading-[1.65] text-ink/75 lg:text-[20px]">{TEAM_COPY.text}</p>

        <div className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-2 lg:gap-6">
          {list.slice(0, 2).map((p, i) => (
            <Card key={i} person={p} i={i} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-6">
          {list.slice(2).map((p, i) => (
            <Card key={i} person={p} i={i} />
          ))}
        </div>
      </Container>
    </section>
  )
}
