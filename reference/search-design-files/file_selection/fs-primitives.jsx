// fs-primitives.jsx — shared UI atoms for the File Selection screens (white mode)

function FSButton({ variant = 'primary', children, onClick, disabled, style, title, density = 'comfortable', ...rest }) {
  const [hover, setHover] = React.useState(false);
  const h = density === 'compact' ? 28 : 32;
  const base = {
    height: h, padding: density === 'compact' ? '0 11px' : '0 14px', borderRadius: 5,
    font: '500 13px/16px "DM Sans", sans-serif', border: 0,
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center',
    gap: 6, transition: 'background-color 150ms ease, opacity 150ms ease', whiteSpace: 'nowrap',
  };
  const variants = {
    primary:   { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' },
    secondary: { background: 'var(--bg-card)', color: 'var(--fg-primary)', border: '1px solid var(--border-strong)' },
    ghost:     { background: 'transparent', color: 'var(--accent)' },
  };
  const hoverBg = !disabled && hover ? {
    primary:   { background: 'var(--accent-hover)' },
    secondary: { background: 'var(--fill-hover)' },
    ghost:     { background: 'var(--accent-tint)' },
  }[variant] : {};
  const dis = disabled ? { opacity: 0.38 } : {};
  return <button onClick={onClick} disabled={disabled} title={title}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...base, ...variants[variant], ...hoverBg, ...dis, ...style }} {...rest}>{children}</button>;
}

function FSIconButton({ icon, label, onClick, size = 24, active, style }) {
  const [hover, setHover] = React.useState(false);
  return <button onClick={onClick} aria-label={label} title={label}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{
      width: size, height: size, border: 0, borderRadius: 5,
      background: active ? 'var(--accent-tint)' : (hover ? 'var(--fill-hover)' : 'transparent'),
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: active ? 'var(--accent)' : 'var(--fg-secondary)', cursor: 'pointer',
      transition: 'background-color 150ms ease', flexShrink: 0, ...style,
    }}>
    <i data-lucide={icon} style={{ width: 14, height: 14, strokeWidth: 1.75 }}></i>
  </button>;
}

function FSBadge({ tone = 'type', children, style }) {
  const tones = {
    type:  { color: 'var(--fg-primary)', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' },
    pass:  { color: 'var(--status-pass-fg)', background: 'var(--status-pass-bg)' },
    warn:  { color: 'var(--status-warn-fg)', background: 'var(--status-warn-bg)' },
    fail:  { color: 'var(--status-fail-fg)', background: 'var(--status-fail-bg)' },
    info:  { color: 'var(--accent)', background: 'var(--accent-tint)' },
    count: { color: 'var(--accent)', background: 'var(--accent-tint)' },
  };
  return <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 5,
    font: '500 11px/16px "DM Sans", sans-serif', whiteSpace: 'nowrap', ...tones[tone], ...style,
  }}>{children}</span>;
}

function FSLabelCaps({ children, style }) {
  return <div style={{
    font: '500 11px/14px "DM Sans", sans-serif', textTransform: 'uppercase',
    letterSpacing: '0.4px', color: 'var(--fg-muted)', ...style,
  }}>{children}</div>;
}

function FSMono({ children, style }) {
  return <span style={{ font: '400 11px/16px "DM Mono", monospace', color: 'var(--fg-primary)', ...style }}>{children}</span>;
}

// Small thumbnail tile that renders a CAD render image
function FSThumb({ index, size = 40, radius = 5 }) {
  const src = `assets/cad-preview-${((index - 1) % 5) + 1}.png`;
  return <div style={{
    width: size, height: size, flexShrink: 0, borderRadius: radius,
    background: '#FFFFFF', border: '1px solid var(--border-default)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  }}>
    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>;
}

function FSCheck({ checked }) {
  return <span style={{
    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
    border: checked ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
    background: checked ? 'var(--accent)' : 'var(--bg-card)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
  </span>;
}

const FS = {
  BORDER: 'var(--border-default)', BORDER_STRONG: 'var(--border-strong)',
  TEXT: 'var(--fg-primary)', TEXT_SECONDARY: 'var(--fg-secondary)', TEXT_MUTED: 'var(--fg-muted)',
  CARD: 'var(--bg-card)', PAGE: 'var(--bg-page)', SUBTLE: 'var(--bg-subtle)',
  ACCENT: 'var(--accent)', TINT: 'var(--accent-tint)',
};

Object.assign(window, { FSButton, FSIconButton, FSBadge, FSLabelCaps, FSMono, FSThumb, FSCheck, FS });
