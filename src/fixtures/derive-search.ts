/**
 * Search area derive layer: typed access to the library fixtures (files, trees, lineage, duplicates, geometry, measurement types).
 * Pure functions over `extras/search/*.json`. No React, no clock, no randomness.
 */
import type { TreeNode } from '../domain/types'
import filesJson from './extras/search/files.json'
import geometryJson from './extras/search/geometry.json'
import measurementTypesJson from './extras/search/measurementTypes.json'
import recentsJson from './extras/search/recents.json'
import type { MeasurementTypeDef, PickableGeometry, RecentSeed, SearchFile } from './extras/search/types'
import { hashInt } from './rng'

export const searchFiles: SearchFile[] = filesJson as unknown as SearchFile[]
export const measurementTypes: MeasurementTypeDef[] = measurementTypesJson as unknown as MeasurementTypeDef[]
export const recentSeeds: RecentSeed[] = recentsJson as RecentSeed[]
const geometry = geometryJson as unknown as Record<string, PickableGeometry[]>

export const fileById: Record<string, SearchFile> = Object.fromEntries(searchFiles.map((f) => [f.id, f]))
export const measurementTypeByKey: Record<string, MeasurementTypeDef> = Object.fromEntries(measurementTypes.map((t) => [t.key, t]))
export const hasPlm = (f: SearchFile): boolean => Object.keys(f.plm).length > 0

/** Normalise for part-number-first matching: case, spacing and separators are ignored. */
export const normalizeName = (s: string): string => s.toLowerCase().replace(/[\s_\-.]+/g, '')

/** Exact (case-insensitive) file name match, else a part-number-first match. Used by the upload simulation. */
export function findFileByName(name: string): SearchFile | undefined {
  const exact = searchFiles.find((f) => f.name.toLowerCase() === name.toLowerCase())
  if (exact) return exact
  const n = normalizeName(name.replace(/\.[^.]+$/, ''))
  return searchFiles.find((f) => normalizeName(f.name.replace(/\.[^.]+$/, '')) === n)
    ?? searchFiles.find((f) => n.length >= 5 && normalizeName(f.name).startsWith(n))
}

/**
 * Resolve whatever "Search on" was given to a library file. Other areas (BOM review, Catalogue) pass Civic part numbers or
 * catalogue part numbers, which are not CAD files in the search library. Unknown ids resolve deterministically (by hash) to a
 * library part file, and `represents` records the original so Define can say so. Prototype simplification (matching-engine / cad-parser).
 */
export function resolveSearchFile(idOrPartNumber: string): { file: SearchFile; represents?: string } {
  const direct = fileById[idOrPartNumber] ?? findFileByName(idOrPartNumber)
  if (direct) return { file: direct }
  const parts = searchFiles.filter((f) => f.kind === 'part' && Object.keys(f.plm).length > 0)
  return { file: parts[hashInt(`search-on|${idOrPartNumber}`, 0, parts.length - 1)]!, represents: idOrPartNumber }
}

/* ------------------------------- trees --------------------------------- */

export interface FlatNode { node: TreeNode; depth: number; parentId?: string; path: string[] }
export function flattenTree(tree: TreeNode[] | undefined): FlatNode[] {
  const out: FlatNode[] = []
  const walk = (nodes: TreeNode[], depth: number, parentId: string | undefined, path: string[]) => nodes.forEach((node) => {
    out.push({ node, depth, parentId, path: [...path, node.name] })
    if (node.children) walk(node.children, depth + 1, node.id, [...path, node.name])
  })
  walk(tree ?? [], 0, undefined, [])
  return out
}
export const findNode = (file: SearchFile, nodeId: string | undefined): FlatNode | undefined => (nodeId ? flattenTree(file.tree).find((n) => n.node.id === nodeId) : undefined)
/** Active (non-reference) leaf parts of an assembly. */
export const activeLeaves = (file: SearchFile): FlatNode[] => flattenTree(file.tree).filter((n) => !n.node.children && !n.node.reference)
export const referenceNodes = (file: SearchFile): FlatNode[] => flattenTree(file.tree).filter((n) => n.node.reference)

/** Assemblies that contain a part file, with every placement. */
export function assembliesContaining(fileId: string): Array<{ assembly: SearchFile; placements: FlatNode[] }> {
  return searchFiles.filter((f) => f.kind === 'assembly').flatMap((assembly) => {
    const placements = flattenTree(assembly.tree).filter((n) => n.node.fileId === fileId)
    return placements.length ? [{ assembly, placements }] : []
  })
}

/* ------------------------- lineage and duplicates ------------------------ */

/** Every revision in the file's lineage, oldest first (follows supersededBy). */
export function lineageOf(file: SearchFile): SearchFile[] {
  const same = searchFiles.filter((f) => f.lineageId === file.lineageId)
  const successor = new Map(same.filter((f) => f.supersededBy).map((f) => [f.supersededBy!, f]))
  const ordered: SearchFile[] = []
  const heads = same.filter((f) => !successor.has(f.id))
  const walk = (f: SearchFile | undefined) => { while (f && !ordered.includes(f)) { ordered.push(f); f = f.supersededBy ? fileById[f.supersededBy] : undefined } }
  heads.forEach(walk)
  same.forEach((f) => { if (!ordered.includes(f)) ordered.push(f) })
  return ordered
}
/** Other files with the same geometry (different file or a vault copy of the same file). */
export const duplicatesOf = (file: SearchFile): SearchFile[] => searchFiles.filter((f) => f.id !== file.id && f.geometryHash === file.geometryHash)
export const duplicateKind = (a: SearchFile, b: SearchFile): 'geometric-duplicate' | 'duplicate-file' | undefined => (a.id !== b.id && a.geometryHash === b.geometryHash ? (a.name === b.name ? 'duplicate-file' : 'geometric-duplicate') : undefined)

/* ------------------------------ geometry --------------------------------- */

/**
 * Named faces, edges and bodies the simulated picker offers. The key is a file id, or `<assemblyFileId>#<nodeId>` for a
 * sub-assembly node (its direct children become pickable bodies).
 */
export function pickableGeometry(key: string): PickableGeometry[] {
  if (geometry[key]) return geometry[key]!
  const [fileId, nodeId] = key.split('#')
  const file = fileId ? fileById[fileId] : undefined
  const flat = file && nodeId ? findNode(file, nodeId) : undefined
  if (flat?.node.children) return flat.node.children.filter((c) => !c.reference).map((c) => ({ ref: `${key}-body-${c.id}`, kind: 'body' as const, label: `Body: ${c.name}` }))
  return []
}
/** Surface type parsed from a picked-geometry label, e.g. "Face 12 (Plane)" gives "Plane". */
export const surfaceOf = (label: string): string => /\(([^)]+)\)/.exec(label)?.[1] ?? ''

/** Plausible, deterministic measured value for a (file, type, geometry) triple. */
export function derivedValue(fileKey: string, typeKey: string, geometryRef: string): number {
  const t = measurementTypeByKey[typeKey]
  if (!t) return 0
  const u = hashInt(`${fileKey}|${typeKey}|${geometryRef}`, 0, 10000) / 10000
  const v = t.range[0] + (t.range[1] - t.range[0]) * u
  return Math.round(v * 100) / 100
}

/** Union volume (mm³) of a pair, used to turn overlap percentages into labelled volumes. Deterministic. */
export const pairVolumeMm3 = (a: string, b: string): number => hashInt(`vol|${a}|${b}`, 52_000, 940_000)

/** The tree node for a Define "active part" id, falling back to the root. */
export function activeNode(file: SearchFile, nodeId: string | undefined): FlatNode | undefined {
  const flat = flattenTree(file.tree)
  return flat.find((n) => n.node.id === nodeId) ?? flat[0]
}
