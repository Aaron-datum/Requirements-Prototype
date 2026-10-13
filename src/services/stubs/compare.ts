import type { CompareService } from '../../domain/types'
import { surfaceOf } from '../../fixtures/derive-search'
import { hashInt } from '../../fixtures/rng'

// OWNER: Phase 3 (search). StubIds: cad-viewer + matching-engine. Deterministic numbers from a hash of the two ids.

/** Degrees of freedom a constraint removes from a rigid body (placeholder weights). */
export const CONSTRAINT_DOF: Record<ReturnType<CompareService['inferConstraint']>, number> = { coplanar: 3, coaxial: 2, concentric: 2, 'parallel-planes': 1 }
export const CONSTRAINT_LABEL: Record<ReturnType<CompareService['inferConstraint']>, string> = { coplanar: 'Coplanar', coaxial: 'Coaxial', concentric: 'Concentric', 'parallel-planes': 'Parallel planes' }
/** Degrees of freedom remaining from 6; each constraint removes 1 to 3, never below 0. */
export const remainingDof = (types: Array<keyof typeof CONSTRAINT_DOF>): number => Math.max(0, 6 - types.reduce((s, t) => s + CONSTRAINT_DOF[t], 0))

const tenths = (key: string, lo: number, hi: number): number => hashInt(key, lo * 10, hi * 10) / 10

export const compareStub: CompareService = {
  /** Placeholder rule (PRD section 8): plane+plane coplanar, cylinder+cylinder coaxial, any cone concentric, otherwise parallel planes. The user may override. */
  inferConstraint(faceA, faceB) {
    const a = surfaceOf(faceA), b = surfaceOf(faceB)
    if (a === 'Plane' && b === 'Plane') return 'coplanar'
    if (a === 'Cylinder' && b === 'Cylinder') return 'coaxial'
    if (a === 'Cone' || b === 'Cone') return 'concentric'
    return 'parallel-planes'
  },
  computeOverlap(a, b, constraints) {
    const bonus = Math.min(constraints, 3) * 0.8
    const queryOnly = Math.max(1, Math.round((tenths(`${a}|${b}|q`, 3, 14) - bonus) * 10) / 10)
    const resultOnly = Math.max(1, Math.round((tenths(`${a}|${b}|r`, 3, 16) - bonus) * 10) / 10)
    const overlap = Math.round((100 - queryOnly - resultOnly) * 10) / 10
    const signed = (k: string) => tenths(`${a}|${b}|${k}`, 0, 3.4) * (hashInt(`${a}|${b}|${k}s`, 0, 1) ? 1 : -1)
    return {
      queryOnly, overlap, resultOnly,
      maxDeviationMm: tenths(`${a}|${b}|dev`, 0.3, 4.2),
      bboxDelta: { x: signed('x'), y: signed('y'), z: signed('z') },
      volumeMatchPct: Math.round((100 - (queryOnly + resultOnly) * 0.75) * 10) / 10,
    }
  },
}
