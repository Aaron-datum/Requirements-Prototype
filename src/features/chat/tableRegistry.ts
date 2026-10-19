import type { TableModel } from '../../components/table/useTableModel'

/**
 * The tables currently on screen, newest last. The chat reads the active one to apply filters and picks rows from it.
 * TableShell registers its model on mount and removes it on unmount.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface RegisteredTable { id: string; model: TableModel<any>; rowId: (row: any) => string }
const tables: RegisteredTable[] = []

export function registerTable(t: RegisteredTable): () => void {
  const at = tables.findIndex((x) => x.id === t.id)
  if (at >= 0) tables.splice(at, 1)
  tables.push(t)
  return () => { const i = tables.indexOf(t); if (i >= 0) tables.splice(i, 1) }
}
export const activeTable = (): RegisteredTable | undefined => tables[tables.length - 1]
