import type { DocExtraction } from '../../domain/types'
// OWNER: Phase 5 (BOM). StubId: doc-extraction. Static package list.
export const docsStub: DocExtraction = {
  listPackage: async () => [],
  countRequirements: async () => ({ extracted: 0, implicated: 0 }),
}
