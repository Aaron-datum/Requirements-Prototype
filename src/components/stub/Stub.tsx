import type { ReactNode } from 'react'
import type { StubId } from '../../domain/types'
import { useAppStore } from '../../stores/appStore'
import styles from './Stub.module.css'

/**
 * Wrap every simulated output: <Stub id="matching-engine" note="Pre-baked scores">…</Stub>
 * Default: children untouched inside a display:contents wrapper carrying data-stub.
 * With ?showStubs=1 (or the dev toolbar toggle): dashed outline and a corner tag with the StubId.
 */
export function Stub({ id, note, children, inline }: { id: StubId; note?: string; children: ReactNode; inline?: boolean }) {
  const show = useAppStore((s) => s.showStubs)
  if (!show) return <span data-stub={id} className={styles.contents}>{children}</span>
  return (
    <span data-stub={id} className={inline ? styles.outlinedInline : styles.outlined} title={note ? `${id}: ${note}` : id}>
      <span className={styles.tag}>{id}</span>
      {children}
    </span>
  )
}
