// Generates src/fixtures/extras/search/files.json and geometry.json (40 fake CAD files, trees, lineages, pickable geometry).
// Deterministic: no randomness, no clock. Run with `node scripts/gen-search-fixtures.mjs`. Commit the JSON it writes.
// All names and PLM values are fake example data (ported in shape from reference/search-design-files, not copied wholesale).
import { writeFileSync } from 'node:fs'

const OUT = new URL('../src/fixtures/extras/search/', import.meta.url).pathname
const CREATOR = ['a.keller', 'm.osei', 'j.lindqvist', 'r.banerjee', 'c.dubois']

let n = 0
const files = []
const byKey = {}

/** plm presets: [program, modelYear, programType, customerGroup, region, productGroup, productLine] */
const P = {
  tundra22: ['Tundra', 'MY22', 'ICE', 'OEM-A', 'NA', 'Seating', 'Complete Seat'],
  tundra23: ['Tundra', 'MY23', 'ICE', 'OEM-A', 'NA', 'Seating', 'Complete Seat'],
  bronco: ['Bronco', 'MY24', 'ICE', 'OEM-B', 'NA', 'Seating', 'Rear Bench'],
  buzz: ['ID.Buzz', 'MY25', 'BEV', 'OEM-C', 'EU', 'Seating', 'Front Seat'],
  silverado: ['Silverado', 'MY24', 'ICE', 'OEM-B', 'NA', 'Seating', 'Rear Bench'],
  atlas24: ['Atlas EV', 'MY24', 'BEV', 'OEM-A', 'NA', 'Chassis', 'Suspension'],
  atlas25: ['Atlas EV', 'MY25', 'BEV', 'OEM-A', 'NA', 'Chassis', 'Suspension'],
  atlasEU: ['Atlas EV', 'MY24', 'BEV', 'OEM-A', 'EU', 'Chassis', 'Suspension'],
  atlasBr: ['Atlas EV', 'MY24', 'BEV', 'OEM-B', 'EU', 'Chassis', 'Bracketry'],
  atlasEng: ['Atlas EV', 'MY24', 'BEV', 'Internal', 'NA', 'Powertrain', 'Engine Mount'],
  atlasSub: ['Atlas EV', 'MY24', 'BEV', 'OEM-A', 'NA', 'Chassis', 'Subframe'],
  vega: ['Vega PHEV', 'MY24', 'PHEV', 'OEM-A', 'EU', 'Body', 'Crossmember'],
  orion: ['Orion LCV', 'MY25', 'ICE', 'OEM-B', 'NA', 'Powertrain', 'Axle'],
  helix: ['Helix SUV', 'MY26', 'BEV', 'OEM-A', 'EU', 'Chassis', 'Cradle'],
  k04: ['Atlas EV', 'MY24', 'BEV', 'OEM-B', 'EU', 'Chassis', 'Bracketry'],
}

/**
 * add(): one file. `plm` is [preset, weight, releaseStatus, lifecycleState, releasedDate|null, leadWeeks] or null (no PLM record).
 * Keys of the plm record are FieldDef keys of BOTH tenant schemas (supplierLeadTime is read by company B only).
 */
function add(key, o) {
  n += 1
  const id = `f${String(n).padStart(2, '0')}`
  const [pre, w, rel, life, relDate, lead] = o.plm ?? []
  const p = o.plm ? P[pre] : null
  const day = 1 + ((n * 7) % 27)
  const mo = 1 + ((n * 5) % 12)
  const created = `${o.createdYear ?? 2025}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}T09:${String(10 + n).padStart(2, '0')}:00.000Z`
  const updated = o.updated ?? `2026-0${1 + (n % 9)}-${String(1 + ((n * 3) % 27)).padStart(2, '0')}T14:${String(10 + n).padStart(2, '0')}:00.000Z`
  const file = {
    id, name: o.name, kind: o.kind, format: o.name.split('.').pop(),
    sizeBytes: o.size, source: o.source, createdBy: CREATOR[n % CREATOR.length], created, updated,
    lastSynced: `2026-10-0${1 + (n % 7)}T0${n % 9}:${String(10 + n).padStart(2, '0')}:00.000Z`,
    thumbnail: `/cad-preview-${1 + (n % 5)}.png`,
    partNumber: o.pn, revision: o.rev, lineageId: o.lineage, description: o.desc, geometryHash: o.hash ?? `g-${id}`,
    plm: p ? {
      program: p[0], modelYear: p[1], programType: p[2], customerGroup: p[3], region: p[4], productGroup: p[5], productLine: p[6],
      calcWeight: w, releaseStatus: rel, lifecycleState: life, releasedDate: relDate, supplierLeadTime: lead,
    } : {},
  }
  if (o.supersededBy) file.supersededBy = o.supersededBy
  files.push(file)
  byKey[key] = file
  return file
}

/* ---------------------------- Parts (28) ---------------------------- */
// RSB40 arm L revision lineage: Rev A, B, C, then AA, AB, AC (B and C carry identical geometry: a metadata-only revision).
const revs = ['A', 'B', 'C', 'AA', 'AB', 'AC']
revs.forEach((r, i) => {
  add(`rsb40-${r}`, {
    name: `7100490_0001_${r}_RSB40_ARM_L.CATPart`, kind: 'part', source: 'Teamcenter', size: 11_000_000 + i * 120_000, pn: '7100490', rev: r, lineage: 'RSB40-ARM-L',
    desc: 'RSB40 rear suspension arm, left', hash: r === 'C' ? 'g-rsb40-l-b' : r === 'B' ? 'g-rsb40-l-b' : undefined, createdYear: 2024 + (i > 2 ? 1 : 0),
    plm: ['atlas24', 3.6 + i * 0.05, i === 5 ? 'In Review' : i === 4 ? 'Released' : 'Obsolete', i === 5 ? 'In Work' : i === 4 ? 'Released' : 'Superseded', i === 5 ? null : `2025-0${1 + i}-12`, 6],
  })
})
revs.forEach((r, i) => { if (i < 5) byKey[`rsb40-${r}`].supersededBy = byKey[`rsb40-${revs[i + 1]}`].id })
add('def', { name: '7100490_0000_AB_ASM_RSB40_DEF.CATPart', kind: 'part', source: 'Teamcenter', size: 16_800_000, pn: '7100490', rev: 'AB', lineage: 'RSB40-DEF', desc: 'RSB40 deflection link', hash: 'g-rsb40-def', plm: ['atlas24', 4.2, 'Released', 'Released', '2025-03-12', 8] })
add('defcopy', { name: '7100490_0000_AB_ASM_RSB40_DEF.CATPart', kind: 'part', source: 'CAD Library', size: 16_800_000, pn: '7100490', rev: 'AB', lineage: 'RSB40-DEF', desc: 'RSB40 deflection link (vault copy)', hash: 'g-rsb40-def', plm: null })
add('armr', { name: '7100490_0002_AC_RSB40_ARM_R.CATPart', kind: 'part', source: 'Teamcenter', size: 11_400_000, pn: '7100490', rev: 'AC', lineage: 'RSB40-ARM-R', desc: 'RSB40 rear suspension arm, right', plm: ['atlas25', 3.7, 'In Review', 'In Work', null, 6] })
add('k117', { name: 'K04-117-RS_BRKT_MOUNT.SLDPRT', kind: 'part', source: 'CAD Library', size: 3_400_000, pn: 'K04-117', rev: 'A', lineage: 'K04-117', desc: 'Bracket mount, right side', hash: 'g-k04-117', plm: ['k04', 0.9, 'Released', 'Released', '2025-03-30', 4] })
add('k118', { name: 'K04-118-LS_BRKT_MOUNT.SLDPRT', kind: 'part', source: 'CAD Library', size: 3_300_000, pn: 'K04-118', rev: 'A', lineage: 'K04-118', desc: 'Bracket mount, left side', plm: ['atlasBr', 0.9, 'Released', 'Frozen', '2025-03-30', 4] })
add('k117b', { name: 'K04_117_RS_BRKT_MOUNT_B.SLDPRT', kind: 'part', source: 'Windchill', size: 3_390_000, pn: 'K04-117', rev: 'B', lineage: 'K04-117', desc: 'Bracket mount, right side (Windchill export)', hash: 'g-k04-117', plm: ['k04', 0.9, 'Pending Sign-off', 'In Work', null, 4] })
add('engmt', { name: '7100631_0000_AA_ENG_MOUNT_FR.CATPart', kind: 'part', source: 'Teamcenter', size: 8_700_000, pn: '7100631', rev: 'AA', lineage: 'ENG-MOUNT-FR', desc: 'Front engine mount', plm: ['atlasEng', 2.1, 'Released', 'Released', '2025-04-05', 10] })
add('axle', { name: '7300042_0000_AB_ORION_AXLE_HSG.CATPart', kind: 'part', source: 'Teamcenter', size: 52_700_000, pn: '7300042', rev: 'AB', lineage: 'ORION-AXLE-HSG', desc: 'Axle housing', plm: ['orion', 17.6, 'Released', 'Released', '2026-04-22', 16] })

// Seat parts (12 from the Complete Seat) plus a revision predecessor and an OEM STEP export of the upper track rail.
const seat = (key, name, rev, pn, desc, pre, w, rel, life, date, lead, extra = {}) =>
  add(key, { name, kind: 'part', source: 'Teamcenter', size: 1_200_000 + n * 90_000, pn, rev, lineage: pn, desc, plm: [pre, w, rel, life, date, lead], ...extra })
seat('s-fbo8', 'FrameBack_Outer_v8.CATPart', 'AC', 'FBO-2241', 'Seat back frame, outer shell', 'tundra22', 2.84, 'Released', 'Released', '2026-05-04', 12, { hash: 'g-fbo-8' })
seat('s-fbo7', 'FrameBack_Outer_v7.CATPart', 'AB', 'FBO-2241', 'Seat back frame, outer shell (previous)', 'tundra23', 2.86, 'Obsolete', 'Superseded', '2026-04-15', 12, { supersededBy: '' })
seat('s-fbi', 'FrameBack_Inner_v2.CATPart', 'AB', 'FBI-2244', 'Seat back frame, inner shell', 'tundra22', 2.1, 'Released', 'Released', '2026-02-28', 12)
seat('s-cfl', 'Cushion_Foam_Lower.CATPart', 'A', 'CFL-3310', 'Cushion foam, lower', 'tundra22', 0.9, 'Released', 'Frozen', '2026-01-19', 5)
seat('s-cfu', 'Cushion_Foam_Upper.CATPart', 'A', 'CFU-3311', 'Cushion foam, upper', 'tundra22', 0.7, 'WIP', 'In Work', null, 5)
seat('s-hrc', 'Headrest_Core_AC.CATPart', 'AC', 'HRC-2210', 'Headrest foam core', 'buzz', 0.31, 'Released', 'Released', '2026-04-04', 5)
seat('s-rml', 'Recliner_Mech_LH_r4.CATPart', 'B', 'RML-0814', 'Recliner mechanism, left', 'tundra23', 0.62, 'Released', 'Released', '2026-03-19', 9)
seat('s-rmr', 'Recliner_Mech_RH_r4.CATPart', 'B', 'RMR-0815', 'Recliner mechanism, right', 'tundra23', 0.62, 'Released', 'Released', '2026-03-19', 9)
seat('s-tru', 'TrackRail_Upper_24a.CATPart', 'A', 'TRU-0410', 'Track rail, upper', 'bronco', 1.12, 'Released', 'Released', '2026-02-28', 7, { hash: 'g-tru' })
seat('s-trl', 'TrackRail_Lower_24a.CATPart', 'A', 'TRL-0411', 'Track rail, lower', 'bronco', 1.4, 'In Review', 'In Work', null, 7)
seat('s-sh', 'Seat_Heater_Pad.CATPart', 'A', 'SHP-5520', 'Seat heater pad', 'buzz', 0.12, 'Released', 'Released', '2026-02-11', 11)
seat('s-bab', 'Buckle_Anchor_Bracket_r2.CATPart', 'B', 'BAB-0917', 'Buckle anchor bracket', 'silverado', 0.18, 'Released', 'Released', '2026-03-22', 4)
seat('s-tcl', 'Trim_Cover_Lower_r1.CATPart', 'A', 'TCL-1108', 'Trim cover, lower', 'silverado', 0.42, 'WIP', 'In Work', null, 6)
add('s-trstep', { name: 'TrackRail_Upper_OEM.STEP', kind: 'part', source: 'Windchill', size: 2_100_000, pn: 'TRU-0410-OEM', rev: 'A', lineage: 'TRU-0410-OEM', desc: 'Track rail, upper (OEM STEP export)', hash: 'g-tru', plm: null })
byKey['s-fbo7'].supersededBy = byKey['s-fbo8'].id

/* -------------------------- Assemblies (12) ------------------------- */
let nodeSeq = 0
const leaf = (fileKey, name, reference = false) => ({ id: `n${++nodeSeq}`, name, ...(fileKey ? { fileId: byKey[fileKey].id } : {}), ...(reference ? { reference: true } : {}) })
const group = (name, children) => ({ id: `n${++nodeSeq}`, name, children })
const asm = (key, o, tree) => {
  nodeSeq = 0
  const t = tree()
  return Object.assign(add(key, { ...o, kind: 'assembly' }), { tree: [t] })
}
const seatTree = (title, withExtra) => () => group(title, [
  group('Seat_Back_Assy', [
    leaf('s-fbo8', 'FrameBack_Outer'), leaf('s-fbi', 'FrameBack_Inner'),
    group('Headrest_Assy', [leaf('s-hrc', 'Headrest_Core'), leaf(null, 'Headrest_Cover', true)]),
    group('Recliner_Assy', [leaf('s-rml', 'Recliner_Mech_LH'), leaf('s-rmr', 'Recliner_Mech_RH'), leaf(null, 'Recliner_Bolt_M10', true)]),
  ]),
  group('Seat_Cushion_Assy', [leaf('s-cfl', 'Cushion_Foam_Lower'), leaf('s-cfu', 'Cushion_Foam_Upper'), leaf('s-sh', 'Seat_Heater_Pad'), leaf('s-tcl', 'Trim_Cover_Lower')]),
  group('Track_Assy', [leaf('s-tru', 'TrackRail_Upper'), leaf('s-trl', 'TrackRail_Lower'), leaf('s-bab', 'Buckle_Anchor_Bracket'), leaf(null, 'Track_Fasteners', true), ...(withExtra ? [leaf(null, 'Track_Cover_Reference', true)] : [])]),
])

asm('a-cs1', { name: '6644321_AA_COMPLETE_SEAT.CATProduct', source: 'Teamcenter', size: 41_300_000, pn: '6644321', rev: 'AA', lineage: 'TUN-780B-CS-001', desc: 'Complete Seat, 1st and 2nd row', createdYear: 2026, plm: ['tundra22', 38.4, 'id1055', 'Released', '2026-05-08', 14] }, seatTree('Complete_Seat', true))
asm('a-cs2', { name: '6644336_AB_COMPLETE_SEAT.CATProduct', source: 'Teamcenter', size: 44_800_000, pn: '6644336', rev: 'AB', lineage: 'TUN-780B-CS-002', desc: 'Complete Seat, 1st and 2nd row, MY23', createdYear: 2026, plm: ['tundra23', 38.9, 'Released', 'Released', '2026-05-09', 14] }, seatTree('Complete_Seat', false))
asm('a-cs3', { name: '6644336_AA_COMPLETE_SEAT.CATProduct', source: 'Teamcenter', size: 44_100_000, pn: '6644336', rev: 'AA', lineage: 'TUN-780B-CS-002', desc: 'Complete Seat, 1st and 2nd row, MY23 (previous revision)', createdYear: 2026, supersededBy: '', plm: ['tundra23', 38.7, 'Obsolete', 'Superseded', '2026-03-14', 14] }, () => group('Complete_Seat', [
  group('Seat_Back_Assy', [leaf('s-fbo7', 'FrameBack_Outer'), leaf('s-fbi', 'FrameBack_Inner'), group('Recliner_Assy', [leaf('s-rml', 'Recliner_Mech_LH'), leaf('s-rmr', 'Recliner_Mech_RH')])]),
  group('Seat_Cushion_Assy', [leaf('s-cfl', 'Cushion_Foam_Lower'), leaf('s-cfu', 'Cushion_Foam_Upper')]),
  group('Track_Assy', [leaf('s-tru', 'TrackRail_Upper'), leaf('s-trl', 'TrackRail_Lower'), leaf(null, 'Track_Fasteners', true)]),
]))
byKey['a-cs3'].supersededBy = byKey['a-cs2'].id
asm('a-bro', { name: '6651104_BA_COMPLETE_SEAT.CATProduct', source: 'Teamcenter', size: 38_200_000, pn: '6651104', rev: 'BA', lineage: 'FOR-P702-CS-001', desc: 'Complete Seat, 2nd row bench', hash: 'g-bronco-bench', createdYear: 2026, plm: ['bronco', 31.2, 'Released', 'Released', '2026-04-22', 12] }, () => group('Bench_Seat', [
  group('Bench_Back_Assy', [leaf('s-fbo8', 'FrameBack_Outer'), leaf('s-fbi', 'FrameBack_Inner'), leaf('s-hrc', 'Headrest_Core')]),
  group('Bench_Track_Assy', [leaf('s-tru', 'TrackRail_Upper'), leaf('s-trl', 'TrackRail_Lower'), leaf('s-bab', 'Buckle_Anchor_Bracket'), leaf(null, 'Track_Fasteners', true)]),
  leaf('s-tcl', 'Trim_Cover_Lower'),
]))
asm('a-brom', { name: 'Bronco_2ndRowBench_FINAL.CATProduct', source: 'CAD Library', size: 38_200_000, pn: '6651104-M', rev: 'BA', lineage: 'FOR-P702-CS-MIR', desc: 'Bronco 2nd row bench (mirror copy)', hash: 'g-bronco-bench', createdYear: 2026, plm: null }, () => group('Bench_Seat', [
  group('Bench_Back_Assy', [leaf('s-fbo8', 'FrameBack_Outer'), leaf('s-fbi', 'FrameBack_Inner'), leaf('s-hrc', 'Headrest_Core')]),
  group('Bench_Track_Assy', [leaf('s-tru', 'TrackRail_Upper'), leaf('s-trl', 'TrackRail_Lower'), leaf('s-bab', 'Buckle_Anchor_Bracket'), leaf(null, 'Track_Fasteners', true)]),
  leaf('s-tcl', 'Trim_Cover_Lower'),
]))
asm('a-buz1', { name: '8810022_AC_FRONT_SEAT.CATProduct', source: 'Teamcenter', size: 36_000_000, pn: '8810022', rev: 'AC', lineage: 'VW-MEB-FS-014', desc: 'Front seat, driver', createdYear: 2026, plm: ['buzz', 24.8, 'Released', 'Released', '2026-02-11', 13] }, () => group('Front_Seat', [
  group('Back_Assy', [leaf('s-fbo8', 'FrameBack_Outer'), leaf('s-fbi', 'FrameBack_Inner'), leaf('s-hrc', 'Headrest_Core'), leaf(null, 'Back_Trim_Reference', true)]),
  group('Cushion_Assy', [leaf('s-cfl', 'Cushion_Foam_Lower'), leaf('s-sh', 'Seat_Heater_Pad')]),
]))
asm('a-buz2', { name: '8810022_AB_FRONT_SEAT.CATProduct', source: 'Teamcenter', size: 35_400_000, pn: '8810022', rev: 'AB', lineage: 'VW-MEB-FS-014', desc: 'Front seat, driver (previous revision)', createdYear: 2026, supersededBy: '', plm: ['buzz', 24.6, 'Obsolete', 'Superseded', '2026-01-22', 13] }, () => group('Front_Seat', [
  group('Back_Assy', [leaf('s-fbo7', 'FrameBack_Outer'), leaf('s-fbi', 'FrameBack_Inner'), leaf('s-hrc', 'Headrest_Core')]),
  group('Cushion_Assy', [leaf('s-cfl', 'Cushion_Foam_Lower'), leaf('s-sh', 'Seat_Heater_Pad')]),
]))
byKey['a-buz2'].supersededBy = byKey['a-buz1'].id
asm('a-gm', { name: 'GM_T1XX_CrewCab_RearBench.CATProduct', source: 'Windchill', size: 33_000_000, pn: 'GM-T1XX-RB', rev: 'AA', lineage: 'GM-T1XX-RB-001', desc: 'Rear bench, crew cab', createdYear: 2025, plm: ['silverado', 29.5, 'Released', 'Released', '2025-12-02', 15] }, () => group('Rear_Bench', [
  group('Bench_Back_Assy', [leaf('s-fbo7', 'FrameBack_Outer'), leaf('s-fbi', 'FrameBack_Inner')]),
  group('Bench_Track_Assy', [leaf('s-tru', 'TrackRail_Upper'), leaf('s-bab', 'Buckle_Anchor_Bracket'), leaf(null, 'Track_Fasteners', true)]),
  leaf('s-tcl', 'Trim_Cover_Lower'),
]))
asm('a-sub', { name: '7100512_0000_AB_ASM_SUBFRAME_S2.CATProduct', source: 'Teamcenter', size: 41_300_000, pn: '7100512', rev: 'AB', lineage: 'SUBFRAME-S2', desc: 'Subframe S2 assembly', plm: ['atlasSub', 12.8, 'Released', 'Frozen', '2025-02-28', 18] }, () => group('Subframe_S2', [
  group('Arm_Assy', [leaf('rsb40-AB', 'RSB40_ARM_L'), leaf('armr', 'RSB40_ARM_R'), leaf('def', 'RSB40_DEF'), leaf(null, 'Bushing_Set', true)]),
  group('Mount_Assy', [leaf('engmt', 'ENG_MOUNT_FR'), leaf('k117', 'BRKT_MOUNT_RS'), leaf('k118', 'BRKT_MOUNT_LS')]),
]))
asm('a-vega', { name: '7200118_0000_AB_VEGA_CROSSMBR.CATProduct', source: 'Teamcenter', size: 28_100_000, pn: '7200118', rev: 'AB', lineage: 'VEGA-CROSSMBR', desc: 'Vega crossmember', plm: ['vega', 9.4, 'Released', 'Released', '2025-01-18', 14] }, () => group('Vega_Crossmember', [
  group('Beam_Assy', [leaf('k117', 'BRKT_MOUNT_RS'), leaf('k118', 'BRKT_MOUNT_LS'), leaf('k117b', 'BRKT_MOUNT_RS_B'), leaf(null, 'Weld_Nuts', true)]),
  leaf('axle', 'AXLE_HSG'),
]))
asm('a-trk', { name: 'K04-200-RS_TRACK_ASSY.JT', source: 'CAD Library', size: 19_500_000, pn: 'K04-200', rev: 'A', lineage: 'K04-200', desc: 'Seat track assembly (JT)', plm: ['k04', 6.2, 'In Review', 'In Work', null, 8] }, () => group('Track_Assy_JT', [
  group('Rail_Pair', [leaf('s-tru', 'TrackRail_Upper'), leaf('s-trl', 'TrackRail_Lower')]),
  leaf('k117', 'BRKT_MOUNT_RS'), leaf(null, 'Fastener_Kit', true),
]))
asm('a-hlx', { name: '7500031_0000_AA_HELIX_CRADLE_ASM.PRT', source: 'Teamcenter', size: 47_600_000, pn: '7500031', rev: 'AA', lineage: 'HELIX-CRADLE', desc: 'Helix front cradle (NX)', plm: ['helix', 21.3, 'In Review', 'In Work', null, 17] }, () => group('Helix_Cradle', [
  group('Cradle_Frame', [leaf('axle', 'AXLE_HSG'), leaf('engmt', 'ENG_MOUNT_FR'), leaf('rsb40-AC', 'RSB40_ARM_L')]),
  group('Cradle_Hardware', [leaf('k118', 'BRKT_MOUNT_LS'), leaf(null, 'Cradle_Bolts', true)]),
]))

/* ------------------------------- geometry ---------------------------- */
const SURF = ['Plane', 'Cylinder', 'Cone', 'Nurbs', 'Plane', 'Cylinder', 'Plane']
const geometry = {}
files.forEach((f, fi) => {
  const items = []
  if (f.kind === 'part') {
    const nFaces = 4 + (fi % 3)
    for (let i = 0; i < nFaces; i++) items.push({ ref: `${f.id}-face-${10 + i * 4}`, kind: 'face', label: `Face ${10 + i * 4} (${SURF[(i + fi) % SURF.length]})` })
    for (let i = 0; i < 3; i++) items.push({ ref: `${f.id}-edge-${3 + i * 5}`, kind: 'edge', label: `Edge ${3 + i * 5} (${['Circle', 'Line', 'Arc'][(i + fi) % 3]})` })
    items.push({ ref: `${f.id}-body-1`, kind: 'body', label: 'Body 1' })
  } else {
    const walk = (nodes, depth) => nodes.forEach((nd) => { if (nd.children) { if (depth > 0) items.push({ ref: `${f.id}-body-${nd.id}`, kind: 'body', label: `Sub-assembly: ${nd.name}` }); walk(nd.children, depth + 1) } else if (!nd.reference) items.push({ ref: `${f.id}-body-${nd.id}`, kind: 'body', label: `Body: ${nd.name}` }) })
    walk(f.tree, 0)
    items.length = Math.min(items.length, 10)
    items.push({ ref: `${f.id}-body-all`, kind: 'body', label: 'Body: whole assembly' }, { ref: `${f.id}-body-env`, kind: 'body', label: 'Body: bounding envelope' })
  }
  geometry[f.id] = items
})

/* ------------------------------ write -------------------------------- */
writeFileSync(`${OUT}files.json`, JSON.stringify(files, null, 2) + '\n')
writeFileSync(`${OUT}geometry.json`, JSON.stringify(geometry, null, 2) + '\n')
console.log(`files: ${files.length} (${files.filter((f) => f.kind === 'part').length} parts, ${files.filter((f) => f.kind === 'assembly').length} assemblies)`)
