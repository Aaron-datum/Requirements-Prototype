// fs-data.jsx — sample automotive CAD files + PLM filter schema (shared)

// ---- Files: one row per result. Each carries default + PLM/metadata fields ----
const FS_FILES = [
  { id: 'f01', thumb: 1, name: '7100490_0000_AB_ASM_RSB40_DEF.CATPart',
    program: 'Atlas EV', modelYear: 'MY24', releaseStatus: 'Released', programType: 'BEV',
    customerGroup: 'OEM-A', lifecycleState: 'Released', region: 'NA',
    productGroup: 'Chassis', productLine: 'Suspension', calcWeight: 4.2,
    releasedDate: 'Mar 12, 2025', modified: 'Apr 17, 2025', lastSynced: '2h ago',
    size: '16.0 MB', source: 'Teamcenter', created: 'Apr 17, 2025', synced: 'Jun 4, 2026' },
  { id: 'f02', thumb: 2, name: '7100512_0000_AB_ASM_SUBFRAME_S2.CATProduct',
    program: 'Atlas EV', modelYear: 'MY24', releaseStatus: 'Released', programType: 'BEV',
    customerGroup: 'OEM-A', lifecycleState: 'Frozen', region: 'NA',
    productGroup: 'Chassis', productLine: 'Subframe', calcWeight: 12.8,
    releasedDate: 'Feb 28, 2025', modified: 'Apr 09, 2025', lastSynced: '5h ago',
    size: '41.3 MB', source: 'Teamcenter', created: 'Jan 22, 2025', synced: 'Jun 4, 2026' },
  { id: 'f03', thumb: 3, name: 'K04-117-RS_BRKT_MOUNT.SLDPRT',
    program: 'Atlas EV', modelYear: 'MY24', releaseStatus: 'Released', programType: 'BEV',
    customerGroup: 'OEM-B', lifecycleState: 'Released', region: 'EU',
    productGroup: 'Chassis', productLine: 'Bracketry', calcWeight: 0.9,
    releasedDate: 'Mar 30, 2025', modified: 'Apr 02, 2025', lastSynced: '1d ago',
    size: '3.4 MB', source: 'CAD Library', created: 'Feb 11, 2025', synced: 'Jun 3, 2026' },
  { id: 'f04', thumb: 4, name: '7100631_0000_AA_ENG_MOUNT_FR.CATPart',
    program: 'Atlas EV', modelYear: 'MY24', releaseStatus: 'Released', programType: 'BEV',
    customerGroup: 'Internal', lifecycleState: 'Released', region: 'NA',
    productGroup: 'Powertrain', productLine: 'Engine Mount', calcWeight: 2.1,
    releasedDate: 'Apr 05, 2025', modified: 'Apr 14, 2025', lastSynced: '2h ago',
    size: '8.7 MB', source: 'Teamcenter', created: 'Mar 03, 2025', synced: 'Jun 4, 2026' },
  { id: 'f05', thumb: 5, name: '7100490_0001_AB_RSB40_ARM_L.CATPart',
    program: 'Atlas EV', modelYear: 'MY24', releaseStatus: 'Released', programType: 'BEV',
    customerGroup: 'OEM-A', lifecycleState: 'Released', region: 'EU',
    productGroup: 'Chassis', productLine: 'Suspension', calcWeight: 3.6,
    releasedDate: 'Mar 12, 2025', modified: 'Apr 16, 2025', lastSynced: '2h ago',
    size: '11.2 MB', source: 'Teamcenter', created: 'Mar 12, 2025', synced: 'Jun 4, 2026' },
  { id: 'f06', thumb: 1, name: 'K04-118-LS_BRKT_MOUNT.SLDPRT',
    program: 'Atlas EV', modelYear: 'MY24', releaseStatus: 'Released', programType: 'BEV',
    customerGroup: 'OEM-B', lifecycleState: 'Frozen', region: 'NA',
    productGroup: 'Chassis', productLine: 'Bracketry', calcWeight: 0.9,
    releasedDate: 'Mar 30, 2025', modified: 'Apr 01, 2025', lastSynced: '1d ago',
    size: '3.3 MB', source: 'CAD Library', created: 'Feb 11, 2025', synced: 'Jun 3, 2026' },
  { id: 'f07', thumb: 2, name: '7100490_0002_AC_RSB40_ARM_R.CATPart',
    program: 'Atlas EV', modelYear: 'MY25', releaseStatus: 'In Review', programType: 'BEV',
    customerGroup: 'OEM-A', lifecycleState: 'In Work', region: 'NA',
    productGroup: 'Chassis', productLine: 'Suspension', calcWeight: 3.7,
    releasedDate: '—', modified: 'May 22, 2026', lastSynced: '3h ago',
    size: '11.4 MB', source: 'Teamcenter', created: 'May 02, 2026', synced: 'Jun 5, 2026' },
  { id: 'f08', thumb: 3, name: '7200118_0000_AB_VEGA_CROSSMBR.CATProduct',
    program: 'Vega PHEV', modelYear: 'MY24', releaseStatus: 'Released', programType: 'PHEV',
    customerGroup: 'OEM-A', lifecycleState: 'Released', region: 'EU',
    productGroup: 'Body', productLine: 'Crossmember', calcWeight: 9.4,
    releasedDate: 'Jan 18, 2025', modified: 'Feb 20, 2025', lastSynced: '4d ago',
    size: '28.1 MB', source: 'Teamcenter', created: 'Nov 09, 2024', synced: 'Jun 1, 2026' },
  { id: 'f09', thumb: 4, name: '7200205_0000_AA_VEGA_KNUCKLE.SLDPRT',
    program: 'Vega PHEV', modelYear: 'MY23', releaseStatus: 'WIP', programType: 'PHEV',
    customerGroup: 'Internal', lifecycleState: 'In Work', region: 'APAC',
    productGroup: 'Chassis', productLine: 'Knuckle', calcWeight: 2.8,
    releasedDate: '—', modified: 'Dec 14, 2024', lastSynced: '2w ago',
    size: '6.9 MB', source: 'SharePoint', created: 'Oct 30, 2024', synced: 'May 20, 2026' },
  { id: 'f10', thumb: 5, name: '7300042_0000_AB_ORION_AXLE_HSG.CATPart',
    program: 'Orion LCV', modelYear: 'MY25', releaseStatus: 'Released', programType: 'ICE',
    customerGroup: 'OEM-B', lifecycleState: 'Released', region: 'NA',
    productGroup: 'Powertrain', productLine: 'Axle', calcWeight: 17.6,
    releasedDate: 'Apr 22, 2026', modified: 'Apr 28, 2026', lastSynced: '6h ago',
    size: '52.7 MB', source: 'Teamcenter', created: 'Feb 14, 2026', synced: 'Jun 5, 2026' },
  { id: 'f11', thumb: 1, name: '7400077_0000_AA_HELIX_LCA.CATPart',
    program: 'Helix SUV', modelYear: 'MY26', releaseStatus: 'In Review', programType: 'BEV',
    customerGroup: 'OEM-A', lifecycleState: 'In Work', region: 'EU',
    productGroup: 'Chassis', productLine: 'Suspension', calcWeight: 5.1,
    releasedDate: '—', modified: 'May 30, 2026', lastSynced: '1h ago',
    size: '13.8 MB', source: 'Teamcenter', created: 'May 11, 2026', synced: 'Jun 5, 2026' },
  { id: 'f12', thumb: 2, name: '7300108_0000_AC_ORION_BRKT_OBS.SLDPRT',
    program: 'Orion LCV', modelYear: 'MY24', releaseStatus: 'Obsolete', programType: 'ICE',
    customerGroup: 'Internal', lifecycleState: 'Superseded', region: 'APAC',
    productGroup: 'Chassis', productLine: 'Bracketry', calcWeight: 1.3,
    releasedDate: 'Aug 11, 2024', modified: 'Sep 02, 2024', lastSynced: '3mo ago',
    size: '2.6 MB', source: 'Project Archive', created: 'Jun 19, 2024', synced: 'Mar 12, 2026' },
];

// ---- Filter field definitions: key, label, kind, the row property it reads ----
// kinds: multi-tag (small fixed list) · multi-search (6+ options) · range-units · date-preset
const FS_FIELDS = {
  program:        { label: 'Program',        col: 'Program',        kind: 'multi-search', prop: 'program' },
  modelYear:      { label: 'Model Year',     col: 'Model Year',     kind: 'multi-tag',    prop: 'modelYear' },
  programType:    { label: 'Program Type',   col: 'Program Type',   kind: 'multi-tag',    prop: 'programType' },
  customerGroup:  { label: 'Customer Group', col: 'Customer',       kind: 'multi-search', prop: 'customerGroup' },
  region:         { label: 'Region',         col: 'Region',         kind: 'multi-tag',    prop: 'region' },
  productGroup:   { label: 'Product Group',  col: 'Prod. Group',    kind: 'multi-search', prop: 'productGroup' },
  productLine:    { label: 'Product Line',   col: 'Prod. Line',     kind: 'multi-search', prop: 'productLine' },
  calcWeight:     { label: 'Calc Weight',    col: 'Calc Wt.',       kind: 'range-units',  prop: 'calcWeight', unit: 'kg', min: 0, max: 20, step: 0.1 },
  releaseStatus:  { label: 'Release Status', col: 'Release',        kind: 'multi-tag',    prop: 'releaseStatus' },
  lifecycleState: { label: 'Lifecycle State',col: 'Lifecycle',      kind: 'multi-tag',    prop: 'lifecycleState' },
  releasedDate:   { label: 'Released Date',  col: 'Released',       kind: 'date-preset',  prop: 'releasedDate' },
};

// Grouped for the sidebar
const FS_GROUPS = [
  { id: 'program',   label: 'Program',   keys: ['program', 'modelYear', 'programType', 'customerGroup', 'region'] },
  { id: 'product',   label: 'Product',   keys: ['productGroup', 'productLine', 'calcWeight'] },
  { id: 'lifecycle', label: 'Lifecycle', keys: ['releaseStatus', 'lifecycleState', 'releasedDate'] },
];

// Status tones for release status / lifecycle badges
const FS_STATUS_TONE = {
  'Released': 'pass', 'In Review': 'info', 'WIP': 'warn', 'In Work': 'warn',
  'Frozen': 'info', 'Obsolete': 'fail', 'Superseded': 'fail',
};

// Distinct option list + count for a field
function fsOptions(prop) {
  const counts = {};
  FS_FILES.forEach(f => { const v = f[prop]; if (v && v !== '—') counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

// Initial filter state for one field
function fsInitField(key) {
  const m = FS_FIELDS[key];
  if (m.kind === 'range-units') return { min: m.min, max: m.max };
  if (m.kind === 'date-preset') return { preset: 'all' };
  return { query: '', values: [] };
}
function fsInitState() {
  const s = {};
  Object.keys(FS_FIELDS).forEach(k => { s[k] = fsInitField(k); });
  return s;
}
function fsIsActive(key, v) {
  const m = FS_FIELDS[key];
  if (m.kind === 'range-units') return v.min > m.min || v.max < m.max;
  if (m.kind === 'date-preset') return v.preset !== 'all';
  return (v.values && v.values.length > 0);
}
// Does a file pass a single field's filter?
function fsFilePasses(file, key, v) {
  if (!fsIsActive(key, v)) return true;
  const m = FS_FIELDS[key];
  const val = file[m.prop];
  if (m.kind === 'range-units') return val >= v.min && val <= v.max;
  if (m.kind === 'date-preset') return true; // demo: date presets don't reduce rows
  return v.values.includes(val);
}

Object.assign(window, {
  FS_FILES, FS_FIELDS, FS_GROUPS, FS_STATUS_TONE,
  fsOptions, fsInitField, fsInitState, fsIsActive, fsFilePasses,
});
