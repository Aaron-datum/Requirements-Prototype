import type { PlmConnector } from '../../domain/types'
/** StubId: plm-connectors. Never live. Every "Open in PLM" renders disabled with the tooltip below. */
export const PLM_DISABLED_TIP = 'Not connected in prototype'
export const plmStub: PlmConnector = {
  isLive: () => false,
  syncState: () => [
    { source: 'SAP S/4HANA', connected: true, lastSync: '2026-10-01 07:12' },
    { source: 'LME aluminium · nickel', connected: true, lastSync: '2026-10-01 06:00' },
    { source: 'ECB reference rates', connected: true, lastSync: '2026-10-01 04:30' },
    { source: 'Teamcenter', connected: true, lastSync: '2026-10-01 05:40' },
    { source: 'Windchill', connected: false, lastSync: '2026-09-28 18:02' },
  ],
}
