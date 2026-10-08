import { useEffect } from 'react'
import { useCrumbStore, type Crumb } from '../../stores/crumbStore'
export function useBreadcrumbs(crumbs: Crumb[]): void {
  const set = useCrumbStore((s) => s.set)
  const key = JSON.stringify(crumbs)
  useEffect(() => { set(JSON.parse(key) as Crumb[]); return () => set([]) }, [key, set])
}
