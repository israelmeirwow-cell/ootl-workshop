/**
 * יציאה מהלופ mark: one hand-drawn loop that leaves straight to the left, ending in a red dot.
 */
function LogoMark({ size = 44, color = 'currentColor', accent = '#e0442f' }: { size?: number; color?: string; accent?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path
        d="M41 29H29c-6 0-11-4.6-11-10.4C18 13.8 21.6 10 26 10s7.4 3.4 7.4 7.6c0 6.4-6.6 11.4-15.6 11.4H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="6.5" cy="29" r="3.6" fill={accent} />
    </svg>
  )
}

export default LogoMark
