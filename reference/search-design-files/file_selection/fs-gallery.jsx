// fs-gallery.jsx — Finder-style icon/gallery view: large thumbnail cards instead of rows.

function FSGalleryCard({ file, selected, onSelect, activeFilterKeys, compact }) {
  const [hover, setHover] = React.useState(false);
  const border = selected ? '2px solid var(--accent)' : `1px solid ${hover ? 'var(--border-strong)' : 'var(--border-default)'}`;
  const pad = selected ? (compact ? 9 : 11) : (compact ? 10 : 12); // compensate 1px for 2px selected border
  // up to 2 active-filter values shown as quiet chips
  const chips = activeFilterKeys.slice(0, 2).map(k => {
    const m = FS_FIELDS[k];
    const v = file[m.prop];
    return m.kind === 'range-units' ? `${v} ${m.unit}` : v;
  });
  return (
    <div onClick={() => onSelect(file.id)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: selected ? 'var(--accent-tint)' : 'var(--bg-card)', border, borderRadius: 5,
        cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'border-color 150ms ease, background-color 150ms ease' }}>
      {/* Large thumbnail */}
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#FFFFFF', borderBottom: '1px solid var(--border-default)',
        overflow: 'hidden', position: 'relative' }}>
        <img src={`assets/cad-preview-${((file.thumb - 1) % 5) + 1}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <FSBadge tone={FS_STATUS_TONE[file.releaseStatus] || 'type'}>{file.releaseStatus}</FSBadge>
        </div>
        {selected && (
          <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 99, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
        )}
      </div>
      {/* Meta */}
      <div style={{ padding: `${compact ? 8 : 10}px ${pad}px ${compact ? 8 : 10}px`, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <div title={file.name} style={{ font: `500 ${compact ? 11 : 12}px/16px "DM Mono", monospace`, color: 'var(--fg-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
        {chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {chips.map((c, i) => (
              <span key={i} style={{ font: '400 10px/14px "DM Sans", sans-serif', color: 'var(--fg-secondary)', whiteSpace: 'nowrap',
                background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 5, padding: '0 6px' }}>{c}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ font: '400 11px/14px "DM Sans", sans-serif', color: 'var(--fg-muted)' }}>{file.modified}</span>
          <FSMono style={{ color: 'var(--fg-muted)', fontSize: 10 }}>{file.size}</FSMono>
        </div>
      </div>
    </div>
  );
}

function FilesGallery({ rows, activeFilterKeys, selectedId, onSelect, density }) {
  const compact = density === 'compact';
  const minW = compact ? 168 : 208;
  return (
    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-page)' }}>
      {rows.length === 0 ? (
        <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--fg-muted)' }}>
          <i data-lucide="file-search" style={{ width: 22, height: 22, strokeWidth: 1.5 }}></i>
          <div style={{ marginTop: 8, fontSize: 13 }}>No files match the current filters and search.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${minW}px, 1fr))`,
          gap: compact ? 12 : 16, padding: compact ? 14 : 20, alignContent: 'start' }}>
          {rows.map(f => (
            <FSGalleryCard key={f.id} file={f} selected={f.id === selectedId} onSelect={onSelect}
              activeFilterKeys={activeFilterKeys} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FilesGallery });
