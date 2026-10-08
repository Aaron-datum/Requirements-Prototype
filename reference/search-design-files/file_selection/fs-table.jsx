// fs-table.jsx — files results table. Default cols + active-filter cols (max 7 total).

const FS_MAX_COLS = 7;
const FS_DEFAULT_COLS = 4; // preview, name, modified, last synced

// Render the cell value for a filter-derived column
function fsFilterCell(file, key) {
  const m = FS_FIELDS[key];
  const v = file[m.prop];
  if (m.kind === 'range-units') return <FSMono>{v} {m.unit}</FSMono>;
  const tone = FS_STATUS_TONE[v];
  if ((m.kind === 'multi-tag') && tone) return <FSBadge tone={tone}>{v}</FSBadge>;
  return <span style={{ color: 'var(--fg-secondary)' }}>{v}</span>;
}

function FilesTable({ rows, activeFilterKeys, shownFilterKeys, selectedId, onSelect, density }) {
  const compact = density === 'compact';
  const cellPad = compact ? '5px 10px' : '9px 12px';
  const thumbSize = compact ? 26 : 40;
  const nameSize = compact ? 12 : 13;
  const rowFont = compact ? 11 : 12;

  const overflowCount = activeFilterKeys.length - shownFilterKeys.length;

  const th = (label, opts = {}) => (
    <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-subtle)',
      padding: cellPad, textAlign: opts.right ? 'right' : 'left', whiteSpace: 'nowrap',
      font: '500 12px/16px "DM Sans", sans-serif', color: 'var(--fg-secondary)',
      borderBottom: '1px solid var(--border-strong)', ...opts.style }}>{label}</th>
  );

  return (
    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-card)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 ${rowFont}px/16px "DM Sans", sans-serif` }}>
        <thead>
          <tr>
            {th('', { style: { width: thumbSize + 24 } })}
            {th('File name')}
            {shownFilterKeys.map(k => (
              <th key={k} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--accent-tint)',
                padding: cellPad, textAlign: 'left', whiteSpace: 'nowrap', font: '500 12px/16px "DM Sans", sans-serif',
                color: 'var(--accent)', borderBottom: '1px solid var(--border-strong)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i data-lucide="filter" style={{ width: 11, height: 11, strokeWidth: 2 }}></i>{FS_FIELDS[k].col}
                </span>
              </th>
            ))}
            {th('Modified', { style: { width: 116 } })}
            {th('Last synced', { style: { width: 108 } })}
          </tr>
        </thead>
        <tbody>
          {rows.map(f => {
            const sel = f.id === selectedId;
            return (
              <FilesRow key={f.id} file={f} selected={sel} onSelect={onSelect}
                shownFilterKeys={shownFilterKeys} cellPad={cellPad} thumbSize={thumbSize} nameSize={nameSize} />
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={FS_DEFAULT_COLS + shownFilterKeys.length} style={{ padding: '56px 16px', textAlign: 'center', color: 'var(--fg-muted)' }}>
              <i data-lucide="file-search" style={{ width: 22, height: 22, strokeWidth: 1.5 }}></i>
              <div style={{ marginTop: 8, fontSize: 13 }}>No files match the current filters and search.</div>
            </td></tr>
          )}
        </tbody>
      </table>
      {overflowCount > 0 && (
        <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--fg-muted)', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i data-lucide="info" style={{ width: 13, height: 13, strokeWidth: 1.75 }}></i>
          Showing {FS_DEFAULT_COLS + shownFilterKeys.length} of {FS_DEFAULT_COLS + activeFilterKeys.length} columns · {overflowCount} more filter{overflowCount > 1 ? 's' : ''} in the file details panel.
        </div>
      )}
    </div>
  );
}

function FilesRow({ file, selected, onSelect, shownFilterKeys, cellPad, thumbSize, nameSize }) {
  const [hover, setHover] = React.useState(false);
  const bg = selected ? 'var(--accent-tint)' : (hover ? 'var(--fill-hover)' : 'transparent');
  const td = (children, opts = {}) => (
    <td style={{ padding: cellPad, borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap',
      verticalAlign: 'middle', textAlign: opts.right ? 'right' : 'left', ...opts.style }}>{children}</td>
  );
  return (
    <tr onClick={() => onSelect(file.id)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: 'pointer', background: bg, transition: 'background-color 120ms ease' }}>
      <td style={{ padding: cellPad, borderBottom: '1px solid var(--border-default)',
        borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent' }}>
        <FSThumb index={file.thumb} size={thumbSize} />
      </td>
      {td(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span style={{ font: `500 ${nameSize}px/18px "DM Mono", monospace`, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
        </div>, { style: { maxWidth: 360 } }
      )}
      {shownFilterKeys.map(k => <React.Fragment key={k}>{td(fsFilterCell(file, k))}</React.Fragment>)}
      {td(<span style={{ color: 'var(--fg-secondary)' }}>{file.modified}</span>)}
      {td(<FSMono style={{ color: 'var(--fg-muted)' }}>{file.lastSynced}</FSMono>)}
    </tr>
  );
}

Object.assign(window, { FilesTable });
