const P = {
  x: <><path d="M18 6 6 18" /><path d="M6 6l12 12" /></>,
  down: <path d="m6 9 6 6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  left: <path d="m15 18-6-6 6-6" />,
  back: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  next: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  up: <path d="m18 15-6-6-6 6" />,
  dleft: <><path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></>,
  dright: <><path d="m6 17 5-5-5-5" /><path d="m13 17 5-5-5-5" /></>,
}
// Lucide visual language: 16px, 1.75 stroke, currentColor (design-system README: iconography)
export default function Icon({ n, size = 16 }) {
  return <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n]}</svg>
}
