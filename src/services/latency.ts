import { useAppStore } from '../stores/appStore'
/** Resolve a value after the dev toolbar's artificial latency (default 0). Proves skeleton states. */
export function delay<T>(value: T): Promise<T> {
  const ms = useAppStore.getState().latency
  return ms > 0 ? new Promise((resolve) => setTimeout(() => resolve(value), ms)) : Promise.resolve(value)
}
