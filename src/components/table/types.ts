import type { ReactNode } from 'react'
import type { FilterControl } from '../../domain/types'

export type Raw = string | number | boolean | null | undefined

/** One column definition. The same definition drives the column, its filter (by data type) and the Columns tab. */
export interface ColumnDef<R> {
  key: string
  label: string
  /** Sidebar group (and Column picker group). */
  group?: string
  get: (row: R) => Raw
  render?: (row: R) => ReactNode
  /** Filter control by data type (design system rules). 'none' = no filter. */
  filter?: FilterControl | 'none'
  /** Ordered values for level-seg (best to worst); also fixes the option order for multi controls. */
  order?: string[]
  /** Turns a raw enum value into a display label (typically via a vocabulary). */
  label_of?: (raw: string) => string
  unit?: string
  align?: 'left' | 'right' | 'center'
  /** Always visible, cannot be hidden or removed. */
  pinned?: boolean
  /** Visible by default (default true). */
  defaultVisible?: boolean
  /** Column only appears while its filter is applied (Files: 4 default columns + at most N extra). */
  showOnlyWhenFiltered?: boolean
  width?: number | string
  /** Not offered in the Add / Remove Columns picker or filters unless explicitly chosen. */
  optional?: boolean
}

export interface FilterValue {
  values?: string[]
  query?: string
  min?: number | null
  max?: number | null
  preset?: string
  from?: string
  to?: string
}
export type FilterState = Record<string, FilterValue>

export interface GroupOption<R> { key: string; label: string; get: (row: R) => string }

export interface SavedView { name: string; filters: FilterState; visible: string[]; fields: string[]; density?: string }
