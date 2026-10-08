// screens.jsx — Homepage modality picker + Results screen + Variant-E-style sidebar
const { useState: sUseState, useEffect: sUseEffect, useRef: sUseRef } = React;

// ═════════════════════════════ HOMEPAGE ═════════════════════════════

const MOD_CARDS = [
  { id: "a", from: "a part", to: "matching parts",
    title: "Find similar parts",
    blurb: "Upload a part. Get back individual parts with similar geometry. No assemblies.",
    glyph: "modPart", tag: "Part → Part" },
  { id: "b", from: "a part", to: "assemblies containing it",
    title: "Find assemblies that use this part",
    blurb: "Upload a part. Get back assemblies that contain similar parts as a sub-component.",
    glyph: "modPartInAsm", tag: "Part → Assembly" },
  { id: "c", from: "an assembly", to: "similar assemblies",
    title: "Find similar assemblies",
    blurb: "Upload an assembly. Get back assemblies with similar structure and matching child parts.",
    glyph: "modAsm", tag: "Assembly → Assembly" },
  { id: "d", from: "a part in an assembly", to: "matching parts",
    title: "Pull matching parts out of assemblies",
    blurb: "Upload a part within an assembly. Get back the matching parts, tagged with their parent assembly.",
    glyph: "modPartFromAsm", tag: "Part-in-Assy → Part" },
];

function ModalityCard({ card, selected, onClick }) {
  const Glyph = window.I[card.glyph];
  return (
    <button onClick={onClick}
      style={{
        textAlign:"left",cursor:"pointer",
        background: selected ? "var(--accent-tint)" : "var(--bg-card)",
        border: selected ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
        borderRadius:5,padding:20,
        display:"flex",flexDirection:"column",gap:12,minHeight:200,
        transition:"all .15s ease",fontFamily:"var(--font-sans)",
        color:"var(--fg-primary)",
      }}
      onMouseEnter={e=>{ if (!selected) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
      onMouseLeave={e=>{ if (!selected) e.currentTarget.style.borderColor = "var(--border-default)"; }}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div style={{
          width:56,height:56,borderRadius:5,
          background: selected ? "var(--bg-card)" : "var(--bg-subtle)",
          border:"1px solid var(--border-default)",
          display:"flex",alignItems:"center",justifyContent:"center",
          color: selected ? "var(--accent)" : "var(--fg-secondary)",
        }}><Glyph/></div>
        <span style={{
          fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.5px",
          padding:"3px 8px",borderRadius:99,
          background: selected ? "var(--accent)" : "var(--bg-subtle)",
          color: selected ? "#fff" : "var(--fg-muted)",
          fontFamily:"var(--font-mono)",
        }}>{card.tag}</span>
      </div>
      <div style={{fontSize:15,fontWeight:500,lineHeight:1.3}}>{card.title}</div>
      <div style={{fontSize:12,color:"var(--fg-secondary)",lineHeight:1.5,flex:1}}>{card.blurb}</div>
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"8px 0 0",borderTop:"1px solid var(--border-default)",
        fontSize:11,color:"var(--fg-muted)",fontFamily:"var(--font-mono)",
      }}>
        <span>Upload {card.from}</span>
        <window.I.chevronR/>
        <span>{card.to}</span>
      </div>
    </button>
  );
}

function Homepage({ onPick }) {
  const [picked, setPicked] = sUseState(null);
  return (
    <div style={{background:"var(--bg-page)",minHeight:"100%",display:"flex",flexDirection:"column"}}>
      <window.TopNav/>
      <div style={{flex:1,overflow:"auto",padding:"40px 56px 56px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{marginBottom:32}}>
            <div style={{fontSize:11,color:"var(--accent)",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>New Search</div>
            <h1 style={{fontSize:32,fontWeight:500,margin:"0 0 8px",color:"var(--fg-primary)",lineHeight:1.2}}>What are you searching for?</h1>
            <p style={{fontSize:14,color:"var(--fg-secondary)",margin:0,lineHeight:1.5,maxWidth:600}}>
              Pick the modality that matches your input file and the kind of result you want.
              You can refine the view (collapse duplicates, latest-revision only) any time from the Columns tab.
            </p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:16,marginBottom:32}}>
            {MOD_CARDS.map(c => (
              <ModalityCard key={c.id} card={c} selected={picked === c.id} onClick={() => setPicked(c.id)}/>
            ))}
          </div>

          <div style={{
            border: picked ? "1.5px dashed var(--accent)" : "1.5px dashed var(--border-strong)",
            borderRadius:5,padding:24,background:"var(--bg-card)",
            display:"flex",alignItems:"center",gap:20,
          }}>
            <div style={{width:56,height:56,borderRadius:5,background:"var(--bg-subtle)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--fg-secondary)"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 21h14"/></svg>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:500,marginBottom:2}}>
                {picked ? "Upload your reference file" : "First, pick a modality above"}
              </div>
              <div style={{fontSize:12,color:"var(--fg-muted)"}}>
                {picked
                  ? `Drag a ${MOD_CARDS.find(c => c.id === picked).from} (.CATPart, .CATProduct, .STEP, .SolidWorks) — or paste a Teamcenter ID.`
                  : "We tailor the upload prompt and result view to the modality you choose."}
              </div>
            </div>
            <button onClick={() => picked && onPick(picked)} disabled={!picked}
              style={{
                padding:"10px 18px",borderRadius:5,
                background: picked ? "var(--btn-primary-bg)" : "var(--bg-subtle)",
                color: picked ? "var(--btn-primary-fg)" : "var(--fg-muted)",
                border:"none",fontSize:13,fontWeight:500,
                cursor: picked ? "pointer" : "not-allowed",fontFamily:"var(--font-sans)",
                display:"inline-flex",alignItems:"center",gap:6,
              }}>
              Browse files <window.I.chevronR/>
            </button>
          </div>

          <div style={{marginTop:40}}>
            <div style={{fontSize:11,color:"var(--fg-muted)",textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:10,fontWeight:500}}>Recent searches</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:12}}>
              {[
                { mod:"b", file:"FrameBack_Outer_v8.CATPart", count:53, date:"2h ago" },
                { mod:"c", file:"6644321_AA_COMPLETE_SEAT.CATProduct", count:18, date:"yesterday" },
                { mod:"d", file:"Recliner_Mech_LH_r4.CATPart", count:34, date:"3 days ago" },
              ].map((r, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:5,background:"var(--bg-card)",border:"1px solid var(--border-default)",cursor:"pointer"}}>
                  <span style={{width:28,height:28,borderRadius:5,background:"var(--bg-subtle)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--fg-secondary)"}}>
                    <window.ModalityIcon id={r.mod} size={20}/>
                  </span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontFamily:"var(--font-mono)",color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.file}</div>
                    <div style={{fontSize:11,color:"var(--fg-muted)"}}>{r.count} results · {r.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════ RESULTS SCREEN ═════════════════════════════

function ResultsScreen({
  modality, openSidebar = true, openRowIds = [],
  defaultTab = "columns",
  scopeOverride, flagsOverride, densityOverride,
  expandedTabHint,
}) {
  const [scope, setScope] = sUseState(scopeOverride ?? modality.scope);
  const [flags, setFlags] = sUseState({ ...(modality.flags || {}), ...(flagsOverride || {}) });
  const [density, setDensity] = sUseState(densityOverride ?? "default");
  const [sidebarOpen, setSidebarOpen] = sUseState(!!openSidebar);
  const [sidebarTab, setSidebarTab]   = sUseState(defaultTab);

  sUseEffect(() => { setScope(scopeOverride ?? modality.scope); }, [modality.id]);
  sUseEffect(() => { setFlags({ ...(modality.flags || {}), ...(flagsOverride || {}) }); }, [modality.id]);
  sUseEffect(() => { setDensity(densityOverride ?? "default"); }, [modality.id]);

  const rows = window.resolveRows({ scope, flags, mode: modality.id });

  return (
    <div style={{background:"var(--bg-page)",height:"100%",display:"flex",flexDirection:"column"}}>
      <window.TopNav/>
      <window.SubHeader
        crumbs={["Files", "Define Requirements", "Search Results"]}
        modality={modality}
        rightSlot={
          <button style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",border:"1px solid var(--border-default)",borderRadius:5,background:"var(--bg-card)",fontSize:13,color:"var(--fg-secondary)",cursor:"pointer"}}>
            <window.I.bookmark/> Save Search
          </button>
        }
      />
      <window.FilterStrip
        matchCount={rows.length} modality={modality}
        scope={scope} flags={flags}
        onOpenManage={() => { setSidebarOpen(true); setSidebarTab("columns"); }}
      />

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {sidebarOpen && (
          <FullSidebar
            tab={sidebarTab} setTab={setSidebarTab}
            modality={modality}
            scope={scope} setScope={setScope}
            flags={flags} setFlags={setFlags}
            density={density} setDensity={setDensity}
            onClose={() => setSidebarOpen(false)}
            resultCount={rows.length}
          />
        )}
        {density === "thumbnail" ? (
          <div style={{flex:1,overflow:"hidden",minWidth:0}}>
            <window.ResultsTable rows={rows} modality={modality} openIds={openRowIds} expandedTabHint={expandedTabHint} density={density}/>
          </div>
        ) : (
          <div style={{flex:1,overflow:"auto"}}>
            <window.ResultsTable rows={rows} modality={modality} openIds={openRowIds} expandedTabHint={expandedTabHint} density={density}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════ SIDEBAR (variant-E shape) ═════════════════════════════

function FullSidebar({ tab, setTab, modality, scope, setScope, flags, setFlags, density, setDensity, onClose, resultCount }) {
  return (
    <aside style={{
      width:300,flexShrink:0,
      background:"var(--bg-sidebar)",
      borderRight:"1px solid var(--border-default)",
      display:"flex",flexDirection:"column",overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{padding:"14px 16px 12px",borderBottom:"1px solid var(--border-default)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexShrink:0}}>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:"var(--fg-primary)"}}>Filters</div>
          <div style={{fontSize:11,color:"var(--fg-muted)",marginTop:2}}>
            {resultCount} of {window.PART_ROWS.length + window.ASSEMBLY_ROWS.length} files
          </div>
        </div>
        <button style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:"var(--accent)",padding:"3px 6px",fontFamily:"var(--font-sans)"}}>
          Clear all
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid var(--border-default)",padding:"0 12px",background:"var(--bg-sidebar)",flexShrink:0}}>
        {[
          ["filters", "Filters"],
          ["columns", "Columns"],
          ["manage",  "Manage"],
        ].map(([k, l]) => {
          const sel = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)}
              style={{
                padding:"10px 12px",border:"none",background:"transparent",cursor:"pointer",
                fontSize:13,fontWeight: sel ? 500 : 400,
                color: sel ? "var(--accent)" : "var(--fg-secondary)",
                borderBottom: sel ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom:-1,fontFamily:"var(--font-sans)",
              }}>{l}</button>
          );
        })}
      </div>

      <div style={{flex:1,overflowY:"auto"}}>
        {tab === "filters" && <FiltersTabPlaceholder/>}
        {tab === "columns" && <ColumnsTab scope={scope} setScope={setScope} flags={flags} setFlags={setFlags} density={density} setDensity={setDensity} modality={modality}/>}
        {tab === "manage"  && <ManageTabPlaceholder/>}
      </div>
    </aside>
  );
}

function FiltersTabPlaceholder() {
  return (
    <div style={{padding:"20px 16px",fontSize:12,color:"var(--fg-muted)",lineHeight:1.6}}>
      Standard column filters (File Source, Created, Overall Relevance, ranges) live here — see <b style={{color:"var(--fg-secondary)"}}>Filter Sidebar Variants</b>.
      <br/><br/>
      This prototype focuses on the <b style={{color:"var(--accent)"}}>Columns</b> tab to demo the view-mode toggles you flagged.
    </div>
  );
}

function ManageTabPlaceholder() {
  return (
    <div style={{padding:"20px 16px",fontSize:12,color:"var(--fg-muted)",lineHeight:1.6}}>
      Saved views, reset / save / export filter config, defaults (abs error, confidence bars).
    </div>
  );
}

// ═════════════════════════════ COLUMNS TAB ═════════════════════════════
// Mirrors variant-E layout: column list (drag + show/hide) → Add column →
// Row density → Result scope (Parts/Assemblies/Both) → View modes (multi-select)

const COL_LIST = [
  "File Name", "File Source", "Created", "Edited",
  "Overall Relevance", "Object ID", "Revision", "Object Name",
];
const HIDDEN_BY_DEFAULT = ["Object Name"];

function ColumnsTab({ scope, setScope, flags, setFlags, density, setDensity, modality }) {
  const [hidden, setHidden] = sUseState(HIDDEN_BY_DEFAULT);
  const [order, setOrder] = sUseState(COL_LIST);
  const dragIdx = sUseRef(null);
  const [adderOpen, setAdderOpen] = sUseState(false);

  return (
    <div style={{display:"flex",flexDirection:"column"}}>

      {/* Columns header */}
      <div style={{padding:"12px 14px 6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:"var(--fg-muted)",textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:500}}>Columns</span>
        <div style={{display:"flex",gap:8,fontSize:11}}>
          <button onClick={()=>setHidden([])}
            style={{background:"transparent",border:"none",padding:0,color:"var(--accent)",cursor:"pointer",fontFamily:"var(--font-sans)"}}>
            Show all
          </button>
          <span style={{color:"var(--border-strong)"}}>·</span>
          <button onClick={()=>setHidden(order)}
            style={{background:"transparent",border:"none",padding:0,color:"var(--fg-secondary)",cursor:"pointer",fontFamily:"var(--font-sans)"}}>
            Hide all
          </button>
        </div>
      </div>

      {order.map((name, i) => {
        const visible = !hidden.includes(name);
        return (
          <div key={name} draggable
            onDragStart={()=>{ dragIdx.current = i; }}
            onDragOver={e=>e.preventDefault()}
            onDrop={()=>{
              if (dragIdx.current == null || dragIdx.current === i) return;
              const next = [...order];
              const [m] = next.splice(dragIdx.current, 1);
              next.splice(i, 0, m);
              setOrder(next); dragIdx.current = null;
            }}
            style={{
              display:"flex",alignItems:"center",gap:8,
              padding:"6px 14px",cursor:"grab",
              opacity: visible ? 1 : .55,
              fontSize:12,
            }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--fill-hover)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{color:"var(--fg-muted)"}}>
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="2" cy="2" r="1"/><circle cx="8" cy="2" r="1"/><circle cx="2" cy="7" r="1"/><circle cx="8" cy="7" r="1"/><circle cx="2" cy="12" r="1"/><circle cx="8" cy="12" r="1"/></svg>
            </span>
            <span style={{flex:1,color:"var(--fg-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</span>
            <button onClick={()=>setHidden(h => visible ? [...h, name] : h.filter(x => x !== name))}
              style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--fg-muted)",padding:4,borderRadius:4,display:"flex"}}
              title={visible?"Hide":"Show"}>
              {visible
                ? <window.I.eye/>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a18.5 18.5 0 014.06-5.06M9.9 4.24A10.94 10.94 0 0112 4c6.5 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>}
            </button>
          </div>
        );
      })}

      {/* Add column */}
      <div style={{padding:"6px 14px 14px",position:"relative"}}>
        <button onClick={()=>setAdderOpen(o=>!o)}
          style={{
            width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            padding:"6px 10px",fontSize:12,fontFamily:"var(--font-sans)",
            background:"var(--bg-card)",color:"var(--accent)",
            border:"1px dashed var(--border-strong)",borderRadius:5,cursor:"pointer",
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add column
        </button>
      </div>

      {/* Row density */}
      <div style={{padding:"12px 14px",borderTop:"1px solid var(--border-default)"}}>
        <div style={{fontSize:11,color:"var(--fg-muted)",textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:8,fontWeight:500}}>Row density</div>
        <DensityPicker value={density} onChange={setDensity}/>
        <div style={{fontSize:11,color:"var(--fg-muted)",marginTop:6,lineHeight:1.4}}>
          {density === "compact"   && "Tight rows — maximum results on screen."}
          {density === "default"   && "Standard rows. Click any row to expand its detail."}
          {density === "comfy"     && "Roomy rows with larger previews and more spacing."}
          {density === "thumbnail" && "Gallery of large previews. Click one to open its detail panel."}
        </div>
      </div>

      {/* Result scope — single-select segmented */}
      <div style={{padding:"12px 14px",borderTop:"1px solid var(--border-default)"}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,color:"var(--fg-muted)",textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:500}}>Result scope</span>
          <span style={{fontSize:10,color:"var(--fg-muted)",fontStyle:"italic"}}>pick one</span>
        </div>
        <SegmentedRow value={scope} onChange={setScope}
          options={[["parts","Parts"],["assemblies","Assemblies"],["both","Both"]]}/>
        <div style={{fontSize:11,color:"var(--fg-muted)",marginTop:6,lineHeight:1.4}}>
          {scope === "parts" && "Standalone parts only — no assemblies."}
          {scope === "assemblies" && "Assemblies only — child parts shown inside each row."}
          {scope === "both" && "All files matching the query."}
        </div>
      </div>

      {/* View modes — multi-select, independent */}
      <div style={{padding:"12px 14px",borderTop:"1px solid var(--border-default)"}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,color:"var(--fg-muted)",textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:500}}>View modes</span>
          <span style={{fontSize:10,color:"var(--fg-muted)",fontStyle:"italic"}}>combine freely</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <ToggleCard
            checked={!!flags.collapseDuplicates}
            onChange={(v) => setFlags(f => ({...f, collapseDuplicates: v}))}
            label="Collapse duplicates"
            sub="Identical-geometry files merged into one row"
          />
          <ToggleCard
            checked={!!flags.latestOnly}
            onChange={(v) => setFlags(f => ({...f, latestOnly: v}))}
            label="Latest revision only"
            sub="Hide superseded PLM versions"
          />
        </div>
        {(flags.collapseDuplicates && flags.latestOnly) && (
          <div style={{
            marginTop:10,padding:"8px 10px",
            background:"var(--accent-tint)",borderRadius:5,
            fontSize:11,color:"var(--accent)",lineHeight:1.4,
            display:"flex",alignItems:"flex-start",gap:6,
          }}>
            <span style={{fontSize:13,lineHeight:1}}>✓</span>
            <span>Both active — showing latest revisions only, with identical-geometry duplicates collapsed.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════ Sidebar atoms ═════════════════════════════

// Row-density picker: icon-over-label segments (Finder-style view switcher).
function DensityPicker({ value, onChange }) {
  const opts = [
    ["compact",   "Compact",   window.I.viewCompact],
    ["default",   "Default",   window.I.viewDefault],
    ["comfy",     "Comfy",     window.I.viewComfy],
    ["thumbnail", "Thumbnail", window.I.viewThumb],
  ];
  return (
    <div style={{display:"flex",border:"1px solid var(--border-default)",borderRadius:5,overflow:"hidden"}}>
      {opts.map(([k, l, Glyph], i) => {
        const sel = value === k;
        return (
          <button key={k} onClick={() => onChange(k)} title={l} aria-label={l}
            style={{
              flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,
              padding:"8px 2px",
              background: sel ? "var(--accent)" : "var(--bg-card)",
              color: sel ? "#fff" : "var(--fg-secondary)",
              border:"none",
              borderRight: i < opts.length-1 ? "1px solid var(--border-default)" : "none",
              cursor:"pointer",fontFamily:"var(--font-sans)",
              transition:"background .12s ease",
            }}
            onMouseEnter={e=>{ if (!sel) e.currentTarget.style.background="var(--fill-hover)"; }}
            onMouseLeave={e=>{ if (!sel) e.currentTarget.style.background="var(--bg-card)"; }}>
            <Glyph/>
            <span style={{fontSize:10,fontWeight: sel ? 500 : 400,letterSpacing:"0.2px"}}>{l}</span>
          </button>
        );
      })}
    </div>
  );
}

function SegmentedRow({ value, onChange, options }) {
  return (
    <div style={{display:"flex",border:"1px solid var(--border-default)",borderRadius:5,overflow:"hidden"}}>
      {options.map(([k, l], i) => {
        const sel = value === k;
        return (
          <button key={k} onClick={() => onChange(k)}
            style={{
              flex:1,padding:"6px 4px",
              background: sel ? "var(--accent)" : "var(--bg-card)",
              color: sel ? "#fff" : "var(--fg-secondary)",
              border:"none",
              borderRight: i < options.length-1 ? "1px solid var(--border-default)" : "none",
              fontSize:11,fontWeight: sel ? 500 : 400,
              cursor:"pointer",fontFamily:"var(--font-sans)",
            }}>{l}</button>
        );
      })}
    </div>
  );
}

function ToggleCard({ checked, onChange, label, sub }) {
  return (
    <label style={{
      display:"flex",alignItems:"flex-start",gap:10,
      padding:"10px 12px",borderRadius:5,cursor:"pointer",
      background: checked ? "var(--accent-tint)" : "var(--bg-card)",
      border: checked ? "1px solid var(--accent)" : "1px solid var(--border-default)",
      transition:"all .12s ease",
    }}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{display:"none"}}/>
      <span style={{
        width:16,height:16,marginTop:1,borderRadius:3,flexShrink:0,
        border: checked ? "1.5px solid var(--accent)" : "1.5px solid var(--border-strong)",
        background: checked ? "var(--accent)" : "var(--bg-card)",
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
      </span>
      <span style={{display:"flex",flexDirection:"column",gap:2,minWidth:0,flex:1}}>
        <span style={{fontSize:12,fontWeight:500,color: checked ? "var(--accent)" : "var(--fg-primary)"}}>{label}</span>
        <span style={{fontSize:11,color:"var(--fg-muted)",lineHeight:1.4}}>{sub}</span>
      </span>
    </label>
  );
}

Object.assign(window, { Homepage, ResultsScreen, FullSidebar, ColumnsTab });
