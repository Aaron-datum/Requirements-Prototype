/**
 * Catalogue domain additions. docs/03 defines the minimal CatalogueService (tree, query); the Parts Catalogue screens need
 * a little more from the search-index stub (live tree counts, spec-query parsing, part lookup). They are declared here so
 * docs/03 and src/domain/types.ts stay clean copies. The stub implements the full interface; screens reach it through
 * useCatalogue() in src/features/catalogue.
 */
import type { CatalogueRow, CatalogueService } from './types'

export type FacetSelection = Record<string, string[]>

export interface CatalogueNode {
  id: string
  label: string
  count: number
  description?: string
  /** Number of types shown as "N types" on tiles. */
  types?: number
  /** Counts are computed from rows. Other nodes carry typed, catalogue-wide counts with no rows behind them. */
  rowBacked?: boolean
  /** Facet values this node selects (selecting the node scopes filters and results). */
  scope?: FacetSelection
  /** Facet axis the node's children scope, cleared when the parent is selected. */
  scopeAxis?: string
  /** 0 to 3 quick-select axes (facet keys) shown as chips for this node. */
  axes?: string[]
  parentId?: string
  children?: CatalogueNode[]
}

export interface HeadTypeCard { value: string; label: string; description: string; image: string }

export interface UsedOn { name: string; program: string; uses: number }

/** A catalogue part: the shared CatalogueRow plus what the drawer and compare views need. */
export interface CatalogueRowX extends CatalogueRow {
  description: string
  image: string
  /** PLM data keyed by the tenant schema field keys (FieldRenderer). */
  plm: Record<string, string | number>
  usedOn: UsedOn[]
}

export interface ParsedQuery { facets: FacetSelection; text: string }

export interface ComparePair { id: string; a: string; b: string; match: string[]; differ: string[]; administrativeDiffer: string[]; missingOnB?: string[] }

export interface CatalogueQueryResult { rows: CatalogueRowX[]; facetCounts: Record<string, Record<string, number>> }

export interface CatalogueServiceFull extends CatalogueService {
  tree(): CatalogueNode[]
  /** Tree with every count recomputed under the given facets and text (nodes with no matching parts show 0). */
  liveTree(facets: FacetSelection, text?: string): CatalogueNode[]
  node(nodeId: string): CatalogueNode | undefined
  /** Path from the root category to the node, e.g. Fasteners, Bolts, M16. */
  path(nodeId: string): CatalogueNode[]
  /** All rows of a node with no facets applied (the table filters them itself). */
  rows(nodeId: string): CatalogueRowX[]
  query(nodeId: string, facets: FacetSelection, text?: string): CatalogueQueryResult
  part(partNumber: string): CatalogueRowX | undefined
  /** Turn a spec query ("M16 hex stainless") into facets plus leftover text. */
  parse(text: string): ParsedQuery
  recent(): string[]
  headTypes(): HeadTypeCard[]
  pairs(): ComparePair[]
}
