// table.jsx — Modality-aware results table.
// One row component handles all modes; secondary lines/expand panels switch
// based on modality.rowContext.
const { useState: tUseState, useMemo: tUseMemo } = React;

const COLUMNS = [
  { key: "preview",   label: "",                 width: 80,  align: "center" },
  { key: "name",      label: "File Name",        width: "minmax(280px, 1.4fr)" },
  { key: "context",   label: "",                 width: "minmax(220px, 1.2fr)" }, // modality-driven
  { key: "source",    label: "File Source",      width: 130 },
  { key: "created",   label: "Created",          width: 110 },
  { key: "edited",    label: "Edited",           width: 110 },
  { key: "relevance", label: "Overall Geometric Match", width: "minmax(240px, 1.4fr)" },
  { key: "actions",   label: "Actions",          width: 110, align: "right" },
];

// Context column header label per modality
function contextHeaderFor(modality) {
  switch (modality.rowContext) {
    case "best-child":      return "Best matching part";
    case "structure":       return "Assembly structure";
    case "parent-assembly": return "Found in assembly";
    case "category":        return "Part category";
    case "part-search":     return "Used in assemblies";
    default:                return "Context";
  }
}

function gridTemplate() {
  return COLUMNS.map(c => typeof c.width === "number" ? `${c.width}px` : c.width).join(" ");
}

// ───────── Header row ─────────
function HeaderRow({ modality }) {
  return (
    <div style={{
      display:"grid",gridTemplateColumns:gridTemplate(),
      padding:"10px 16px",
      borderBottom:"1px solid var(--border-default)",
      background:"var(--bg-sidebar)",position:"sticky",top:0,zIndex:5,
      alignItems:"center",
    }}>
      {COLUMNS.map(c => {
        const label = c.key === "context" ? contextHeaderFor(modality) : c.label;
        return (
          <div key={c.key} style={{
            fontSize:11, fontWeight:500, color:"var(--fg-muted)",
            textTransform:"uppercase", letterSpacing:"0.4px",
            textAlign: c.align || "left",
            display:"flex",alignItems:"center",gap:4,
            justifyContent: c.align === "right" ? "flex-end" : c.align === "center" ? "center" : "flex-start",
            whiteSpace:"nowrap",
          }}>
            {label}
            {label && c.key !== "preview" && c.key !== "actions" && (
              <span style={{opacity:.5,display:"inline-flex"}}><window.I.sort/></span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ───────── Context column renderer ─────────
function ContextCell({ row, modality }) {
  const muted = "var(--fg-muted)";
  if (modality.rowContext === "best-child" && row.kind === "assembly" && row.bestChild) {
    const b = row.bestChild;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
        <div style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.name}</div>
        <div style={{fontSize:11,color:muted,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:"var(--font-mono)",color:"var(--status-pass-fg)",fontWeight:500}}>{b.pct}% match</span>
          <span>·</span>
          <span>+ {row.matchedChildCount - 1} more</span>
        </div>
      </div>
    );
  }
  if (modality.rowContext === "structure" && row.kind === "assembly") {
    const matched = row.matchedChildCount;
    const total = row.totalChildCount;
    const pct = Math.round((matched / total) * 100);
    const allMatch = matched === total;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:0}}>
        <div style={{fontSize:12,color:"var(--fg-primary)",display:"flex",alignItems:"baseline",gap:6}}>
          <span style={{fontFamily:"var(--font-mono)",fontWeight:500,fontSize:13}}>{matched}<span style={{color:"var(--fg-muted)",fontWeight:400}}> of </span>{total}</span>
          <span style={{fontSize:11,color:"var(--fg-muted)"}}>parts matched</span>
          {allMatch && <span style={{fontSize:10,color:"var(--status-pass-fg)",fontFamily:"var(--font-sans)",fontWeight:500}}>all</span>}
        </div>
        <div style={{height:4,background:"var(--border-default)",borderRadius:99,overflow:"hidden",maxWidth:180}}>
          <div style={{height:"100%",width:`${pct}%`,background: allMatch ? "var(--status-pass-fg)" : "var(--accent)"}}/>
        </div>
      </div>
    );
  }
  if (modality.rowContext === "parent-assembly" && row.parentAssembly) {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
        <div style={{fontSize:12,color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:4}}>
          <window.I.modAsm/>
          <span style={{fontFamily:"var(--font-mono)",fontSize:11}}>{row.parentAssembly.name}</span>
        </div>
        <div style={{fontSize:11,color:muted}}>{row.parentAssembly.program}</div>
      </div>
    );
  }
  if (modality.rowContext === "part-search" && row.kind === "geometry") {
    // Collapsed mode — one row per unique geometry. Show assembly-usage summary.
    const previewList = row.usedIn.slice(0, 2)
      .map(u => u.asmFile.replace(/\.CATProduct$/i, ""))
      .join(", ");
    const more = row.usedIn.length - 2;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:0}}>
        <div style={{fontSize:12,color:"var(--fg-primary)",display:"flex",alignItems:"baseline",gap:6,whiteSpace:"nowrap"}}>
          <span style={{fontFamily:"var(--font-mono)",fontWeight:500,fontSize:13}}>{row.assemblyCount}</span>
          <span style={{fontSize:11,color:muted}}>{row.assemblyCount === 1 ? "assembly" : "assemblies"}</span>
          <span style={{fontSize:11,color:muted}}>·</span>
          <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--fg-primary)"}}>{row.totalInstances}</span>
          <span style={{fontSize:11,color:muted}}>{row.totalInstances === 1 ? "instance" : "instances"}</span>
        </div>
        <div style={{fontSize:11,color:muted,fontFamily:"var(--font-mono)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {previewList}{more > 0 && <span style={{color:"var(--accent)"}}>{" · +" + more + " more"}</span>}
        </div>
      </div>
    );
  }
  if (modality.rowContext === "part-search" && row.kind === "part-instance" && row.assemblyRef) {
    const a = row.assemblyRef;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
        <div style={{fontSize:12,color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:5}}>
          <span style={{color:"var(--fg-muted)",display:"inline-flex",flexShrink:0}}><window.I.modAsm/></span>
          <span style={{fontFamily:"var(--font-mono)",fontSize:11}}>{a.asmFile}</span>
        </div>
        <div style={{fontSize:11,color:muted,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          <span>{a.asmProgram}</span>
          {a.instances > 1 && (
            <React.Fragment>
              <span aria-hidden="true">·</span>
              <span style={{fontFamily:"var(--font-mono)",color:"var(--accent)"}}>×{a.instances} instances</span>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
  if (modality.rowContext === "category") {
    return (
      <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
        <window.Pill bg="var(--bg-subtle)" fg="var(--fg-secondary)" border="1px solid var(--border-default)">
          {row.category || "—"}
        </window.Pill>
        {row.massKg && (
          <span style={{fontSize:11,color:muted,fontFamily:"var(--font-mono)"}}>{row.massKg} kg</span>
        )}
      </div>
    );
  }
  return <span style={{color:muted,fontSize:12}}>—</span>;
}

// ───────── Lineage / duplicate side-info pills under file name ─────────
function FileNameCell({ row, modality, open, setOpen, dens }) {
  const d = dens || { name: 13, meta: 11 };
  const lineageActive = row.lineage && row.lineage.priorCount > 0;
  const dupActive = row._dupCount && row._dupCount > 1;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
      <button onClick={() => setOpen(!open)}
        style={{width:18,height:18,border:"none",background:"transparent",borderRadius:4,cursor:"pointer",color:"var(--fg-muted)",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <window.I.chevron open={open} size={14}/>
      </button>
      <div style={{minWidth:0,flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
          <span style={{
            fontSize:d.name,fontWeight:500,color:"var(--fg-primary)",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
            fontFamily:"var(--font-mono)",
          }}>{row.file}</span>
          <window.KindBadge kind={row.kind} childCount={row.kind === "assembly" ? row.childCount : null}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,fontSize:d.meta,color:"var(--fg-muted)",fontFamily:"var(--font-mono)",flexWrap:"wrap",lineHeight:1.2}}>
          <span>ID: {row.objectId}</span>
          <span aria-hidden="true">·</span>
          <span>Rev {row.revision}</span>
          {lineageActive && (
            <React.Fragment>
              <span aria-hidden="true">·</span>
              <span style={{color:"var(--accent)",cursor:"pointer"}}>{row.lineage.priorCount} prior version{row.lineage.priorCount === 1 ? "" : "s"} →</span>
            </React.Fragment>
          )}
          {dupActive && (
            <React.Fragment>
              <span aria-hidden="true">·</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"1px 6px",borderRadius:99,background:"var(--accent-tint)",color:"var(--accent)",fontFamily:"var(--font-sans)",fontWeight:500,border:"1px solid var(--accent)",fontSize:10}}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="14" height="14" rx="2"/><path d="M14 4H4v14"/></svg>
                ×{row._dupCount} duplicates
              </span>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────── Expanded panel (per modality) ─────────
function ExpandedPanel({ row, modality, expandedTabHint, padLeft = 116 }) {
  return (
    <div style={{
      gridColumn:"1 / -1",
      background:"var(--bg-page)",
      borderTop:"1px solid var(--border-default)",
      padding:`16px 24px 20px ${padLeft}px`,
    }}>
      <ExpandedTabs row={row} modality={modality} expandedTabHint={expandedTabHint}/>
    </div>
  );
}

function ExpandedTabs({ row, modality, expandedTabHint, variant }) {
  const drawer = variant === "drawer";
  // Tabs vary based on modality + row data
  const tabs = [];
  // PLM Data first if assembly or part with rich metadata
  tabs.push({ id: "plm", label: "PLM Data" });
  if (modality.rowContext === "best-child" || modality.rowContext === "structure") {
    tabs.push({ id: "parts", label: `Contained Parts (${row.totalChildCount})` });
  }
  if (modality.rowContext === "part-search" && row.kind === "geometry") {
    tabs.push({ id: "asmused", label: `Assemblies (${row.assemblyCount})` });
  }
  if (modality.rowContext === "part-search" && row.kind === "part-instance") {
    tabs.push({ id: "asminstance", label: "In Assembly" });
  }
  if (modality.rowContext === "parent-assembly") {
    tabs.push({ id: "siblings", label: "Sibling Parts" });
  }
  tabs.push({ id: "info", label: "File Info" });
  tabs.push({ id: "reqs", label: "Search Requirements" });
  if (row._dupCount && row._dupCount > 1) {
    tabs.push({ id: "dupes", label: `Duplicates (${row._dupCount})` });
  }
  if (row.lineage && row.lineage.priorCount > 0) {
    tabs.push({ id: "revs", label: `Related Revisions (${row.lineage.priorCount})` });
  }

  // Allow callers to deep-link a tab via the expandedTabHint prop (per-row id).
  const hint = expandedTabHint && expandedTabHint[row.id];
  const initial = hint && tabs.find(t => t.id === hint) ? hint : tabs[0].id;
  const [active, setActive] = tUseState(initial);
  // Re-default if modality changes and active tab no longer exists
  tUseMemo(() => {
    if (!tabs.find(t => t.id === active)) setActive(tabs[0].id);
  }, [modality.id]);

  return (
    <div>
      <div style={{display:"flex",gap:4,borderBottom:"1px solid var(--border-default)",marginBottom:14}}>
        {tabs.map(t => {
          const sel = t.id === active;
          return (
            <button key={t.id} onClick={()=>setActive(t.id)}
              style={{
                padding:"8px 12px",border:"none",background:"transparent",cursor:"pointer",
                fontSize:13,fontWeight: sel ? 500 : 400,
                color: sel ? "var(--accent)" : "var(--fg-secondary)",
                borderBottom: sel ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom:-1,fontFamily:"var(--font-sans)",
              }}>{t.label}</button>
          );
        })}
      </div>
      {active === "plm"      && <PLMPanel row={row} cols={drawer ? 2 : 4}/>}
      {active === "parts"    && <Scrollable on={drawer}><PartsPanel row={row} modality={modality}/></Scrollable>}
      {active === "asmused"  && <Scrollable on={drawer}><AssembliesUsedPanel row={row}/></Scrollable>}
      {active === "asminstance" && <AssemblyInstancePanel row={row} cols={drawer ? 2 : 3}/>}
      {active === "siblings" && <SiblingsPanel row={row}/>}
      {active === "info"     && <FileInfoPanel row={row} cols={drawer ? 2 : 3}/>}
      {active === "reqs"     && <ReqsPanel row={row}/>}
      {active === "dupes"    && <Scrollable on={drawer}><DupesPanel row={row}/></Scrollable>}
      {active === "revs"     && <Scrollable on={drawer}><RevsPanel row={row}/></Scrollable>}
    </div>
  );
}

// ───────── Panel: PLM Data ─────────
// Wraps wide table-style panels so they can scroll horizontally inside the narrow detail drawer.
function Scrollable({ on, children }) {
  if (!on) return children;
  return <div style={{overflowX:"auto",margin:"0 -4px",padding:"0 4px"}}>{children}</div>;
}

function PLMPanel({ row, cols = 4 }) {
  const fields = [
    ["ID", row.objectId],
    ["Revision", row.revision],
    ["Object Name", row.objectName],
    ["Object Type", row.objectType],
    ["Program", row.program || "—"],
    ["Release Status", row.releaseStatus || "—"],
    ["OEM Name", row.oem || "—"],
    ["Platform", row.platform || "—"],
    ["Production Facility", row.facility || "—"],
    ["Source", row.source],
    ["Created", row.created],
    ["Edited", row.edited],
    ["Material", row.material || "—"],
    ["Mass", row.massKg ? `${row.massKg} kg` : "—"],
    ["Category", row.category || "—"],
    ["Lineage ID", row.lineage?.lineageId || "—"],
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:"14px 28px"}}>
      {fields.map(([k, v]) => (
        <div key={k}>
          <div style={{fontSize:11,color:"var(--fg-muted)",fontStyle:"italic",marginBottom:2}}>{k}</div>
          <div style={{fontSize:13,color:"var(--fg-primary)",wordBreak:"break-word"}}>{v}</div>
        </div>
      ))}
    </div>
  );
}

// ───────── Panel: Contained Parts (mode B + C) ─────────
function PartsPanel({ row, modality }) {
  const children = row.children || [];
  const matchedFirst = [...children].sort((a, b) => (b.matched - a.matched) || (b.pct - a.pct));
  return (
    <div>
      <div style={{fontSize:12,color:"var(--fg-secondary)",marginBottom:10}}>
        {modality.rowContext === "best-child"
          ? <>Showing all <b style={{color:"var(--fg-primary)"}}>{row.totalChildCount}</b> parts inside this assembly. <b style={{color:"var(--status-pass-fg)"}}>{row.matchedChildCount}</b> match your uploaded part.</>
          : <>Part-by-part match against your reference assembly. <b style={{color:"var(--status-pass-fg)"}}>{row.matchedChildCount}/{row.totalChildCount}</b> parts passed.</>
        }
      </div>
      <div style={{border:"1px solid var(--border-default)",borderRadius:5,background:"var(--bg-card)",overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"24px 2fr 1fr 1fr 130px",padding:"8px 14px",background:"var(--bg-subtle)",borderBottom:"1px solid var(--border-default)",fontSize:11,color:"var(--fg-muted)",textTransform:"uppercase",letterSpacing:"0.4px",gap:8,alignItems:"center"}}>
          <span></span>
          <span>Part Name</span>
          <span>Category</span>
          <span>Match %</span>
          <span>Status</span>
        </div>
        {matchedFirst.map(c => (
          <div key={c.id} style={{
            display:"grid",gridTemplateColumns:"24px 2fr 1fr 1fr 130px",padding:"8px 14px",
            borderBottom:"1px solid var(--border-default)",gap:8,alignItems:"center",
            background: c.matched ? "var(--accent-tint)" : "transparent",
          }}>
            <span style={{
              width:14,height:14,borderRadius:99,
              background: c.matched ? "var(--status-pass-fg)" : "transparent",
              border: c.matched ? "none" : "1.5px solid var(--border-strong)",
              display:"inline-flex",alignItems:"center",justifyContent:"center",
            }}>
              {c.matched && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
            </span>
            <span style={{fontSize:12,fontFamily:"var(--font-mono)",color:"var(--fg-primary)"}}>{c.name}</span>
            <span style={{fontSize:12,color:"var(--fg-secondary)"}}>{c.category}</span>
            <span style={{fontSize:12,fontFamily:"var(--font-mono)",color:"var(--fg-primary)",fontWeight:500}}>{c.pct}%</span>
            <window.LevelBadge level={c.level}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────── Panel: Sibling Parts (mode D) ─────────
function SiblingsPanel({ row }) {
  return (
    <div>
      <div style={{fontSize:12,color:"var(--fg-secondary)",marginBottom:10}}>
        Other parts inside <b style={{color:"var(--fg-primary)"}}>{row.parentAssembly?.name}</b> — shown for context only.
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {window.SEAT_PARTS.slice(0, 8).map((p, i) => (
          <span key={i} style={{
            display:"inline-flex",alignItems:"center",gap:6,
            padding:"4px 10px",borderRadius:5,
            background:"var(--bg-card)",border:"1px solid var(--border-default)",
            fontSize:11,fontFamily:"var(--font-mono)",color:"var(--fg-secondary)",
          }}>{p.name}</span>
        ))}
        <span style={{fontSize:11,color:"var(--fg-muted)",padding:"4px 10px"}}>+ {row.parentAssembly ? "more" : "—"}</span>
      </div>
    </div>
  );
}

// ───────── Panel: Assemblies that use this geometry (mode B · collapsed) ─────────
// Mirrors the Related Revisions table layout. Columns:
//   Assembly File · Part Match (BOM name) · # Instances · Last Edited · Actions
function AssembliesUsedPanel({ row }) {
  const list = row.usedIn || [];
  const grid = "minmax(280px, 2.4fr) minmax(160px, 1.3fr) 90px 130px 90px";
  return (
    <div>
      <div style={{fontSize:12,color:"var(--fg-secondary)",marginBottom:10,lineHeight:1.5}}>
        This geometry appears in <b style={{color:"var(--fg-primary)"}}>{row.assemblyCount}</b> assembly file{row.assemblyCount === 1 ? "" : "s"}, with <b style={{color:"var(--fg-primary)"}}>{row.totalInstances}</b> total instance{row.totalInstances === 1 ? "" : "s"}. Some BOMs place the part multiple times (LH/RH symmetric, multi-row seating).
      </div>
      <div style={{border:"1px solid var(--border-default)",borderRadius:5,background:"var(--bg-card)",overflow:"hidden"}}>
        <div style={{
          display:"grid",gridTemplateColumns:grid,
          padding:"8px 14px",background:"var(--bg-subtle)",
          borderBottom:"1px solid var(--border-default)",
          gap:12,alignItems:"center",
          fontSize:11,color:"var(--fg-muted)",fontStyle:"italic",
        }}>
          <span>Assembly File</span>
          <span>Part Match (BOM name)</span>
          <span>Instances</span>
          <span>Last Edited</span>
          <span style={{textAlign:"right"}}>Actions</span>
        </div>
        {list.map((u, i) => (
          <div key={u.asmId} style={{
            display:"grid",gridTemplateColumns:grid,padding:"10px 14px",
            borderBottom: i < list.length-1 ? "1px solid var(--border-default)" : "none",
            gap:12,alignItems:"center",
          }}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontFamily:"var(--font-mono)",color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.asmFile}</div>
              <div style={{fontSize:11,color:"var(--fg-muted)",marginTop:1}}>{u.asmProgram}</div>
            </div>
            <span style={{fontSize:12,fontFamily:"var(--font-mono)",color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.partInstance}</span>
            <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:"var(--fg-secondary)"}}>
              <span style={{fontFamily:"var(--font-mono)",fontWeight:500,color:"var(--fg-primary)"}}>×{u.instances}</span>
              {u.instances > 1 && <span style={{fontSize:10,color:"var(--fg-muted)"}}>placed</span>}
            </span>
            <span style={{fontSize:12,color:"var(--fg-secondary)",fontFamily:"var(--font-mono)"}}>{u.edited}</span>
            <div style={{display:"flex",justifyContent:"flex-end",gap:2}}>
              <window.IconBtn label="Search on this assembly"><window.I.search size={14}/></window.IconBtn>
              <window.IconBtn label="Compare in 3D viewer"><window.I.compare/></window.IconBtn>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop:10,padding:"8px 12px",fontSize:11,color:"var(--fg-muted)",
        background:"var(--bg-subtle)",border:"1px solid var(--border-default)",borderRadius:5,
        lineHeight:1.5,
      }}>
        <b style={{color:"var(--fg-secondary)",fontWeight:500}}>Part Match</b> is the part’s name as referenced in each assembly’s BOM. The same geometry can carry different instance names depending on the program (e.g. <span style={{fontFamily:"var(--font-mono)"}}>BACK_FRAME_OUTER_LH</span> vs <span style={{fontFamily:"var(--font-mono)"}}>FB_Outer_Adapted</span>).
      </div>
    </div>
  );
}

// ───────── Panel: this specific (part × assembly) instance (mode B · exploded) ─────────
function AssemblyInstancePanel({ row, cols = 3 }) {
  const a = row.assemblyRef;
  if (!a) return null;
  const fields = [
    ["Assembly file", a.asmFile, true],
    ["Program", a.asmProgram, false],
    ["Part match (BOM name)", a.partInstance, true],
    ["Instances in this BOM", `×${a.instances}`, true],
    ["Assembly last edited", a.edited, true],
    ["Vault", a.source || row.source, false],
  ];
  return (
    <div>
      <div style={{fontSize:12,color:"var(--fg-secondary)",marginBottom:12,lineHeight:1.5}}>
        One placement of <b style={{color:"var(--fg-primary)",fontFamily:"var(--font-mono)"}}>{row.file}</b> inside this assembly. To see every assembly this geometry appears in, turn on <b style={{color:"var(--accent)"}}>Collapse duplicates</b> in the Columns tab.
      </div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:"14px 28px",marginBottom:14}}>
        {fields.map(([k, v, mono]) => (
          <div key={k}>
            <div style={{fontSize:11,color:"var(--fg-muted)",fontStyle:"italic",marginBottom:2}}>{k}</div>
            <div style={{fontSize:13,color:"var(--fg-primary)",fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",wordBreak:"break-word"}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button style={{
          padding:"7px 12px",borderRadius:5,border:"1px solid var(--border-default)",
          background:"var(--bg-card)",color:"var(--fg-primary)",fontSize:12,fontWeight:500,cursor:"pointer",
          display:"inline-flex",alignItems:"center",gap:6,fontFamily:"var(--font-sans)",
        }}><window.I.search size={13}/> Search on this assembly</button>
        <button style={{
          padding:"7px 12px",borderRadius:5,border:"1px solid var(--border-default)",
          background:"var(--bg-card)",color:"var(--fg-primary)",fontSize:12,fontWeight:500,cursor:"pointer",
          display:"inline-flex",alignItems:"center",gap:6,fontFamily:"var(--font-sans)",
        }}><window.I.compare/> Compare in 3D viewer</button>
        <button style={{
          padding:"7px 12px",borderRadius:5,border:"1px solid var(--border-default)",
          background:"var(--bg-card)",color:"var(--fg-secondary)",fontSize:12,cursor:"pointer",
          display:"inline-flex",alignItems:"center",gap:6,fontFamily:"var(--font-sans)",
        }}><window.I.modAsm/> Open assembly</button>
      </div>
    </div>
  );
}

// ───────── Panel: File Info ─────────
function FileInfoPanel({ row, cols = 3 }) {
  const items = [
    ["File name", row.file],
    ["File size", "—"],
    ["File format", row.file.split(".").pop()],
    ["Source vault", row.source],
    ["First seen", row.created],
    ["Last modified", row.edited],
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:"14px 28px"}}>
      {items.map(([k, v]) => (
        <div key={k}>
          <div style={{fontSize:11,color:"var(--fg-muted)",fontStyle:"italic",marginBottom:2}}>{k}</div>
          <div style={{fontSize:13,color:"var(--fg-primary)",fontFamily: k === "File name" ? "var(--font-mono)" : "var(--font-sans)"}}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function ReqsPanel({ row }) {
  return (
    <div style={{fontSize:12,color:"var(--fg-secondary)",lineHeight:1.6}}>
      Your search requirements were applied to this row. Click <b>Compare</b> to see field-by-field deltas.
    </div>
  );
}

// ───────── Panel: Duplicates ─────────
function DupesPanel({ row }) {
  const all = [row, ...(row._dupOthers || [])];
  return (
    <div>
      <div style={{fontSize:12,color:"var(--fg-secondary)",marginBottom:10}}>
        Identical geometry detected across <b style={{color:"var(--fg-primary)"}}>{row._dupCount}</b> files. Hash and bounding box match exactly.
      </div>
      <div style={{border:"1px solid var(--border-default)",borderRadius:5,background:"var(--bg-card)"}}>
        {all.map((d, i) => (
          <div key={d.id} style={{
            display:"grid",gridTemplateColumns:"24px 2fr 1fr 1fr 100px",padding:"8px 14px",gap:8,alignItems:"center",
            borderBottom: i < all.length-1 ? "1px solid var(--border-default)" : "none",
          }}>
            <window.PreviewThumb src={d.preview} size={24}/>
            <span style={{fontSize:12,fontFamily:"var(--font-mono)",color:"var(--fg-primary)"}}>{d.file}</span>
            <window.SourcePill name={d.source}/>
            <span style={{fontSize:12,color:"var(--fg-secondary)",fontFamily:"var(--font-mono)"}}>{d.created}</span>
            {i === 0
              ? <window.Pill bg="var(--status-pass-bg)" fg="var(--status-pass-fg)">Primary</window.Pill>
              : <window.Pill bg="var(--bg-subtle)" fg="var(--fg-muted)">Duplicate</window.Pill>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────── Panel: Related Revisions ─────────
// Tabular layout (matches the pilot environment screenshot the user referenced).
// Columns: File Name · Relationship · Revision · Last Edited · Actions
function RevsPanel({ row }) {
  const revs = buildRelatedRevisions(row);
  const grid = "minmax(280px, 2.2fr) 180px 90px 130px 90px";
  return (
    <div>
      <div style={{fontSize:12,color:"var(--fg-secondary)",marginBottom:10,lineHeight:1.5}}>
        Lineage <span style={{fontFamily:"var(--font-mono)",color:"var(--fg-primary)"}}>{row.lineage.lineageId}</span> — {revs.length} related revision{revs.length === 1 ? "" : "s"} across preceding versions and branches.
      </div>
      <div style={{border:"1px solid var(--border-default)",borderRadius:5,background:"var(--bg-card)",overflow:"hidden"}}>
        {/* header row */}
        <div style={{
          display:"grid",gridTemplateColumns:grid,
          padding:"8px 14px",background:"var(--bg-subtle)",
          borderBottom:"1px solid var(--border-default)",
          gap:12,alignItems:"center",
          fontSize:11,color:"var(--fg-muted)",fontStyle:"italic",
        }}>
          <span>File Name</span>
          <span>Relationship</span>
          <span>Revision</span>
          <span>Last Edited</span>
          <span style={{textAlign:"right"}}>Actions</span>
        </div>
        {revs.map((rev, i) => (
          <div key={rev.id} style={{
            display:"grid",gridTemplateColumns:grid,padding:"10px 14px",
            borderBottom: i < revs.length-1 ? "1px solid var(--border-default)" : "none",
            gap:12,alignItems:"center",
            background: rev.relationship === "current" ? "var(--accent-tint)" : "transparent",
          }}>
            <span style={{fontSize:12,fontFamily:"var(--font-mono)",color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{rev.file}</span>
            <RelationshipPill kind={rev.relationship}/>
            <span style={{fontSize:13,fontFamily:"var(--font-mono)",color:"var(--fg-primary)",fontWeight:500}}>{rev.rev}</span>
            <span style={{fontSize:12,color:"var(--fg-secondary)",fontFamily:"var(--font-mono)"}}>{rev.date}</span>
            <div style={{display:"flex",justifyContent:"flex-end",gap:2}}>
              <window.IconBtn label="Run search on this revision"><window.I.search size={14}/></window.IconBtn>
              <window.IconBtn label="Open in 3D Compare viewer"><window.I.compare/></window.IconBtn>
            </div>
          </div>
        ))}
      </div>
      <RelationshipLegend/>
    </div>
  );
}

function RelationshipPill({ kind }) {
  const map = {
    "current":    { label: "Current",         bg: "var(--status-pass-bg)", fg: "var(--status-pass-fg)" },
    "previous":   { label: "Previous",        bg: "var(--status-warn-bg)", fg: "var(--status-warn-fg)" },
    "older":      { label: "Older revision",  bg: "var(--bg-subtle)",      fg: "var(--fg-muted)" },
    "branch":     { label: "Branch",          bg: "var(--status-info-bg)", fg: "var(--status-info-fg)" },
    "branch-tip": { label: "Branch tip",      bg: "var(--accent-tint)",    fg: "var(--accent)" },
  };
  const c = map[kind] || map.older;
  return <window.Pill bg={c.bg} fg={c.fg}>{c.label}</window.Pill>;
}

function RelationshipLegend() {
  const rows = [
    ["Current",     "Active row — the revision you're inspecting."],
    ["Previous",    "Immediate predecessor (e.g. AB before AC)."],
    ["Older revision", "Earlier predecessor in the same direct line."],
    ["Branch",      "Shares lineage; sits on a different branch (e.g. BA off the A line)."],
    ["Branch tip",  "Most current revision in a branched lineage."],
  ];
  return (
    <div style={{marginTop:10,padding:"10px 14px",background:"var(--bg-subtle)",borderRadius:5,border:"1px solid var(--border-default)"}}>
      <div style={{fontSize:11,color:"var(--fg-muted)",textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:500,marginBottom:6}}>Relationship key</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"4px 24px"}}>
        {rows.map(([k, v]) => (
          <div key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:"var(--fg-secondary)"}}>
            <span style={{flexShrink:0}}><RelationshipPill kind={pillKey(k)}/></span>
            <span style={{minWidth:0}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function pillKey(label) {
  return ({
    "Current":"current","Previous":"previous","Older revision":"older","Branch":"branch","Branch tip":"branch-tip",
  })[label];
}

// Build a related-revisions list off of the row's revision string + priorCount.
// Includes preceding revisions in the same line, plus a branch (B-series) if the row is on the A-line.
function buildRelatedRevisions(row) {
  const cur = row.revision;                // e.g. "AC"
  const baseFile = row.file;
  const priorCount = row.lineage.priorCount;
  const dates = ["May 11, 2026","Mar 28, 2026","Feb 04, 2026","Dec 12, 2025","Oct 18, 2025","Aug 02, 2025","May 14, 2025","Mar 03, 2025","Jan 19, 2025"];
  const out = [];
  // Current row first (shown highlighted)
  out.push({ id: `cur-${cur}`, rev: cur, file: baseFile, relationship: "current", date: row.edited });
  // Walk back through preceding revisions on the same line
  let prev = prevRev(cur);
  for (let i = 0; i < priorCount && prev; i++) {
    out.push({
      id: `prev-${prev}-${i}`,
      rev: prev,
      file: swapRev(baseFile, cur, prev),
      relationship: i === 0 ? "previous" : "older",
      date: dates[i + 1] || "—",
    });
    const next = prevRev(prev);
    if (next === prev) break;
    prev = next;
  }
  // If we're on the A-line (revision starts with "A") and there's history, surface a B-branch lineage:
  // branch tip (BA) + one older branch revision sometimes.
  if (cur[0] === "A" && cur.length === 2 && priorCount >= 2) {
    out.push({
      id: "branch-tip-BA",
      rev: "BA",
      file: swapRev(baseFile, cur, "BA"),
      relationship: "branch-tip",
      date: "Apr 22, 2026",
    });
    out.push({
      id: "branch-AB",
      rev: "AB",
      file: swapRev(baseFile, cur, "AB") + ".branch",
      relationship: "branch",
      date: "Feb 28, 2026",
    });
  }
  // For BA-line rows, surface the parent A-line's tip as a branch reference
  if (cur[0] === "B" && cur.length === 2) {
    out.push({
      id: "branch-AC",
      rev: "AC",
      file: swapRev(baseFile, cur, "AC"),
      relationship: "branch-tip",
      date: "Mar 28, 2026",
    });
  }
  return out;
}

function swapRev(filename, from, to) {
  // Try to swap `_FROM_` pattern first (common in PLM filenames like 6644321_AA_…)
  const tagged = `_${from}_`;
  if (filename.includes(tagged)) return filename.replace(tagged, `_${to}_`);
  // Fallback: append rev tag before extension
  return filename.replace(/(\.[^.]+)$/, `_${to}$1`);
}
function prevRev(s) {
  // Convert string to Excel-style base-26 number (A=1) and decrement.
  let n = 0;
  for (const ch of s) n = n * 26 + (ch.charCodeAt(0) - 64);
  n = Math.max(1, n - 1);
  let out = "";
  while (n > 0) { const r = (n - 1) % 26; out = String.fromCharCode(65 + r) + out; n = Math.floor((n - 1) / 26); }
  return out;
}

// ───────── Row density presets ─────────
// compact / default / comfy share the list layout; only padding, thumbnail
// size and the file-name type scale change. `thumbnail` is a separate gallery view.
const DENSITY = {
  compact: { pad: "6px 16px",  thumb: 32, name: 12,   meta: 10.5 },
  default: { pad: "12px 16px", thumb: 48, name: 13,   meta: 11 },
  comfy:   { pad: "20px 16px", thumb: 76, name: 14,   meta: 12 },
};

// ───────── Row ─────────
function Row({ row, modality, openByDefault, expandedTabHint, density = "default" }) {
  const d = DENSITY[density] || DENSITY.default;
  const [open, setOpen] = tUseState(!!openByDefault);
  return (
    <div style={{borderBottom:"1px solid var(--border-default)", background: open ? "var(--bg-page)" : "var(--bg-card)"}}>
      <div style={{
        display:"grid",gridTemplateColumns:gridTemplate(),
        padding:d.pad,
        alignItems:"center",
        cursor:"pointer",
        transition:"padding .15s ease",
      }}
        onMouseEnter={e=>{ if (!open) e.currentTarget.style.background="var(--fill-hover)"; }}
        onMouseLeave={e=>{ if (!open) e.currentTarget.style.background=""; }}
        onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",justifyContent:"center"}}>
          <window.PreviewThumb src={row.preview} size={d.thumb}
            badge={row._dupCount && row._dupCount > 1 ? `×${row._dupCount}` : null}/>
        </div>
        <FileNameCell row={row} modality={modality} open={open} setOpen={setOpen} dens={d}/>
        <div onClick={e=>e.stopPropagation()}><ContextCell row={row} modality={modality}/></div>
        <div><window.SourcePill name={row.source}/></div>
        <div style={{fontSize:12,color:"var(--fg-secondary)",fontFamily:"var(--font-mono)"}}>{row.created}</div>
        <div style={{fontSize:12,color:"var(--fg-secondary)",fontFamily:"var(--font-mono)"}}>{row.edited}</div>
        <div><window.RelevanceBar pct={row.relevancePct} level={row.level}/></div>
        <div onClick={e=>e.stopPropagation()}><window.RowActions/></div>
      </div>
      {open && <ExpandedPanel row={row} modality={modality} expandedTabHint={expandedTabHint} padLeft={d.thumb + 68}/>}
    </div>
  );
}

// ═════════════ THUMBNAIL (gallery) VIEW ═════════════
// Finder-style icon grid. Clicking a card opens a right detail drawer that
// carries the exact same tabs / info as the list view's expanded row.
function ThumbCard({ row, selected, onClick }) {
  const l = window.RELEVANCE.find(x => x.key === row.level);
  return (
    <button onClick={onClick}
      style={{
        textAlign:"left",cursor:"pointer",padding:0,
        background: selected ? "var(--accent-tint)" : "var(--bg-card)",
        border: selected ? "2px solid var(--accent)" : "1px solid var(--border-default)",
        borderRadius:5,overflow:"hidden",
        display:"flex",flexDirection:"column",
        fontFamily:"var(--font-sans)",color:"var(--fg-primary)",
        transition:"border-color .12s ease, background .12s ease",
      }}
      onMouseEnter={e=>{ if (!selected) e.currentTarget.style.borderColor="var(--border-strong)"; }}
      onMouseLeave={e=>{ if (!selected) e.currentTarget.style.borderColor="var(--border-default)"; }}>
      {/* thumbnail */}
      <div style={{position:"relative",width:"100%",aspectRatio:"4 / 3",background:"var(--bg-subtle)",borderBottom:"1px solid var(--border-default)"}}>
        <img src={row.preview} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <span style={{
          position:"absolute",top:8,left:8,
          fontSize:11,fontWeight:500,padding:"2px 7px",borderRadius:5,
          background:l.bg,color:l.color,
          fontFamily:"var(--font-mono)",
        }}>{row.relevancePct}%</span>
        {row._dupCount && row._dupCount > 1 && (
          <span style={{
            position:"absolute",top:8,right:8,
            display:"inline-flex",alignItems:"center",gap:3,
            fontSize:10,fontWeight:500,padding:"2px 6px",borderRadius:99,
            background:"var(--accent)",color:"#fff",fontFamily:"var(--font-mono)",
          }}>×{row._dupCount}</span>
        )}
      </div>
      {/* caption */}
      <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
          <span style={{fontSize:12,fontFamily:"var(--font-mono)",fontWeight:500,color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{row.file}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10.5,color:"var(--fg-muted)",fontFamily:"var(--font-mono)"}}>
          <span>{row.objectId}</span>
          <span aria-hidden="true">·</span>
          <span>Rev {row.revision}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginTop:2}}>
          <window.SourcePill name={row.source}/>
          <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:l.bg,color:l.color,fontWeight:500,whiteSpace:"nowrap"}}>{l.label}</span>
        </div>
      </div>
    </button>
  );
}

function DetailDrawer({ row, modality, expandedTabHint, onClose }) {
  const l = window.RELEVANCE.find(x => x.key === row.level);
  return (
    <aside style={{
      width:440,flexShrink:0,height:"100%",
      borderLeft:"1px solid var(--border-default)",
      background:"var(--bg-card)",
      display:"flex",flexDirection:"column",overflow:"hidden",
    }}>
      {/* drawer header */}
      <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border-default)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
          <window.PreviewThumb src={row.preview} size={64}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
              <span style={{fontSize:13,fontWeight:500,fontFamily:"var(--font-mono)",color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{row.file}</span>
              <window.IconBtn label="Close" onClick={onClose}><window.I.x/></window.IconBtn>
            </div>
            <div style={{fontSize:12,color:"var(--fg-secondary)",marginTop:3,lineHeight:1.4}}>{row.objectName}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
              <window.KindBadge kind={row.kind}/>
              <span style={{fontSize:11,color:"var(--fg-muted)",fontFamily:"var(--font-mono)"}}>{row.objectId} · Rev {row.revision}</span>
            </div>
          </div>
        </div>
        <div style={{marginTop:12}}>
          <window.RelevanceBar pct={row.relevancePct} level={row.level}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button style={{flex:1,padding:"7px 12px",borderRadius:5,border:"1px solid var(--border-default)",background:"var(--bg-card)",color:"var(--fg-primary)",fontSize:12,fontWeight:500,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"var(--font-sans)"}}><window.I.compare/> Compare</button>
          <button style={{flex:1,padding:"7px 12px",borderRadius:5,border:"1px solid var(--border-default)",background:"var(--bg-card)",color:"var(--fg-primary)",fontSize:12,fontWeight:500,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"var(--font-sans)"}}><window.I.eye/> Preview</button>
        </div>
      </div>
      {/* drawer body: same tabs as the list view's expanded row */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        <ExpandedTabs key={row.id} row={row} modality={modality} expandedTabHint={expandedTabHint} variant="drawer"/>
      </div>
    </aside>
  );
}

function ResultsThumbnailView({ rows, modality, openIds = [], expandedTabHint }) {
  const [selId, setSelId] = tUseState(openIds[0] || (rows[0] && rows[0].id) || null);
  const sel = rows.find(r => r.id === selId) || null;
  return (
    <div style={{display:"flex",height:"100%",width:"100%",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
        {rows.length === 0 ? (
          <div style={{padding:"40px 16px",textAlign:"center",color:"var(--fg-muted)",fontSize:13}}>No matches with the current view settings.</div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(190px, 1fr))",gap:16,alignContent:"start"}}>
            {rows.map(r => (
              <ThumbCard key={r.id} row={r} selected={r.id === selId} onClick={()=>setSelId(r.id)}/>
            ))}
          </div>
        )}
      </div>
      {sel && <DetailDrawer row={sel} modality={modality} expandedTabHint={expandedTabHint} onClose={()=>setSelId(null)}/>}
    </div>
  );
}

// ───────── Table shell ─────────
function ResultsTable({ rows, modality, openIds = [], expandedTabHint, density = "default" }) {
  if (density === "thumbnail") {
    return <ResultsThumbnailView rows={rows} modality={modality} openIds={openIds} expandedTabHint={expandedTabHint}/>;
  }
  return (
    <div style={{background:"var(--bg-card)",border:"1px solid var(--border-default)",borderRadius:5,overflow:"hidden",margin:"0 24px 24px"}}>
      <HeaderRow modality={modality}/>
      {rows.map(r => (
        <Row key={r.id} row={r} modality={modality} openByDefault={openIds.includes(r.id)} expandedTabHint={expandedTabHint} density={density}/>
      ))}
      {rows.length === 0 && (
        <div style={{padding:"40px 16px",textAlign:"center",color:"var(--fg-muted)",fontSize:13}}>
          No matches with the current view settings.
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ResultsTable, ResultsThumbnailView });
