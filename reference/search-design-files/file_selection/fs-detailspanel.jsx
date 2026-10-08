// fs-detailspanel.jsx — right slide-in panel: large thumbnail, metadata, PLM data, Search CTA

function FSMetaRow({ label, value, mono }) {
  return (
    <React.Fragment>
      <dt style={{ color: 'var(--fg-muted)', margin: 0, fontSize: 11, lineHeight: '18px' }}>{label}</dt>
      <dd style={{ color: 'var(--fg-secondary)', margin: 0, fontSize: 11, lineHeight: '18px',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', textAlign: 'right' }}>{value}</dd>
    </React.Fragment>
  );
}

function FSSectionLabel({ children, style }) {
  return <div style={{ font: '500 11px/14px "DM Sans", sans-serif', textTransform: 'uppercase',
    letterSpacing: '.4px', color: 'var(--fg-muted)', marginBottom: 8, ...style }}>{children}</div>;
}

function FileDetailsPanel({ file, width, onClose, onSearch, activeFilterKeys, density }) {
  const open = !!file;
  const compact = density === 'compact';

  // PLM fields to always show in the PLM section
  const plmKeys = ['program', 'modelYear', 'programType', 'customerGroup', 'region',
    'productGroup', 'productLine', 'calcWeight', 'releaseStatus', 'lifecycleState', 'releasedDate'];

  return (
    <aside style={{ width: open ? width : 0, flexShrink: 0, background: 'var(--bg-sidebar)',
      borderLeft: open ? '1px solid var(--border-default)' : '0px solid transparent',
      height: '100%', overflow: 'hidden', transition: 'width 220ms ease',
      display: 'flex', flexDirection: 'column' }}>
      <div style={{ width, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px 0 16px', borderBottom: '1px solid var(--border-default)' }}>
          <span style={{ font: '500 13px/16px "DM Sans", sans-serif', color: 'var(--fg-primary)' }}>File details</span>
          <FSIconButton icon="x" label="Close details" onClick={onClose} />
        </div>

        {/* Scroll body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {file && (
            <React.Fragment>
              {/* Large thumbnail */}
              <div style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: 5, background: '#FFFFFF',
                border: '1px solid var(--border-default)', overflow: 'hidden', position: 'relative' }}>
                <img src={`assets/cad-preview-${((file.thumb - 1) % 5) + 1}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', left: 10, bottom: 10 }}>
                  <FSBadge tone="type"><i data-lucide="box" style={{ width: 11, height: 11, strokeWidth: 1.75, marginRight: 4 }}></i>3D CAD</FSBadge>
                </div>
              </div>

              {/* File name */}
              <div>
                <div style={{ font: '500 13px/18px "DM Mono", monospace', color: 'var(--fg-primary)', wordBreak: 'break-all' }}>{file.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <FSBadge tone={FS_STATUS_TONE[file.releaseStatus] || 'type'}>{file.releaseStatus}</FSBadge>
                  <FSMono style={{ color: 'var(--fg-muted)' }}>{file.size}</FSMono>
                </div>
              </div>

              {/* File metadata */}
              <div>
                <FSSectionLabel>File</FSSectionLabel>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 3, columnGap: 12 }}>
                  <FSMetaRow label="Size" value={file.size} mono />
                  <FSMetaRow label="Source" value={file.source} />
                  <FSMetaRow label="Modified" value={file.modified} />
                  <FSMetaRow label="Created" value={file.created} />
                  <FSMetaRow label="Synced" value={file.synced} />
                </dl>
              </div>

              {/* Active filter values */}
              {activeFilterKeys.length > 0 && (
                <div>
                  <FSSectionLabel style={{ color: 'var(--accent)' }}>Active filters</FSSectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeFilterKeys.map(k => {
                      const m = FS_FIELDS[k];
                      const v = file[m.prop];
                      const val = m.kind === 'range-units' ? `${v} ${m.unit}` : v;
                      const tone = FS_STATUS_TONE[v];
                      return (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                          padding: '6px 10px', background: 'var(--accent-tint)', borderRadius: 5 }}>
                          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>{m.label}</span>
                          {tone ? <FSBadge tone={tone}>{val}</FSBadge>
                            : <span style={{ fontSize: 11, color: 'var(--fg-primary)', fontFamily: m.kind === 'range-units' ? 'var(--font-mono)' : 'var(--font-sans)' }}>{val}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PLM data */}
              <div>
                <FSSectionLabel>PLM data</FSSectionLabel>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 3, columnGap: 12 }}>
                  {plmKeys.map(k => {
                    const m = FS_FIELDS[k];
                    const v = file[m.prop];
                    const val = m.kind === 'range-units' ? `${v} ${m.unit}` : v;
                    return <FSMetaRow key={k} label={m.label} value={val} mono={m.kind === 'range-units'} />;
                  })}
                </dl>
              </div>
            </React.Fragment>
          )}
        </div>

        {/* Footer — Search CTA */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-default)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FSButton variant="primary" density={density} onClick={onSearch} style={{ width: '100%', justifyContent: 'center', height: compact ? 34 : 38 }}>
            <i data-lucide="search" style={{ width: 14, height: 14, strokeWidth: 2 }}></i>
            Search from this file
          </FSButton>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center' }}>
            Builds a new requirement search using this file as the reference.
          </div>
        </div>
      </div>
    </aside>
  );
}

Object.assign(window, { FileDetailsPanel });
