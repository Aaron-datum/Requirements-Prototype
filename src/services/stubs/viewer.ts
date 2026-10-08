import type { ViewerController } from '../../domain/types'
// OWNER: Phase 2 (search). StubId: cad-viewer. Placeholder viewport with real toolbar state; picking is a list of named geometry.
export const viewerStub: ViewerController = {
  viewMode: 'shaded',
  setViewMode(m) { this.viewMode = m },
  listPickableGeometry: () => [],
}
