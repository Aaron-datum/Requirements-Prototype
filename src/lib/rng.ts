/** Seeded RNG (mulberry32). Every generator takes a seed string so every run is identical. */
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
export function mulberry32(seed: string): () => number {
  let a = hashSeed(seed)
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** Deterministic integer in [min, max] from any string key. */
export const hashInt = (key: string, min: number, max: number): number => min + (hashSeed(key) % (max - min + 1))
export const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)] as T
