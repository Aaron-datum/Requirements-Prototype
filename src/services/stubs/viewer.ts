import type { ViewerController } from '../../domain/types'
import { pickableGeometry } from '../../fixtures/derive-search'

// OWNER: Phase 2 (search). StubId: cad-viewer. Placeholder viewport with real toolbar state; picking is a list of named geometry.
// The key is a file id, or `<assemblyFileId>#<nodeId>` for a sub-assembly node (its children become pickable bodies).
export const viewerStub: ViewerController = {
  viewMode: 'shaded',
  setViewMode(m) { this.viewMode = m },
  listPickableGeometry: (fileId) => pickableGeometry(fileId),
}
