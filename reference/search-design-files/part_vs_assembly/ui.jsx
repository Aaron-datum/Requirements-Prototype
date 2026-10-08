// ui.jsx — Shared chrome (top bar, breadcrumb, icons), modality picker,
// and the row renderers that change per modality.
const { useState: uUseState, useMemo: uUseMemo, useRef: uUseRef, useEffect: uUseEffect } = React;

// ───────── Icons (Lucide-style, 1.5px stroke) ─────────
const I = {
  chevron: ({open, size=14}={}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{transition:"transform .15s",transform:open?"rotate(0deg)":"rotate(-90deg)"}}>
      <path d="M6 9l6 6 6-6"/></svg>
  ),
  chevronR: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
  chevronL: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>,
  x:        () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  search:   ({size=14}={}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
  filter:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></svg>,
  bookmark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  upload:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 21h14"/></svg>,
  file:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  message:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>,
  found:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>,
  eye:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>,
  download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>,
  compare:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l-4-4 4-4"/><path d="M17 7l4 4-4 4"/><path d="M3 13h6"/><path d="M15 11h6"/></svg>,
  dots:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>,
  sort:     () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9l5-5 5 5"/><path d="M7 15l5 5 5-5"/></svg>,
  // Row-density / view-mode glyphs
  viewCompact: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 6h16M4 9.5h16M4 13h16M4 16.5h16M4 20h16"/></svg>,
  viewDefault: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
  viewComfy:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="4" height="4" rx="1"/><path d="M11 6.5h9"/><rect x="3.5" y="15.5" width="4" height="4" rx="1"/><path d="M11 17.5h9"/></svg>,
  viewThumb:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/></svg>,
  // Modality glyphs (custom, line-art, brand-neutral)
  modPart:    () => <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="24" height="24" rx="2"/><path d="M20 22h6M20 26h10M20 30h8M20 34h12"/></svg>,
  modAsm:     () => <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="10" width="36" height="36" rx="2"/><rect x="14" y="14" width="10" height="10" rx="1"/><rect x="26" y="14" width="16" height="6" rx="1"/><rect x="26" y="22" width="10" height="20" rx="1"/><rect x="14" y="26" width="10" height="16" rx="1"/><rect x="38" y="22" width="4" height="20" rx="1"/></svg>,
  modPartInAsm: () => <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="40" height="40" rx="2" strokeDasharray="2 3"/><rect x="22" y="22" width="12" height="12" rx="2" fill="currentColor" fillOpacity=".12"/><rect x="22" y="22" width="12" height="12" rx="2"/></svg>,
  modAsmFromPart: () => <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="22" y="22" width="12" height="12" rx="2" fill="currentColor" fillOpacity=".12"/><path d="M28 6v10M28 40v10M6 28h10M40 28h10" strokeDasharray="2 3"/><rect x="4" y="4" width="14" height="14" rx="2"/><rect x="38" y="4" width="14" height="14" rx="2"/><rect x="4" y="38" width="14" height="14" rx="2"/><rect x="38" y="38" width="14" height="14" rx="2"/></svg>,
  modPartFromAsm: () => <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="22" height="22" rx="2" strokeDasharray="2 3"/><rect x="10" y="10" width="10" height="10" rx="1"/><path d="M28 28l16 16M44 36v8h-8" /></svg>,
  modDedup: () => <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="10" width="20" height="20" rx="2"/><rect x="20" y="20" width="20" height="20" rx="2" fill="currentColor" fillOpacity=".12"/></svg>,
  modVersion: () => <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="28" r="3"/><circle cx="28" cy="28" r="3"/><circle cx="44" cy="28" r="4" fill="currentColor" fillOpacity=".2"/><path d="M15 28h10M31 28h9"/></svg>,
};

// ───────── Atoms ─────────
function Pill({ children, bg, fg, border, mono }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      fontSize:11, lineHeight:1, padding:"3px 7px",
      borderRadius:5, fontWeight:500,
      background: bg || "var(--bg-subtle)",
      color:      fg || "var(--fg-secondary)",
      border:     border || "1px solid transparent",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
      whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

function LevelBadge({ level }) {
  const l = window.RELEVANCE.find(x => x.key === level);
  if (!l) return null;
  return <Pill bg={l.bg} fg={l.color}>{l.label}</Pill>;
}

function KindBadge({ kind, childCount }) {
  if (kind === "assembly")
    return <Pill bg="var(--datum-blue-tint)" fg="var(--datum-blue)" border="1px solid var(--datum-blue)">
      Assembly{childCount != null ? <span style={{opacity:.7,fontFamily:"var(--font-mono)",marginLeft:2}}>· {childCount}</span> : null}
    </Pill>;
  return <Pill bg="var(--bg-subtle)" fg="var(--fg-secondary)" border="1px solid var(--border-default)">Part</Pill>;
}

function SourcePill({ name }) {
  const c = window.SOURCE_COLOR[name] || { bg:"var(--bg-subtle)", fg:"var(--fg-secondary)" };
  return <Pill bg={c.bg} fg={c.fg}>{name}</Pill>;
}

function RelevanceBar({ pct, level }) {
  const l = window.RELEVANCE.find(x => x.key === level);
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
      <div style={{flex:1,height:6,background:"var(--border-default)",borderRadius:99,position:"relative",overflow:"hidden",minWidth:80}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct}%`,background:l.barFill,borderRadius:99}}/>
      </div>
      <span style={{fontFamily:"var(--font-mono)",fontSize:12,fontWeight:500,color:"var(--fg-primary)",whiteSpace:"nowrap",minWidth:32}}>{pct}%</span>
      <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:l.bg,color:l.color,fontWeight:500,whiteSpace:"nowrap"}}>{l.label}</span>
    </div>
  );
}

function IconBtn({ children, label, onClick, active }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      style={{
        width:28,height:28,border:"none",cursor:"pointer",
        background: active ? "var(--fill-hover)" : "transparent",
        color: active ? "var(--fg-primary)" : "var(--fg-muted)",
        borderRadius:5,display:"inline-flex",alignItems:"center",justifyContent:"center",
      }}
      onMouseEnter={e=>{ if (!active) e.currentTarget.style.background="var(--fill-hover)"; }}
      onMouseLeave={e=>{ if (!active) e.currentTarget.style.background="transparent"; }}>
      {children}
    </button>
  );
}

// ───────── Top nav (mirrors the screenshot exactly) ─────────
function TopNav() {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:24,
      height:56,padding:"0 24px",
      background:"var(--bg-sidebar)",borderBottom:"1px solid var(--border-default)",
      fontFamily:"var(--font-sans)",
    }}>
      {/* Datum + Brand */}
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <img src="assets/datum-logo-full.png" alt="Datum" style={{height:24,width:"auto"}}/>
        <div style={{width:1,height:28,background:"var(--border-default)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:500,letterSpacing:".5px",color:"var(--fg-primary)",fontSize:15}}>
          <span style={{display:"inline-block",width:20,height:20,position:"relative"}}>
            <span style={{position:"absolute",inset:0,border:"2px solid #c4d82e",borderRadius:"50%",clipPath:"polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)"}}/>
            <span style={{position:"absolute",inset:0,borderRight:"2px solid #c4d82e",transform:"rotate(20deg)"}}/>
          </span>
          ADIENT
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:8}}>
        {[
          ["Files", I.file, false],
          ["Upload", I.upload, false],
          ["Saved Searches", I.bookmark, false],
        ].map(([label, Ic, sel]) => (
          <button key={label}
            style={{
              display:"inline-flex",alignItems:"center",gap:6,
              padding:"6px 12px",borderRadius:5,border:"none",background:"transparent",
              fontSize:13,fontWeight:500,color: sel ? "var(--accent)" : "var(--fg-primary)",
              cursor:"pointer",fontFamily:"var(--font-sans)",
            }}>
            <Ic/>{label}
          </button>
        ))}
      </div>

      <div style={{flex:1}}/>

      {/* Right cluster */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",border:"1px solid var(--border-default)",borderRadius:5,background:"var(--bg-card)",fontSize:13,color:"var(--accent)",fontWeight:500,cursor:"pointer"}}>
          <I.found/> Found It
        </button>
        <button style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",border:"none",borderRadius:5,background:"transparent",fontSize:13,color:"var(--fg-secondary)",cursor:"pointer"}}>
          <I.message/> Feedback
        </button>
        <div style={{fontSize:13,color:"var(--fg-secondary)",marginLeft:8}}>aaron@datum.co</div>
      </div>
    </div>
  );
}

// ───────── Breadcrumb / sub-header ─────────
function SubHeader({ crumbs = [], rightSlot, modality }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"12px 24px",
      borderBottom:"1px solid var(--border-default)",
      background:"var(--bg-sidebar)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button style={{width:28,height:28,border:"none",background:"transparent",borderRadius:5,cursor:"pointer",color:"var(--fg-muted)",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
          <I.chevronL/>
        </button>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <span style={{fontSize:13,color: i === crumbs.length-1 ? "var(--fg-primary)" : "var(--fg-muted)",fontWeight: i === crumbs.length-1 ? 500 : 400}}>{c}</span>
            {i < crumbs.length-1 && <span style={{color:"var(--fg-muted)"}}>/</span>}
          </React.Fragment>
        ))}
        {modality && <ModalityChip mod={modality}/>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>{rightSlot}</div>
    </div>
  );
}

function ModalityChip({ mod }) {
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:6,
      padding:"4px 10px 4px 8px",borderRadius:5,
      border:"1px solid var(--accent)",background:"var(--accent-tint)",
      color:"var(--accent)",fontSize:12,fontWeight:500,marginLeft:8,
    }}>
      <span style={{width:14,height:14,display:"inline-flex"}}><ModalityIcon id={mod.id}/></span>
      {mod.label}
    </span>
  );
}
function ModalityIcon({ id, size = 14 }) {
  const map = { a: I.modPart, b: I.modPartInAsm, c: I.modAsm, d: I.modPartFromAsm };
  const C = map[id] || I.modPart;
  // Re-size: wrap and constrain
  return <span style={{width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
    <span style={{transform:`scale(${size/56})`,transformOrigin:"top left",display:"block",width:56,height:56}}><C/></span>
  </span>;
}

// ───────── Filter strip (Show Filters + relevance chips) ─────────
function FilterStrip({ matchCount, modality, flags, scope, onOpenManage }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"12px 24px",background:"var(--bg-page)",
      borderBottom:"1px solid var(--border-default)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",border:"1px solid var(--border-default)",borderRadius:5,background:"var(--bg-card)",fontSize:13,color:"var(--fg-secondary)",cursor:"pointer"}}>
          <I.filter/> Show Filters
        </button>
        <span style={{fontSize:13,color:"var(--fg-primary)",fontWeight:500}}>Found {matchCount} matching files</span>
        <span style={{fontSize:12,color:"var(--fg-muted)"}}>·</span>
        <ViewModeReadout scope={scope} flags={flags} onClick={onOpenManage}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <Pill bg="#EAF3DE" fg="#27500A">High</Pill>
        <Pill bg="#FFF3CD" fg="#7A4F00">Medium</Pill>
        <Pill bg="#FBE2DD" fg="#A8200D">Low</Pill>
      </div>
    </div>
  );
}

function ViewModeReadout({ scope, flags = {}, onClick }) {
  const parts = [];
  if (scope === "parts") parts.push("Parts only");
  else if (scope === "assemblies") parts.push("Assemblies only");
  else parts.push("Parts + Assemblies");
  if (flags.collapseDuplicates) parts.push("Duplicates collapsed");
  if (flags.latestOnly) parts.push("Latest revision only");
  return (
    <button onClick={onClick} style={{
      display:"inline-flex",alignItems:"center",gap:6,
      background:"transparent",border:"none",cursor:"pointer",
      fontSize:12,color:"var(--accent)",fontFamily:"var(--font-sans)",
      padding:"4px 6px",borderRadius:5,
    }}
      onMouseEnter={e=>e.currentTarget.style.background="var(--fill-hover)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <span style={{display:"inline-block",width:6,height:6,borderRadius:99,background:"var(--accent)"}}/>
      View: {parts.join(" · ")}
    </button>
  );
}

// ───────── Action cluster (right side of each row) ─────────
function RowActions() {
  return (
    <div style={{display:"flex",gap:2,justifyContent:"flex-end"}}>
      <IconBtn label="Compare"><I.compare/></IconBtn>
      <IconBtn label="Preview"><I.eye/></IconBtn>
      <IconBtn label="More"><I.dots/></IconBtn>
    </div>
  );
}

// ───────── Preview thumb ─────────
function PreviewThumb({ src, size = 48, badge }) {
  return (
    <div style={{
      width:size,height:size,borderRadius:5,
      border:"1px solid var(--border-default)",background:"var(--bg-subtle)",
      overflow:"hidden",position:"relative",flexShrink:0,
    }}>
      <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      {badge && (
        <span style={{
          position:"absolute",right:-4,top:-4,
          minWidth:18,height:18,padding:"0 4px",borderRadius:99,
          background:"var(--accent)",color:"#fff",fontSize:10,fontWeight:500,
          display:"inline-flex",alignItems:"center",justifyContent:"center",
          border:"2px solid var(--bg-card)",
          fontFamily:"var(--font-mono)",
        }}>{badge}</span>
      )}
    </div>
  );
}

Object.assign(window, {
  I, Pill, LevelBadge, KindBadge, SourcePill, RelevanceBar, IconBtn,
  TopNav, SubHeader, FilterStrip, RowActions, PreviewThumb,
  ModalityChip, ModalityIcon, ViewModeReadout,
});
