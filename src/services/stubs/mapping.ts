import type { MappingAgent } from '../../domain/types'
/** StubId: mapping-agent. The I/O contract is not defined in any doc. The prototype reads canonical JSON directly; this is intentionally a pass-through. */
export const mappingStub: MappingAgent = {
  async mapRecords(raw) { return { records: raw, mappingConfidence: undefined } },
}
