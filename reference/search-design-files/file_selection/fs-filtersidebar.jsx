// fs-filtersidebar.jsx — left filter sidebar: grouped, collapsible, per-data-type controls

const _fsSearch = (s = 13) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
);
const _fsChevron = (open) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ transition: 'transform .15s ease', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}><path d="M6 9l6 6 6-6" /></svg>
);

const _fsTextInput = {
  width: '100%', padding: '6px 10px 6px 28px', fontSize: 12, fontFamily: 'var(--font-sans)',
  border: '1px solid var(--border-strong)', borderRadius: 5,
  background: 'var(--bg-card)', color: 'var(--fg-primary)', outline: 'none',
  boxSizing: 'border-box', height: 28,
};

function FSCheckRow({ checked, onChange, label, count, render }) {
  const [hover, setHover] = React.useState(false);
  return (
    <label onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', margin: '0 -6px',
        borderRadius: 4, cursor: 'pointer', fontSize: 12, background: hover ? 'var(--fill-hover)' : 'transparent' }}>
      <FSCheck checked={checked} />
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      <span style={{ flex: 1, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {render ? render() : label}
      </span>
      {count != null && <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{count}</span>}
    </label>
  );
}

function FSMultiControl({ fieldKey, value, onChange }) {
  const m = FS_FIELDS[fieldKey];
  const opts = fsOptions(m.prop);
  const isTag = m.kind === 'multi-tag';
  const showSearch = m.kind === 'multi-search' && opts.length >= 6;
  const q = (value.query || '').toLowerCase();
  const matches = opts.filter(([n]) => !q || n.toLowerCase().includes(q));
  const toggle = (n, on) => onChange({ ...value, values: on ? [...value.values, n] : value.values.filter(x => x !== n) });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {showSearch && (
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 8, top: 7, color: 'var(--fg-muted)', pointerEvents: 'none', display: 'inline-flex' }}>{_fsSearch()}</span>
          <input type="text" value={value.query || ''} placeholder={`Filter ${opts.length} options…`}
            onChange={e => onChange({ ...value, query: e.target.value })} style={_fsTextInput} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 156, overflowY: 'auto' }}>
        {matches.length === 0 && <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontStyle: 'italic', padding: '6px 0' }}>No matches</div>}
        {matches.map(([n, c]) => {
          const checked = value.values.includes(n);
          const tone = FS_STATUS_TONE[n];
          return <FSCheckRow key={n} label={n} count={c} checked={checked} onChange={on => toggle(n, on)}
            render={isTag && tone ? () => <FSBadge tone={tone}>{n}</FSBadge> : null} />;
        })}
      </div>
    </div>
  );
}

function FSRangeControl({ fieldKey, value, onChange }) {
  const m = FS_FIELDS[fieldKey];
  const minPct = ((value.min - m.min) / (m.max - m.min)) * 100;
  const maxPct = ((value.max - m.min) / (m.max - m.min)) * 100;
  const numStyle = { width: 70, padding: '4px 6px', fontSize: 11, fontFamily: 'var(--font-mono)',
    border: '1px solid var(--border-strong)', borderRadius: 5, background: 'var(--bg-card)', color: 'var(--fg-primary)', outline: 'none' };
  const rangeStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: 18, appearance: 'none', background: 'transparent', pointerEvents: 'none', margin: 0 };
  return (
    <div>
      <div style={{ position: 'relative', height: 18, marginTop: 2 }}>
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 3, background: 'var(--border-default)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: 8, height: 3, background: 'var(--accent)', borderRadius: 2, left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
        <input type="range" min={m.min} max={m.max} step={m.step} value={value.min}
          onChange={e => onChange({ ...value, min: Math.min(+e.target.value, value.max) })} style={rangeStyle} />
        <input type="range" min={m.min} max={m.max} step={m.step} value={value.max}
          onChange={e => onChange({ ...value, max: Math.max(+e.target.value, value.min) })} style={rangeStyle} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <input type="number" value={value.min} min={m.min} max={value.max} step={m.step}
          onChange={e => onChange({ ...value, min: Math.max(m.min, Math.min(+e.target.value, value.max)) })} style={numStyle} />
        <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>to</span>
        <input type="number" value={value.max} min={value.min} max={m.max} step={m.step}
          onChange={e => onChange({ ...value, max: Math.min(m.max, Math.max(+e.target.value, value.min)) })} style={numStyle} />
        <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>{m.unit}</span>
      </div>
    </div>
  );
}

function FSDateControl({ value, onChange }) {
  const presets = [['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['1y', 'Last year'], ['custom', 'Custom range']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {presets.map(([k, l]) => {
        const sel = value.preset === k;
        return (
          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer', fontSize: 12 }}>
            <span style={{ width: 14, height: 14, borderRadius: 99, flexShrink: 0,
              border: sel ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
              background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sel && <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)' }} />}
            </span>
            <input type="radio" checked={sel} onChange={() => onChange({ ...value, preset: k })} style={{ display: 'none' }} />
            <span>{l}</span>
          </label>
        );
      })}
    </div>
  );
}

function FSFilterSection({ fieldKey, value, onChange, expanded, onToggle }) {
  const m = FS_FIELDS[fieldKey];
  const active = fsIsActive(fieldKey, value);
  const clear = () => onChange(fsInitField(fieldKey));
  return (
    <div style={{ borderBottom: '1px solid var(--border-default)' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
        color: 'var(--fg-primary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500 }}>
        <span style={{ color: 'var(--fg-muted)', display: 'inline-flex' }}>{_fsChevron(expanded)}</span>
        <span style={{ flex: 1 }}>{m.label}</span>
        {active && <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)', flexShrink: 0 }} title="Filter active" />}
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 12px 32px' }}>
          {(m.kind === 'multi-tag' || m.kind === 'multi-search') && <FSMultiControl fieldKey={fieldKey} value={value} onChange={onChange} />}
          {m.kind === 'range-units' && <FSRangeControl fieldKey={fieldKey} value={value} onChange={onChange} />}
          {m.kind === 'date-preset' && <FSDateControl value={value} onChange={onChange} />}
          {active && <button onClick={clear} style={{ marginTop: 8, background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}>Clear</button>}
        </div>
      )}
    </div>
  );
}

function FSGroup({ group, filters, setOne, clearGroup, open, setOpen, expanded, setExpanded, matchKey }) {
  const visible = group.keys.filter(matchKey);
  if (visible.length === 0) return null;
  const groupActive = group.keys.filter(k => fsIsActive(k, filters[k])).length;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)' }}>
        <button onClick={() => setOpen(o => ({ ...o, [group.id]: !o[group.id] }))}
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
            color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
          <span style={{ color: 'var(--fg-muted)', display: 'inline-flex' }}>{_fsChevron(open)}</span>
          <span style={{ flex: 1 }}>{group.label}</span>
          {groupActive > 0 && <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 5px', borderRadius: 99,
            background: 'var(--accent)', color: 'var(--btn-primary-fg)', fontFamily: 'var(--font-mono)', textTransform: 'none', letterSpacing: 0 }}>{groupActive}</span>}
        </button>
        {groupActive > 0 && <button onClick={() => clearGroup(group)}
          style={{ background: 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Clear</button>}
      </div>
      {open && visible.map(k => (
        <FSFilterSection key={k} fieldKey={k} value={filters[k]} onChange={v => setOne(k, v)}
          expanded={!!expanded[k]} onToggle={() => setExpanded(e => ({ ...e, [k]: !e[k] }))} />
      ))}
    </div>
  );
}

// Full-width segmented control (View, Direction)
function FSSeg({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)', borderRadius: 5, padding: 2, gap: 2 }}>
      {options.map(([k, label, icon]) => {
        const sel = value === k;
        return (
          <button key={k} onClick={() => onChange(k)} aria-pressed={sel}
            style={{ flex: 1, height: 26, border: 0, borderRadius: 3, cursor: 'pointer',
              background: sel ? 'var(--accent-tint)' : 'transparent', color: sel ? 'var(--accent)' : 'var(--fg-secondary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              font: '500 12px/16px var(--font-sans)', transition: 'background-color 150ms ease' }}>
            {icon && <i data-lucide={icon} style={{ width: 14, height: 14, strokeWidth: 1.75 }}></i>}{label}
          </button>
        );
      })}
    </div>
  );
}

function FSTabField({ label, children }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)' }}>
      <div style={{ font: '500 11px/14px var(--font-sans)', textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--fg-secondary)', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

const FS_BASE_COLS = [['name', 'File name'], ['modified', 'Modified'], ['lastSynced', 'Last synced']];

// Columns tab — view mode + which metadata columns show in the table (max 3 filter cols)
function FSColumnsTab({ view, setView, activeFilterKeys, hiddenCols, toggleCol, shownFilterKeys }) {
  const shownCount = 4 + shownFilterKeys.length; // preview + name + modified + lastSynced + filter cols
  return (
    <div>
      <FSTabField label="View">
        <FSSeg value={view} onChange={setView} options={[['table', 'List', 'list'], ['gallery', 'Gallery', 'layout-grid']]} />
      </FSTabField>
      {view === 'table' && (
        <FSTabField label={`Columns · ${shownCount}/7`}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FS_BASE_COLS.map(([k, l]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                <i data-lucide="lock" style={{ width: 12, height: 12, strokeWidth: 1.75, color: 'var(--fg-muted)' }}></i>
                <span style={{ flex: 1, color: 'var(--fg-secondary)' }}>{l}</span>
              </div>
            ))}
          </div>
          {activeFilterKeys.length > 0 ? (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-default)' }}>
              <div style={{ font: '400 11px/15px var(--font-sans)', color: 'var(--fg-muted)', marginBottom: 4 }}>From active filters · up to 3 shown in table</div>
              {activeFilterKeys.map(k => {
                const hidden = hiddenCols.has(k);
                const capped = !hidden && !shownFilterKeys.includes(k);
                return (
                  <FSCheckRow key={k} checked={!hidden} onChange={() => toggleCol(k)}
                    render={() => (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {FS_FIELDS[k].col}
                        {capped && <span style={{ fontSize: 10, color: 'var(--fg-muted)', fontStyle: 'italic' }}>· in details</span>}
                      </span>
                    )} />
                );
              })}
            </div>
          ) : (
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Apply filters to add metadata columns.</div>
          )}
        </FSTabField>
      )}
    </div>
  );
}

const FS_SORT_OPTS = [['modified', 'Date modified'], ['name', 'File name'], ['releasedDate', 'Released date'], ['calcWeight', 'Calc weight']];

// Manage tab — sort field + direction
function FSManageTab({ sort, setSort }) {
  return (
    <div>
      <FSTabField label="Sort by">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FS_SORT_OPTS.map(([k, l]) => {
            const sel = sort.key === k;
            return (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 12 }}>
                <span style={{ width: 14, height: 14, borderRadius: 99, flexShrink: 0,
                  border: sel ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
                  background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sel && <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)' }} />}
                </span>
                <input type="radio" checked={sel} onChange={() => setSort(s => ({ ...s, key: k }))} style={{ display: 'none' }} />
                <span style={{ color: 'var(--fg-primary)' }}>{l}</span>
              </label>
            );
          })}
        </div>
      </FSTabField>
      <FSTabField label="Direction">
        <FSSeg value={sort.dir} onChange={d => setSort(s => ({ ...s, dir: d }))}
          options={[['desc', 'Descending', 'arrow-down'], ['asc', 'Ascending', 'arrow-up']]} />
      </FSTabField>
    </div>
  );
}

function FilterSidebar({ width, filters, setOne, clearAll, clearGroup, resultCount, totalCount,
  view, setView, activeFilterKeys, hiddenCols, toggleCol, shownFilterKeys, sort, setSort }) {
  const [tab, setTab] = React.useState('filters');
  const [groupOpen, setGroupOpen] = React.useState({ program: true, product: true, lifecycle: true });
  const [expanded, setExpanded] = React.useState({ program: true, modelYear: true, releaseStatus: true, calcWeight: false });
  const [query, setQuery] = React.useState('');
  const activeCount = Object.keys(FS_FIELDS).filter(k => fsIsActive(k, filters[k])).length;
  const matchKey = (k) => !query || FS_FIELDS[k].label.toLowerCase().includes(query.toLowerCase());
  const tabDefs = [['filters', 'Filters', activeCount], ['columns', 'Columns'], ['manage', 'Manage']];

  return (
    <aside style={{ width, flexShrink: 0, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-default)',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)' }}>Browse files</div>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {activeCount ? `${resultCount} of ${totalCount} files` : `${totalCount} files`}
          </div>
        </div>
        {tab === 'filters' && (
          <button onClick={clearAll} disabled={!activeCount}
            style={{ background: 'transparent', border: 'none', padding: '3px 6px', fontSize: 11, color: 'var(--accent)',
              fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: activeCount ? 'pointer' : 'not-allowed', opacity: activeCount ? 1 : 0.38 }}>
            Clear all
          </button>
        )}
      </div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0 12px', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
        {tabDefs.map(([k, l, badge]) => {
          const sel = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)}
              style={{ position: 'relative', padding: '9px 6px', border: 0, background: 'transparent', cursor: 'pointer', marginBottom: -1,
                font: `${sel ? 500 : 400} 12px/16px var(--font-sans)`, color: sel ? 'var(--accent)' : 'var(--fg-secondary)',
                borderBottom: sel ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 150ms ease' }}>
              {l}
              {badge > 0 && <span style={{ font: '500 10px/1 var(--font-mono)', padding: '2px 5px', borderRadius: 99, background: 'var(--accent)', color: 'var(--btn-primary-fg)' }}>{badge}</span>}
            </button>
          );
        })}
      </div>
      {/* Filters tab */}
      {tab === 'filters' && (
        <React.Fragment>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-default)', flexShrink: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 22, top: 19, color: 'var(--fg-muted)', pointerEvents: 'none', display: 'inline-flex' }}>{_fsSearch()}</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search filters…" style={_fsTextInput} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {FS_GROUPS.map(g => (
              <FSGroup key={g.id} group={g} filters={filters} setOne={setOne} clearGroup={clearGroup}
                open={groupOpen[g.id]} setOpen={setGroupOpen} expanded={expanded} setExpanded={setExpanded} matchKey={matchKey} />
            ))}
            {query && !FS_GROUPS.some(g => g.keys.some(matchKey)) && (
              <div style={{ padding: '28px 14px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 12 }}>No filters match "{query}".</div>
            )}
          </div>
        </React.Fragment>
      )}
      {/* Columns tab */}
      {tab === 'columns' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <FSColumnsTab view={view} setView={setView} activeFilterKeys={activeFilterKeys}
            hiddenCols={hiddenCols} toggleCol={toggleCol} shownFilterKeys={shownFilterKeys} />
        </div>
      )}
      {/* Manage tab */}
      {tab === 'manage' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <FSManageTab sort={sort} setSort={setSort} />
        </div>
      )}
      {/* Footer collapse */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-default)', padding: 8 }}>
        <button style={{ width: '100%', height: 28, border: 0, background: 'transparent', borderRadius: 5, color: 'var(--fg-secondary)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: '500 11px/14px var(--font-sans)', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
          Collapse
        </button>
      </div>
    </aside>
  );
}

Object.assign(window, { FilterSidebar });
