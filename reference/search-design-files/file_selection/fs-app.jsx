// fs-app.jsx — composes the File Selection screen (nav + search + 3 panels). Density-aware.

const { useState, useMemo } = React;

function FSNav() {
  const tabs = [
    { id: 'files', label: 'Files', icon: 'folder-search', active: true },
    { id: 'upload', label: 'Upload', icon: 'upload' },
    { id: 'saved', label: 'Saved Searches', icon: 'bookmark' },
  ];
  return (
    <header style={{ height: 48, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)',
      display: 'flex', alignItems: 'center', gap: 24, padding: '0 16px', flexShrink: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="assets/datum-icon-transparent.png" alt="" style={{ height: 22, width: 'auto' }} />
        <span style={{ font: '500 15px/20px "DM Sans", sans-serif', color: 'var(--fg-primary)' }}>Datum</span>
      </div>
      <nav style={{ display: 'flex', gap: 18, flex: 1 }}>
        {tabs.map(t => (
          <button key={t.id} style={{ height: 48, padding: '0 2px', border: 0, background: 'transparent',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: t.active ? 'var(--accent)' : 'var(--fg-secondary)',
            font: `${t.active ? 500 : 400} 13px/16px "DM Sans", sans-serif`,
            borderBottom: t.active ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer', transition: 'color 150ms ease' }}>
            <i data-lucide={t.icon} style={{ width: 14, height: 14, strokeWidth: 1.75 }}></i>{t.label}
          </button>
        ))}
      </nav>
      <button style={{ height: 28, padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'transparent', border: 0, color: 'var(--fg-secondary)', font: '400 13px/16px "DM Sans", sans-serif', cursor: 'pointer' }}>
        <i data-lucide="message-square" style={{ width: 14, height: 14, strokeWidth: 1.75 }}></i>Feedback
      </button>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-secondary)', font: '400 13px/16px "DM Sans", sans-serif' }}>
        <i data-lucide="user" style={{ width: 14, height: 14, strokeWidth: 1.75 }}></i>aaron@datum.co
      </div>
    </header>
  );
}

// Breadcrumb strip — plain back arrow + plaintext trail (per DS Breadcrumbs component)
function FSBreadcrumb({ trail }) {
  return (
    <div style={{ flexShrink: 0, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)',
      padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, minHeight: 36 }}>
      <button aria-label={`Back to ${trail[trail.length - 2] ? trail[trail.length - 2].label : 'previous'}`}
        style={{ width: 16, height: 16, padding: 0, margin: 0, border: 0, background: 'transparent', cursor: 'pointer',
          color: 'var(--fg-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'color 150ms ease' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-secondary)'}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        {trail.map((c, i) => {
          const current = i === trail.length - 1;
          return (
            <React.Fragment key={c.label}>
              {i > 0 && <span style={{ color: 'var(--fg-muted)', font: '400 13px/16px "DM Sans", sans-serif', userSelect: 'none' }}>/</span>}
              {current
                ? <span aria-current="step" style={{ font: '500 13px/16px "DM Sans", sans-serif', color: 'var(--fg-primary)' }}>{c.label}</span>
                : <button style={{ background: 'transparent', border: 0, padding: 0, margin: 0, cursor: 'pointer',
                    font: '400 13px/16px "DM Sans", sans-serif', color: 'var(--fg-secondary)', transition: 'color 150ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.textUnderlineOffset = '3px'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.textDecoration = 'none'; }}>{c.label}</button>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// File search bar (center top). Wildcard * supported, case-insensitive.
function FSSearchBar({ query, setQuery, resultCount, totalCount, density }) {
  const [focus, setFocus] = useState(false);
  const compact = density === 'compact';
  return (
    <div style={{ flexShrink: 0, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)',
      padding: compact ? '10px 16px' : '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: 460 }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', display: 'inline-flex', pointerEvents: 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
        </span>
        <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          placeholder="Search file name — e.g. 7100490*  or  *RSB40*"
          style={{ width: '100%', height: compact ? 32 : 36, padding: '0 34px 0 34px', borderRadius: 5,
            border: `1px solid ${focus ? 'var(--border-focus)' : 'var(--border-strong)'}`,
            outline: focus ? '1.5px solid var(--border-focus)' : 'none', outlineOffset: 1,
            font: '400 13px/16px "DM Sans", sans-serif', color: 'var(--fg-primary)', background: 'var(--bg-card)',
            transition: 'border-color 150ms ease', boxSizing: 'border-box' }} />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--fg-muted)', display: 'inline-flex', padding: 2 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        <span style={{ font: '400 12px/16px "DM Sans", sans-serif', color: 'var(--fg-muted)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-secondary)' }}>{resultCount}</span> of <span style={{ fontFamily: 'var(--font-mono)' }}>{totalCount}</span> files
        </span>
      </div>
    </div>
  );
}

// Wildcard → RegExp (case-insensitive). * matches any run of chars.
function fsQueryToRegex(q) {
  if (!q.trim()) return null;
  const esc = q.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  try { return new RegExp(esc, 'i'); } catch (e) { return null; }
}

function FileSelectionApp({ density = 'comfortable', initialFilters, defaultView = 'table', initialSelectedId = null }) {
  const compact = density === 'comfortable' ? false : true;
  const [view, setView] = useState(defaultView);
  const [filters, setFilters] = useState(() => {
    const s = fsInitState();
    if (initialFilters) Object.keys(initialFilters).forEach(k => { s[k] = { ...s[k], ...initialFilters[k] }; });
    return s;
  });
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [hiddenCols, setHiddenCols] = useState(() => new Set());
  const [sort, setSort] = useState({ key: 'modified', dir: 'desc' });
  const [toast, setToast] = useState(null);

  const sidebarW = compact ? 280 : 304;
  const detailW = compact ? 340 : 384;

  const toggleCol = (k) => setHiddenCols(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const setOne = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearAll = () => setFilters(fsInitState());
  const clearGroup = (g) => setFilters(f => { const n = { ...f }; g.keys.forEach(k => n[k] = fsInitField(k)); return n; });

  const activeFilterKeys = useMemo(
    () => Object.keys(FS_FIELDS).filter(k => fsIsActive(k, filters[k])),
    [filters]
  );

  const rows = useMemo(() => {
    const rx = fsQueryToRegex(query);
    const filtered = FS_FILES.filter(f => {
      if (rx && !rx.test(f.name)) return false;
      return activeFilterKeys.every(k => fsFilePasses(f, k, filters[k]));
    });
    return fsSortRows(filtered, sort);
  }, [query, filters, activeFilterKeys, sort]);

  // Columns: default 4 (preview, name, modified, synced) + up to 3 active-filter cols the user hasn't hidden
  const visibleFilterKeys = activeFilterKeys.filter(k => !hiddenCols.has(k));
  const shownFilterKeys = visibleFilterKeys.slice(0, 3);

  // Keep selection valid as the result set changes
  React.useEffect(() => {
    if (selectedId && !rows.some(r => r.id === selectedId)) setSelectedId(null);
  }, [rows, selectedId]);

  const selectedFile = rows.find(r => r.id === selectedId) || null;

  const runSearch = () => {
    if (!selectedFile) return;
    setToast(`Starting requirement search from ${selectedFile.name}`);
    setTimeout(() => setToast(null), 2600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-page)', position: 'relative' }}>
      <FSNav />
      <FSBreadcrumb trail={[{ label: 'Home' }, { label: 'File Selection' }]} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <FilterSidebar width={sidebarW} filters={filters} setOne={setOne} clearAll={clearAll} clearGroup={clearGroup}
          resultCount={rows.length} totalCount={FS_FILES.length} view={view} setView={setView}
          activeFilterKeys={activeFilterKeys} hiddenCols={hiddenCols} toggleCol={toggleCol}
          shownFilterKeys={shownFilterKeys} sort={sort} setSort={setSort} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <FSSearchBar query={query} setQuery={setQuery} resultCount={rows.length} totalCount={FS_FILES.length} density={density} />
          {view === 'gallery'
            ? <FilesGallery rows={rows} activeFilterKeys={activeFilterKeys} selectedId={selectedId}
                onSelect={id => setSelectedId(id === selectedId ? null : id)} density={density} />
            : <FilesTable rows={rows} activeFilterKeys={activeFilterKeys} shownFilterKeys={shownFilterKeys} selectedId={selectedId}
                onSelect={id => setSelectedId(id === selectedId ? null : id)} density={density} />}
        </div>
        <FileDetailsPanel file={selectedFile} width={detailW} onClose={() => setSelectedId(null)}
          onSearch={runSearch} activeFilterKeys={activeFilterKeys} density={density} />
      </div>

      {toast && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--charcoal)', color: 'var(--vanilla)', padding: '10px 16px', borderRadius: 5,
          font: '400 12px/16px "DM Sans", sans-serif', display: 'flex', alignItems: 'center', gap: 8, zIndex: 30, maxWidth: '80%' }}>
          <i data-lucide="search" style={{ width: 14, height: 14, strokeWidth: 2 }}></i>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{toast}</span>
        </div>
      )}
    </div>
  );
}

// Sort rows by the Manage-tab selection. modified/releasedDate parse as dates; name is lexical; calcWeight numeric.
function fsSortRows(rows, sort) {
  const mul = sort.dir === 'asc' ? 1 : -1;
  const val = (f) => {
    if (sort.key === 'name') return f.name.toLowerCase();
    if (sort.key === 'calcWeight') return f.calcWeight;
    if (sort.key === 'releasedDate') { const t = Date.parse(f.releasedDate); return isNaN(t) ? -Infinity : t; }
    const t = Date.parse(f.modified); return isNaN(t) ? -Infinity : t;
  };
  return [...rows].sort((a, b) => { const va = val(a), vb = val(b); return va < vb ? -mul : va > vb ? mul : 0; });
}

Object.assign(window, { FileSelectionApp, FSNav, FSSearchBar });
