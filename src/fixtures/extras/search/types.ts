import type { CadFile, MeasurementType, SearchResultRow } from '../../../domain/types'

/** A library file as shipped in files.json: the shared CadFile plus the search-specific lineage and geometry fields. */
export interface SearchFile extends CadFile {
  /** Leading part-number token, used for part-number-first search. */
  partNumber: string
  revision: string
  lineageId: string
  /** The next revision in the lineage, if this one is superseded. */
  supersededBy?: string
  description: string
  /** Files sharing a hash have 100% the same geometry. Same name + same hash = duplicate file; different name = geometric duplicate. */
  geometryHash: string
}

export type GeometryKind = 'face' | 'edge' | 'body'

/** Measurement types are data. `applicableTo` says which picked geometry a type can be captured on. */
export interface MeasurementTypeDef extends MeasurementType {
  applicableTo: GeometryKind[]
  /** Default tolerance for the Results mini-bar (percent of the source value). */
  tolerancePct: number
  /** Plausible value range, used by the deterministic derivation. */
  range: [number, number]
}

export interface PickableGeometry { ref: string; kind: GeometryKind; label: string }

/** One contained part in an assembly result, with its own match percentage (fixture logic, not an algorithm). */
export interface ChildMatch { nodeId: string; name: string; category: string; fileId?: string; pct: number }
/** One placement of a part inside an assembly (Assemblies (N) tab). */
export interface UsedIn { asmId: string; asmFile: string; asmProgram: string; partInstance: string; instances: number; edited: string }

/** A result row as the engine returns it: SearchResultRow plus what the expansion tabs need. */
export interface ResultRowX extends SearchResultRow {
  fileKind: 'part' | 'assembly'
  childMatches?: ChildMatch[]
  usedIn?: UsedIn[]
}

export interface RecentSeed { id: string; fileName: string; modality: string; results: number; ago: string }
