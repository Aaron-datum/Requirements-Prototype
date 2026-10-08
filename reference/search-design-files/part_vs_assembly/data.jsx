// data.jsx — modality-aware sample data
// Models the Adient seat data from the screenshot, but enriched so we can show:
//   parts vs assemblies, duplicates (identical geometry across files),
//   and PLM version lineages (Rev A, B, C ... AA, AB, AC).
const { useState, useMemo, useRef, useEffect } = React;

// ───────── Match levels (mirrors the existing system) ─────────
const RELEVANCE = [
  { key: "exact", label: "Exact Match", color: "#1A6B3A", bg: "#DCEFE1", barFill: "#1A6B3A" },
  { key: "high",  label: "High",        color: "#27500A", bg: "#EAF3DE", barFill: "#3F8429" },
  { key: "med",   label: "Medium",      color: "#7A4F00", bg: "#FFF3CD", barFill: "#C69400" },
  { key: "low",   label: "Low",         color: "#A8200D", bg: "#FBE2DD", barFill: "#A8200D" },
];
const levelFromPct = (p) => p >= 95 ? "exact" : p >= 85 ? "high" : p >= 70 ? "med" : "low";

// ───────── Asset rotation ─────────
const PREVIEWS = [
  "assets/cad-preview-1.png",
  "assets/cad-preview-2.png",
  "assets/cad-preview-3.png",
  "assets/cad-preview-4.png",
  "assets/cad-preview-5.png",
];

// ───────── PLM scaffolding: child parts inside the "Complete Seat" assembly ─────────
// 12 distinct seat parts. Used as children for assembly rows.
const SEAT_PARTS = [
  { name: "FrameBack_Outer.CATPart",        category: "Structural",  pct: 96 },
  { name: "FrameBack_Inner.CATPart",        category: "Structural",  pct: 94 },
  { name: "Cushion_Foam_Lower.CATPart",     category: "Comfort",     pct: 89 },
  { name: "Cushion_Foam_Upper.CATPart",     category: "Comfort",     pct: 87 },
  { name: "Headrest_Core.CATPart",          category: "Comfort",     pct: 92 },
  { name: "Recliner_Mechanism_LH.CATPart",  category: "Mechanism",   pct: 81 },
  { name: "Recliner_Mechanism_RH.CATPart",  category: "Mechanism",   pct: 81 },
  { name: "Track_Rail_Upper.CATPart",       category: "Track",       pct: 78 },
  { name: "Track_Rail_Lower.CATPart",       category: "Track",       pct: 77 },
  { name: "Seat_Heater_Pad.CATPart",        category: "Electrical",  pct: 65 },
  { name: "Buckle_Anchor_Bracket.CATPart",  category: "Structural",  pct: 88 },
  { name: "Trim_Cover_Lower.CATPart",       category: "Trim",        pct: 72 },
];

// Build child-part objects (with measured match %) for an assembly.
// We seed off the assembly's overall relevance so children cluster near it.
function buildChildren(seed, count = 12) {
  return SEAT_PARTS.slice(0, count).map((p, i) => {
    // Spread children around the assembly's seed
    const offset = ((i * 13 + seed * 7) % 20) - 8;
    const pct = Math.max(35, Math.min(99, p.pct + offset));
    return {
      id: `${seed}-${i}`,
      name: p.name,
      category: p.category,
      pct,
      level: levelFromPct(pct),
      // Tag a couple as the "matched" children — the ones that drove the assembly's score
      matched: i < 3 && pct >= 80,
    };
  });
}

// ───────── ASSEMBLY rows (CATProduct) — Complete Seat at different revisions / programs ─────────
const ASSEMBLY_ROWS = [
  {
    id: "asm-1",
    kind: "assembly",
    file: "6644321_AA_COMPLETE_SEAT.CATProduct",
    objectName: "MY 22 / AM / TOYOTA / 780B / Tundra / Complete Seat / 1st & 2nd Row",
    objectId: "6644321",
    revision: "AA",
    releaseStatus: "id1055",
    objectType: "Ng5_EngPartRevision",
    program: "Tundra",
    oem: "TOYOTA",
    platform: "F Platform",
    facility: "0849 — Avanzar Technologies JV",
    source: "Teamcenter",
    created: "May 8, 2026",
    edited: "May 11, 2026",
    relevancePct: 100,
    childCount: 100,
    preview: PREVIEWS[0],
    // PLM lineage: AA is latest; predecessors exist
    lineage: { latest: true, lineageId: "TUN-780B-CS-001", priorCount: 4 },
    duplicates: 0,
  },
  {
    id: "asm-2",
    kind: "assembly",
    file: "6644336_AB_COMPLETE_SEAT.CATProduct",
    objectName: "MY 23 / AM / TOYOTA / 780B / Tundra / Complete Seat / 1st & 2nd Row",
    objectId: "6644336",
    revision: "AB",
    releaseStatus: "id1206",
    objectType: "Ng5_EngPartRevision",
    program: "Tundra",
    oem: "TOYOTA",
    platform: "F Platform",
    facility: "0849 — Avanzar Technologies JV",
    source: "Teamcenter",
    created: "May 9, 2026",
    edited: "May 11, 2026",
    relevancePct: 99,
    childCount: 246,
    preview: PREVIEWS[1],
    lineage: { latest: true, lineageId: "TUN-780B-CS-002", priorCount: 3 },
    duplicates: 0,
  },
  {
    id: "asm-3",
    kind: "assembly",
    file: "6644336_AA_COMPLETE_SEAT.CATProduct",
    objectName: "MY 23 / AM / TOYOTA / 780B / Tundra / Complete Seat / 1st & 2nd Row",
    objectId: "6644336",
    revision: "AA",
    releaseStatus: "id1198",
    objectType: "Ng5_EngPartRevision",
    program: "Tundra",
    oem: "TOYOTA",
    platform: "F Platform",
    facility: "0849 — Avanzar Technologies JV",
    source: "Teamcenter",
    created: "Mar 14, 2026",
    edited: "Apr 02, 2026",
    relevancePct: 97,
    childCount: 244,
    preview: PREVIEWS[1],
    // Older revision of asm-2's lineage
    lineage: { latest: false, lineageId: "TUN-780B-CS-002", priorCount: 0, supersededBy: "asm-2" },
    duplicates: 0,
  },
  {
    id: "asm-4",
    kind: "assembly",
    file: "6651104_BA_COMPLETE_SEAT.CATProduct",
    objectName: "MY 24 / NA / FORD / P702 / Bronco / Complete Seat / 2nd Row Bench",
    objectId: "6651104",
    revision: "BA",
    releaseStatus: "id1422",
    objectType: "Ng5_EngPartRevision",
    program: "Bronco",
    oem: "FORD",
    platform: "T6 Platform",
    facility: "0312 — Setex Inc",
    source: "Teamcenter",
    created: "Apr 22, 2026",
    edited: "May 03, 2026",
    relevancePct: 92,
    childCount: 188,
    preview: PREVIEWS[2],
    lineage: { latest: true, lineageId: "FOR-P702-CS-001", priorCount: 2 },
    // This assembly file is identical in geometry to asm-5 (uploaded twice into different vaults)
    duplicates: 2,
    dupGroup: "dup-asm-A",
  },
  {
    id: "asm-5",
    kind: "assembly",
    file: "Bronco_2ndRowBench_FINAL.CATProduct",
    objectName: "Bronco P702 — 2nd Row Bench (mirror copy)",
    objectId: "6651104-mirror",
    revision: "BA",
    releaseStatus: "—",
    objectType: "Ng5_EngPartRevision",
    program: "Bronco",
    oem: "FORD",
    platform: "T6 Platform",
    facility: "0312 — Setex Inc",
    source: "SharePoint",
    created: "Apr 24, 2026",
    edited: "Apr 24, 2026",
    relevancePct: 92,
    childCount: 188,
    preview: PREVIEWS[2],
    lineage: { latest: true, lineageId: "FOR-P702-CS-MIR", priorCount: 0 },
    duplicates: 2,
    dupGroup: "dup-asm-A",
  },
  {
    id: "asm-6",
    kind: "assembly",
    file: "8810022_AC_FRONT_SEAT.CATProduct",
    objectName: "MY 25 / EU / VW / MEB / ID.Buzz / Front Seat / Driver",
    objectId: "8810022",
    revision: "AC",
    releaseStatus: "id2014",
    objectType: "Ng5_EngPartRevision",
    program: "ID.Buzz",
    oem: "VW",
    platform: "MEB",
    facility: "1402 — Bratislava",
    source: "Teamcenter",
    created: "Feb 11, 2026",
    edited: "Mar 28, 2026",
    relevancePct: 87,
    childCount: 162,
    preview: PREVIEWS[3],
    lineage: { latest: true, lineageId: "VW-MEB-FS-014", priorCount: 6 },
    duplicates: 0,
  },
  {
    id: "asm-7",
    kind: "assembly",
    file: "8810022_AB_FRONT_SEAT.CATProduct",
    objectName: "MY 25 / EU / VW / MEB / ID.Buzz / Front Seat / Driver",
    objectId: "8810022",
    revision: "AB",
    releaseStatus: "id1988",
    objectType: "Ng5_EngPartRevision",
    program: "ID.Buzz",
    oem: "VW",
    platform: "MEB",
    facility: "1402 — Bratislava",
    source: "Teamcenter",
    created: "Jan 22, 2026",
    edited: "Feb 04, 2026",
    relevancePct: 85,
    childCount: 160,
    preview: PREVIEWS[3],
    lineage: { latest: false, lineageId: "VW-MEB-FS-014", priorCount: 0, supersededBy: "asm-6" },
    duplicates: 0,
  },
  {
    id: "asm-8",
    kind: "assembly",
    file: "GM_T1XX_CrewCab_RearBench.CATProduct",
    objectName: "MY 24 / NA / GM / T1XX / Silverado / Rear Bench / 2nd Row",
    objectId: "GM-T1XX-RB",
    revision: "AA",
    releaseStatus: "id0991",
    objectType: "Ng5_EngPartRevision",
    program: "Silverado",
    oem: "GM",
    platform: "T1XX",
    facility: "0728 — Roanoke",
    source: "Teamcenter",
    created: "Oct 14, 2025",
    edited: "Dec 02, 2025",
    relevancePct: 73,
    childCount: 134,
    preview: PREVIEWS[4],
    lineage: { latest: true, lineageId: "GM-T1XX-RB-001", priorCount: 1 },
    duplicates: 0,
  },
];

// Attach children (used in modes B, C)
ASSEMBLY_ROWS.forEach((r, i) => {
  r.children = buildChildren(i + 1, 12);
  r.totalChildCount = r.children.length;

  // Sort children high-to-low by their measured geometric %
  r.children.sort((a, b) => b.pct - a.pct);

  // The number of matching parts scales with the assembly's overall geometric match:
  //   100% overall → ALL 12 parts match
  //    99% overall → 11–12 parts match
  //    90% overall → ~11 parts match
  //    73% overall → ~9 parts match
  // (matchedChildCount is the count of parts with high-enough geometric % to count as a match.)
  const target = Math.max(1, Math.round(r.totalChildCount * r.relevancePct / 100));
  r.children.forEach((c, idx) => {
    c.matched = idx < target;
    // For a 100% exact assembly match, every child should read ≥ 85% geometric match.
    if (r.relevancePct >= 99 && c.pct < 85) c.pct = 85 + ((idx * 3) % 14); // 85–98 spread
    if (r.relevancePct === 100) c.pct = Math.max(c.pct, 92 + ((idx * 5) % 8)); // 92–99
    c.level = levelFromPct(c.pct);
  });
  r.matchedChildCount = target;

  // For "Part in assembly" — the single best matching child
  r.bestChild = r.children[0];
  r.level = levelFromPct(r.relevancePct);
});

// ───────── PART rows (CATPart / STEP) — standalone or extracted ─────────
const PART_ROWS = [
  {
    id: "part-1",
    kind: "part",
    file: "FrameBack_Outer_v8.CATPart",
    objectName: "Seat Back Frame — Outer Shell",
    objectId: "FBO-2241",
    revision: "AC",
    objectType: "Ng5_EngPart",
    category: "Structural",
    source: "Teamcenter",
    created: "May 4, 2026",
    edited: "May 10, 2026",
    relevancePct: 98,
    preview: PREVIEWS[0],
    parentAssembly: { id: "asm-1", name: "6644321_AA_COMPLETE_SEAT", program: "Tundra · MY22" },
    lineage: { latest: true, lineageId: "FBO-2241", priorCount: 7 },
    duplicates: 0,
    massKg: 2.84,
    material: "Steel HSLA340",
  },
  {
    id: "part-2",
    kind: "part",
    file: "FrameBack_Outer_v7.CATPart",
    objectName: "Seat Back Frame — Outer Shell",
    objectId: "FBO-2241",
    revision: "AB",
    objectType: "Ng5_EngPart",
    category: "Structural",
    source: "Teamcenter",
    created: "Apr 15, 2026",
    edited: "Apr 22, 2026",
    relevancePct: 97,
    preview: PREVIEWS[0],
    parentAssembly: { id: "asm-3", name: "6644336_AA_COMPLETE_SEAT", program: "Tundra · MY23" },
    lineage: { latest: false, lineageId: "FBO-2241", priorCount: 0, supersededBy: "part-1" },
    duplicates: 0,
    massKg: 2.86,
    material: "Steel HSLA340",
  },
  {
    id: "part-3",
    kind: "part",
    file: "Recliner_Mech_LH_r4.CATPart",
    objectName: "Recliner Mechanism — LH",
    objectId: "RML-0814",
    revision: "B",
    objectType: "Ng5_EngPart",
    category: "Mechanism",
    source: "Teamcenter",
    created: "Mar 19, 2026",
    edited: "Apr 02, 2026",
    relevancePct: 94,
    preview: PREVIEWS[1],
    parentAssembly: { id: "asm-2", name: "6644336_AB_COMPLETE_SEAT", program: "Tundra · MY23" },
    lineage: { latest: true, lineageId: "RML-0814", priorCount: 3 },
    duplicates: 0,
    massKg: 0.62,
    material: "Steel — Stamped",
  },
  {
    id: "part-4",
    kind: "part",
    file: "TrackRail_Upper_24a.CATPart",
    objectName: "Track Rail Upper",
    objectId: "TRU-0410",
    revision: "A",
    objectType: "Ng5_EngPart",
    category: "Track",
    source: "SharePoint",
    created: "Feb 28, 2026",
    edited: "Mar 12, 2026",
    relevancePct: 89,
    preview: PREVIEWS[2],
    parentAssembly: { id: "asm-4", name: "Bronco_2ndRowBench", program: "Bronco P702" },
    lineage: { latest: true, lineageId: "TRU-0410", priorCount: 0 },
    duplicates: 3,
    dupGroup: "dup-part-A",
    massKg: 1.12,
    material: "Aluminum 6061-T6",
  },
  {
    id: "part-5",
    kind: "part",
    file: "TrackRail_Upper_OEM.STEP",
    objectName: "Track Rail Upper (OEM export)",
    objectId: "TRU-0410-OEM",
    revision: "A",
    objectType: "Imported STEP",
    category: "Track",
    source: "SharePoint",
    created: "Mar 02, 2026",
    edited: "Mar 02, 2026",
    relevancePct: 89,
    preview: PREVIEWS[2],
    parentAssembly: { id: "asm-4", name: "Bronco_2ndRowBench", program: "Bronco P702" },
    lineage: { latest: true, lineageId: "TRU-0410-OEM", priorCount: 0 },
    duplicates: 3,
    dupGroup: "dup-part-A",
    massKg: 1.12,
    material: "Aluminum 6061-T6",
  },
  {
    id: "part-6",
    kind: "part",
    file: "TrackRail_Upper_v0_archive.CATPart",
    objectName: "Track Rail Upper (archive)",
    objectId: "TRU-0410-ARC",
    revision: "A",
    objectType: "Ng5_EngPart",
    category: "Track",
    source: "Project Archive",
    created: "Jan 11, 2026",
    edited: "Jan 11, 2026",
    relevancePct: 89,
    preview: PREVIEWS[2],
    parentAssembly: { id: "asm-4", name: "Bronco_2ndRowBench", program: "Bronco P702" },
    lineage: { latest: true, lineageId: "TRU-0410-ARC", priorCount: 0 },
    duplicates: 3,
    dupGroup: "dup-part-A",
    massKg: 1.12,
    material: "Aluminum 6061-T6",
  },
  {
    id: "part-7",
    kind: "part",
    file: "Headrest_Core_AC.CATPart",
    objectName: "Headrest Foam Core",
    objectId: "HRC-2210",
    revision: "AC",
    objectType: "Ng5_EngPart",
    category: "Comfort",
    source: "Teamcenter",
    created: "Apr 04, 2026",
    edited: "Apr 18, 2026",
    relevancePct: 84,
    preview: PREVIEWS[3],
    parentAssembly: { id: "asm-6", name: "ID.Buzz Front Seat", program: "VW MEB · MY25" },
    lineage: { latest: true, lineageId: "HRC-2210", priorCount: 5 },
    duplicates: 0,
    massKg: 0.31,
    material: "PU Foam — 60kg/m³",
  },
  {
    id: "part-8",
    kind: "part",
    file: "Buckle_Anchor_Bracket_r2.CATPart",
    objectName: "Buckle Anchor Bracket",
    objectId: "BAB-0917",
    revision: "B",
    objectType: "Ng5_EngPart",
    category: "Structural",
    source: "Teamcenter",
    created: "Mar 22, 2026",
    edited: "Apr 11, 2026",
    relevancePct: 81,
    preview: PREVIEWS[4],
    parentAssembly: { id: "asm-1", name: "6644321_AA_COMPLETE_SEAT", program: "Tundra · MY22" },
    lineage: { latest: true, lineageId: "BAB-0917", priorCount: 2 },
    duplicates: 0,
    massKg: 0.18,
    material: "Steel — Forged",
  },
  {
    id: "part-9",
    kind: "part",
    file: "Trim_Cover_Lower_r1.CATPart",
    objectName: "Trim Cover Lower",
    objectId: "TCL-1108",
    revision: "A",
    objectType: "Ng5_EngPart",
    category: "Trim",
    source: "SharePoint",
    created: "Feb 02, 2026",
    edited: "Feb 14, 2026",
    relevancePct: 72,
    preview: PREVIEWS[1],
    parentAssembly: { id: "asm-8", name: "GM T1XX Rear Bench", program: "Silverado · MY24" },
    lineage: { latest: true, lineageId: "TCL-1108", priorCount: 1 },
    duplicates: 0,
    massKg: 0.42,
    material: "TPO — Grained",
  },
];

PART_ROWS.forEach(r => { r.level = levelFromPct(r.relevancePct); });

// ───────── MODE B: matching part GEOMETRIES (vs an uploaded search part) ─────────
// Mode B's search question is: "find assemblies that contain this or a similar part."
// The right-shaped result list is therefore parts, not assemblies — each row is a
// unique part *geometry* that matched the upload, and each geometry carries a
// list of assemblies it appears in (with per-assembly instance counts because a
// single geometry can be placed multiple times in one BOM — LH/RH, multi-row).
//
// Default view = EXPLODED: one row per (geometry × assembly) pair.
// `Collapse duplicates` ON = COLLAPSED: one row per geometry; the expanded
//                                       panel's Assemblies tab lists every
//                                       assembly that geometry appears in.
const MODE_B_SEARCH_PART = {
  file: "FrameBack_Outer_uploaded.CATPart",
  label: "Seat Back Frame — Outer Shell (your upload)",
};

const MODE_B_GEOMETRIES = [
  {
    id: "geom-1",
    kind: "geometry",
    file: "FrameBack_Outer_v8.CATPart",
    objectName: "Seat Back Frame — Outer Shell",
    objectId: "FBO-2241",
    revision: "AC",
    objectType: "Ng5_EngPart",
    category: "Structural",
    source: "Teamcenter",
    created: "May 4, 2026",
    edited: "May 10, 2026",
    relevancePct: 100,
    preview: PREVIEWS[0],
    massKg: 2.84,
    material: "Steel HSLA340",
    lineage: { latest: true, lineageId: "FBO-2241", priorCount: 7 },
    usedIn: [
      { asmId: "asm-1", asmFile: "6644321_AA_COMPLETE_SEAT.CATProduct",   asmProgram: "Tundra · MY22 · TOYOTA",  partInstance: "BACK_FRAME_OUTER_LH",   instances: 2, edited: "May 11, 2026", source: "Teamcenter" },
      { asmId: "asm-2", asmFile: "6644336_AB_COMPLETE_SEAT.CATProduct",   asmProgram: "Tundra · MY23 · TOYOTA",  partInstance: "FrameBack_Outer",       instances: 1, edited: "May 11, 2026", source: "Teamcenter" },
      { asmId: "asm-3", asmFile: "6644336_AA_COMPLETE_SEAT.CATProduct",   asmProgram: "Tundra · MY23 · TOYOTA (rev AA)", partInstance: "FrameBack_Outer", instances: 1, edited: "Apr 02, 2026", source: "Teamcenter" },
      { asmId: "asm-4", asmFile: "6651104_BA_COMPLETE_SEAT.CATProduct",   asmProgram: "Bronco P702 · FORD",       partInstance: "FB_Outer_Adapted",      instances: 1, edited: "May 03, 2026", source: "Teamcenter" },
    ],
  },
  {
    id: "geom-2",
    kind: "geometry",
    file: "FrameBack_Outer_OEM_export.STEP",
    objectName: "Seat Back Frame — Outer Shell (OEM STEP export)",
    objectId: "FBO-2241-EXP",
    revision: "—",
    objectType: "Imported STEP",
    category: "Structural",
    source: "SharePoint",
    created: "Apr 18, 2026",
    edited: "Apr 18, 2026",
    relevancePct: 95,
    preview: PREVIEWS[0],
    massKg: 2.84,
    material: "Steel HSLA340 (annotated)",
    lineage: { latest: true, lineageId: "FBO-2241-EXP", priorCount: 0 },
    usedIn: [
      { asmId: "asm-6", asmFile: "8810022_AC_FRONT_SEAT.CATProduct", asmProgram: "ID.Buzz · VW · MEB", partInstance: "BackFrame_Outer_Import", instances: 1, edited: "Mar 28, 2026", source: "Teamcenter" },
      { asmId: "asm-7", asmFile: "8810022_AB_FRONT_SEAT.CATProduct", asmProgram: "ID.Buzz · VW · MEB", partInstance: "BackFrame_Outer_Import", instances: 1, edited: "Feb 04, 2026", source: "Teamcenter" },
    ],
  },
  {
    id: "geom-3",
    kind: "geometry",
    file: "FrameBack_Outer_v6.CATPart",
    objectName: "Seat Back Frame — Outer Shell (rev AA, superseded)",
    objectId: "FBO-2241",
    revision: "AA",
    objectType: "Ng5_EngPart",
    category: "Structural",
    source: "Teamcenter",
    created: "Jan 12, 2026",
    edited: "Feb 22, 2026",
    relevancePct: 91,
    preview: PREVIEWS[0],
    massKg: 2.91,
    material: "Steel HSLA340",
    lineage: { latest: false, lineageId: "FBO-2241", priorCount: 0, supersededBy: "geom-1" },
    usedIn: [
      { asmId: "asm-8", asmFile: "GM_T1XX_CrewCab_RearBench.CATProduct", asmProgram: "Silverado · GM · T1XX", partInstance: "FB_Outer_legacy", instances: 1, edited: "Dec 02, 2025", source: "Teamcenter" },
    ],
  },
  {
    id: "geom-4",
    kind: "geometry",
    file: "FrameBack_HD_v3.CATPart",
    objectName: "Seat Back Frame — Heavy-Duty Variant",
    objectId: "FBH-1820",
    revision: "B",
    objectType: "Ng5_EngPart",
    category: "Structural",
    source: "Teamcenter",
    created: "Mar 19, 2026",
    edited: "Apr 28, 2026",
    relevancePct: 84,
    preview: PREVIEWS[2],
    massKg: 3.42,
    material: "Steel HSLA420 (HD gauge)",
    lineage: { latest: true, lineageId: "FBH-1820", priorCount: 1 },
    usedIn: [
      { asmId: "asm-4", asmFile: "6651104_BA_COMPLETE_SEAT.CATProduct", asmProgram: "Bronco P702 · FORD",     partInstance: "BackFrame_HD_LH", instances: 2, edited: "May 03, 2026", source: "Teamcenter" },
      { asmId: "asm-5", asmFile: "Bronco_2ndRowBench_FINAL.CATProduct", asmProgram: "Bronco P702 (mirror)",   partInstance: "BackFrame_HD_LH", instances: 2, edited: "Apr 24, 2026", source: "SharePoint"  },
      { asmId: "asm-8", asmFile: "GM_T1XX_CrewCab_RearBench.CATProduct", asmProgram: "Silverado · GM · T1XX", partInstance: "FrameBack_HD",   instances: 1, edited: "Dec 02, 2025", source: "Teamcenter" },
    ],
  },
  {
    id: "geom-5",
    kind: "geometry",
    file: "FrameBack_Inner_v2.CATPart",
    objectName: "Seat Back Frame — Inner Shell (similar profile)",
    objectId: "FBI-2244",
    revision: "AB",
    objectType: "Ng5_EngPart",
    category: "Structural",
    source: "Teamcenter",
    created: "Feb 28, 2026",
    edited: "Mar 18, 2026",
    relevancePct: 76,
    preview: PREVIEWS[1],
    massKg: 2.10,
    material: "Steel HSLA340",
    lineage: { latest: true, lineageId: "FBI-2244", priorCount: 3 },
    usedIn: [
      { asmId: "asm-1", asmFile: "6644321_AA_COMPLETE_SEAT.CATProduct", asmProgram: "Tundra · MY22 · TOYOTA", partInstance: "BACK_FRAME_INNER",    instances: 1, edited: "May 11, 2026", source: "Teamcenter" },
      { asmId: "asm-2", asmFile: "6644336_AB_COMPLETE_SEAT.CATProduct", asmProgram: "Tundra · MY23 · TOYOTA", partInstance: "FrameBack_Inner",     instances: 1, edited: "May 11, 2026", source: "Teamcenter" },
      { asmId: "asm-6", asmFile: "8810022_AC_FRONT_SEAT.CATProduct",   asmProgram: "ID.Buzz · VW · MEB",     partInstance: "BackFrame_Inner_DE",  instances: 1, edited: "Mar 28, 2026", source: "Teamcenter" },
    ],
  },
  {
    id: "geom-6",
    kind: "geometry",
    file: "SeatBack_Composite_v1.CATPart",
    objectName: "Seat Back — Composite Shell (loose match)",
    objectId: "SBC-9904",
    revision: "A",
    objectType: "Ng5_EngPart",
    category: "Structural",
    source: "Project Archive",
    created: "Nov 02, 2025",
    edited: "Nov 12, 2025",
    relevancePct: 68,
    preview: PREVIEWS[3],
    massKg: 1.62,
    material: "CFRP / Resin",
    lineage: { latest: true, lineageId: "SBC-9904", priorCount: 0 },
    usedIn: [
      { asmId: "asm-6", asmFile: "8810022_AC_FRONT_SEAT.CATProduct", asmProgram: "ID.Buzz · VW · MEB", partInstance: "BackShell_CFRP", instances: 1, edited: "Mar 28, 2026", source: "Teamcenter" },
    ],
  },
];

MODE_B_GEOMETRIES.forEach(g => {
  g.assemblyCount = g.usedIn.length;
  g.totalInstances = g.usedIn.reduce((s, u) => s + u.instances, 0);
  g.level = levelFromPct(g.relevancePct);
});


// ───────── Source colors (from existing system) ─────────
const SOURCE_COLOR = {
  "Teamcenter":      { bg: "#EEEDFE", fg: "#3C3489" },
  "SharePoint":      { bg: "#E0F2EE", fg: "#0F5F50" },
  "Project Archive": { bg: "#EAF3DE", fg: "#27500A" },
  "Local upload":    { bg: "#FFF3CD", fg: "#7A4F00" },
  "CAD Library":     { bg: "var(--datum-blue-tint)", fg: "var(--datum-blue)" },
};

// ───────── View-mode resolver ─────────
// Returns an array of rows for the table given the current modality + toggle state.
// scope: "parts" | "assemblies" | "both"
// flags: { collapseDuplicates: bool, latestOnly: bool }   — independent, can both be on
function resolveRows({ scope, flags = {}, mode }) {
  // ── Mode B has its own data model: matching part geometries × assembly usage.
  if (mode === "b") {
    let geoms = MODE_B_GEOMETRIES.map(g => ({...g}));
    if (flags.latestOnly) {
      geoms = geoms.filter(g => !g.lineage || g.lineage.latest);
    }
    geoms.sort((a, b) => b.relevancePct - a.relevancePct);
    if (flags.collapseDuplicates) return geoms;  // collapsed: 1 row per geometry
    // EXPLODED (default): 1 row per (geometry × assembly).
    const flat = [];
    for (const g of geoms) {
      for (const u of g.usedIn) {
        flat.push({
          ...g,
          kind: "part-instance",
          id: `${g.id}__${u.asmId}`,
          // Override source to match the assembly the part lives in (engineers care
          // about where the BOM came from, not where the geometry was authored).
          source: u.source || g.source,
          edited: u.edited || g.edited,
          assemblyRef: u,
          usedIn: undefined,
        });
      }
    }
    return flat;
  }
  let rows;
  if (scope === "parts") rows = PART_ROWS.map(r => ({...r}));
  else if (scope === "assemblies") rows = ASSEMBLY_ROWS.map(r => ({...r}));
  else rows = [...PART_ROWS, ...ASSEMBLY_ROWS].map(r => ({...r}));

  if (flags.latestOnly) {
    rows = rows.filter(r => !r.lineage || r.lineage.latest);
  }

  if (flags.collapseDuplicates) {
    const seen = new Map();
    const out = [];
    for (const r of rows) {
      if (!r.dupGroup) { out.push(r); continue; }
      if (!seen.has(r.dupGroup)) {
        seen.set(r.dupGroup, { primary: r, others: [] });
        out.push(r);
      } else {
        seen.get(r.dupGroup).others.push(r);
      }
    }
    for (const { primary, others } of seen.values()) {
      primary._dupOthers = others;
      primary._dupCount = others.length + 1;
    }
    rows = out;
  }

  rows.sort((a, b) => b.relevancePct - a.relevancePct);
  return rows;
}

// ───────── Modality presets ─────────
// scope + display hints per modality. Dedup flags default to off; the user
// turns them on independently from the Columns tab.
const MODALITIES = {
  a: {
    id: "a", label: "Parts only",
    blurb: "Standalone parts. No assemblies in results.",
    scope: "parts", flags: { collapseDuplicates: false, latestOnly: false },
    rowContext: "category",
  },
  b: {
    id: "b", label: "Part → Assembly",
    blurb: "You uploaded a part. We find assemblies containing parts like yours.",
    scope: "assemblies", flags: { collapseDuplicates: false, latestOnly: false },
    rowContext: "part-search",
  },
  c: {
    id: "c", label: "Assembly only",
    blurb: "You uploaded an assembly. We find similar assemblies.",
    scope: "assemblies", flags: { collapseDuplicates: false, latestOnly: false },
    rowContext: "structure",
  },
  d: {
    id: "d", label: "Assembly → Part",
    blurb: "You uploaded a part-in-assembly. We extract matching parts from assemblies.",
    scope: "parts", flags: { collapseDuplicates: false, latestOnly: false },
    rowContext: "parent-assembly",
  },
};

Object.assign(window, {
  RELEVANCE, levelFromPct, SOURCE_COLOR,
  PART_ROWS, ASSEMBLY_ROWS, SEAT_PARTS,
  MODE_B_GEOMETRIES, MODE_B_SEARCH_PART,
  resolveRows, MODALITIES, PREVIEWS,
});
