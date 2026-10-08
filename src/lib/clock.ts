/** The only place the app reads the time. Tests inject a clock; rendering paths never call Date.now() directly. */
let source: () => Date = () => new Date()
export const now = (): string => source().toISOString()
export const setClock = (fn: () => Date): void => { source = fn }
export const resetClock = (): void => { source = () => new Date() }
