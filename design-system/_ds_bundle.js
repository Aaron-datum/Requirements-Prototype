/* @ds-bundle: {"format":4,"namespace":"DatumUIV1DesignSystem_8982b9","components":[],"sourceHashes":{"preview/colresize.js":"940799a4f4ff","ui_kits/datum/datumNav.jsx":"a6377058f007","ui_kits/datum/fileTreePanel.jsx":"53fb1e6fab8f","ui_kits/datum/previewPanel.jsx":"aa3507d8f465","ui_kits/datum/primitives.jsx":"9b02124549b5","ui_kits/datum/requirementsPanel.jsx":"42f8c8c92c15","ui_kits/datum/resultsTable.jsx":"6604c44d668f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DatumUIV1DesignSystem_8982b9 = window.DatumUIV1DesignSystem_8982b9 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// preview/colresize.js
try { (() => {
/* colresize.js — dynamic column resizing for design-system data tables.
   Auto-inits every <table> inside a [data-resizable] scope (or the whole doc).
   Each header cell gets a drag handle on its right edge. Widths are locked with
   table-layout:fixed so a drag adjusts only that column. */
(function () {
  var MIN = 56; // px — smallest a column may shrink to

  function injectStyles() {
    if (document.getElementById('colresize-styles')) return;
    var css = document.createElement('style');
    css.id = 'colresize-styles';
    css.textContent = ['table[data-colresize] thead th { position: relative; }', '.col-resizer { position: absolute; top: 0; right: -3px; height: 100%; width: 8px;', '  cursor: col-resize; user-select: none; touch-action: none; z-index: 3; }', '.col-resizer::after { content: ""; position: absolute; top: 22%; bottom: 22%; left: 3px;', '  width: 2px; border-radius: 2px; background: transparent; transition: background 120ms ease; }', '.col-resizer:hover::after, .col-resizer.dragging::after { background: var(--accent, #2f6fd8); }', 'body.col-resizing { cursor: col-resize !important; }', 'body.col-resizing * { cursor: col-resize !important; user-select: none !important; }'].join('\n');
    document.head.appendChild(css);
  }
  function initTable(table) {
    if (table.dataset.colresizeReady) return;
    var headRow = table.querySelector('thead tr');
    if (!headRow) return;
    var ths = Array.prototype.slice.call(headRow.children);
    if (ths.length < 2) return;

    // Lock in the current rendered widths before switching to fixed layout.
    var widths = ths.map(function (th) {
      return th.getBoundingClientRect().width;
    });
    table.style.tableLayout = 'fixed';
    table.style.width = table.getBoundingClientRect().width + 'px';
    ths.forEach(function (th, i) {
      th.style.width = Math.round(widths[i]) + 'px';
    });
    ths.forEach(function (th, i) {
      if (i === ths.length - 1) return; // dragging the last edge just grows the table — skip
      var handle = document.createElement('div');
      handle.className = 'col-resizer';
      handle.setAttribute('aria-hidden', 'true');
      th.appendChild(handle);
      var startX = 0,
        startW = 0;
      function onMove(ev) {
        var x = ev.touches ? ev.touches[0].clientX : ev.clientX;
        var w = Math.max(MIN, startW + (x - startX));
        th.style.width = w + 'px';
      }
      function onUp() {
        handle.classList.remove('dragging');
        document.body.classList.remove('col-resizing');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      }
      function onDown(ev) {
        ev.preventDefault();
        ev.stopPropagation(); // don't trigger header sort
        startX = ev.touches ? ev.touches[0].clientX : ev.clientX;
        startW = th.getBoundingClientRect().width;
        handle.classList.add('dragging');
        document.body.classList.add('col-resizing');
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, {
          passive: false
        });
        document.addEventListener('touchend', onUp);
      }
      handle.addEventListener('mousedown', onDown);
      handle.addEventListener('touchstart', onDown, {
        passive: false
      });
      // clicks on the handle should never bubble to a sortable header
      handle.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });
    table.dataset.colresize = 'on';
    table.dataset.colresizeReady = '1';
  }
  function init() {
    injectStyles();
    var scopes = document.querySelectorAll('[data-resizable]');
    var tables;
    if (scopes.length) {
      tables = [];
      scopes.forEach(function (s) {
        if (s.tagName === 'TABLE') tables.push(s);else Array.prototype.push.apply(tables, s.querySelectorAll('table'));
      });
    } else {
      tables = Array.prototype.slice.call(document.querySelectorAll('table'));
    }
    tables.forEach(initTable);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.DatumColResize = {
    init: init,
    initTable: initTable
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "preview/colresize.js", error: String((e && e.message) || e) }); }

// ui_kits/datum/datumNav.jsx
try { (() => {
// DatumNav.jsx — top navigation bar (48px, logo + blue-accent tabs + user menu)
function DatumNav({
  activeTab = 'files'
}) {
  const tabs = [{
    id: 'files',
    label: 'Files',
    icon: 'file-text'
  }, {
    id: 'upload',
    label: 'Upload',
    icon: 'upload'
  }, {
    id: 'saved',
    label: 'Saved Searches',
    icon: 'bookmark'
  }];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 48,
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      padding: '0 16px',
      flexShrink: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/datum-icon-transparent.png",
    alt: "",
    style: {
      height: 22,
      width: 'auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 15px/20px "DM Sans", sans-serif',
      color: 'var(--fg-primary)'
    }
  }, "Datum")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 18,
      flex: 1
    }
  }, tabs.map(t => {
    const active = activeTab === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      style: {
        height: 48,
        padding: '0 2px',
        border: 0,
        background: 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: active ? 'var(--accent)' : 'var(--fg-secondary)',
        font: `${active ? 500 : 400} 13px/16px "DM Sans", sans-serif`,
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'color 150ms ease, border-color 150ms ease'
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": t.icon,
      style: {
        width: 14,
        height: 14,
        strokeWidth: 1.75
      }
    }), t.label);
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      height: 28,
      padding: '0 8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'transparent',
      border: 0,
      color: 'var(--fg-secondary)',
      font: '400 13px/16px "DM Sans", sans-serif',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "message-square",
    style: {
      width: 14,
      height: 14,
      strokeWidth: 1.75
    }
  }), "Feedback"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--fg-secondary)',
      font: '400 13px/16px "DM Sans", sans-serif'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "user",
    style: {
      width: 14,
      height: 14,
      strokeWidth: 1.75
    }
  }), "aaron@datum.co"));
}
window.DatumNav = DatumNav;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/datum/datumNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/datum/fileTreePanel.jsx
try { (() => {
// FileTreePanel.jsx — left panel: selected-file card + assembly tree (flat, cohesive)
function FileTreePanel({
  datums
}) {
  const [expanded, setExpanded] = React.useState({
    'models': true,
    '7100490': true
  });
  const toggle = id => setExpanded({
    ...expanded,
    [id]: !expanded[id]
  });
  const tree = [{
    id: 'models',
    name: 'Models',
    children: [{
      id: '7100490',
      name: '7100490_0000_AB_ASM FOAM RSB 40',
      selected: true,
      children: [{
        id: '7100490_DEF',
        name: '7100490_0000_AB_ASM Foam RSB 40_DEF'
      }]
    }]
  }];
  const renderNode = (n, depth = 0) => /*#__PURE__*/React.createElement("div", {
    key: n.id
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => n.children && toggle(n.id),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 6px',
      paddingLeft: 6 + depth * 14,
      cursor: 'pointer',
      font: '400 12px/16px "DM Sans", sans-serif',
      color: TEXT,
      background: n.selected ? 'var(--accent)' : 'transparent',
      color: n.selected ? 'var(--btn-primary-fg)' : 'var(--fg-primary)',
      borderRadius: 3,
      transition: 'background-color 150ms ease'
    },
    onMouseEnter: e => {
      if (!n.selected) e.currentTarget.style.background = 'var(--fill-hover)';
    },
    onMouseLeave: e => {
      if (!n.selected) e.currentTarget.style.background = 'transparent';
    }
  }, n.children ? /*#__PURE__*/React.createElement("i", {
    "data-lucide": expanded[n.id] ? 'chevron-down' : 'chevron-right',
    style: {
      width: 12,
      height: 12,
      strokeWidth: 1.75,
      flexShrink: 0
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, n.name)), n.children && expanded[n.id] && n.children.map(c => renderNode(c, depth + 1)));
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 280,
      flexShrink: 0,
      background: BG_CARD,
      borderRight: `1px solid ${BORDER}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderBottom: `1px solid ${BORDER}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      flexShrink: 0,
      borderRadius: 5,
      background: DATUM_BLUE_TINT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: DATUM_BLUE
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "file-text",
    style: {
      width: 14,
      height: 14,
      strokeWidth: 1.75
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px/16px "DM Sans", sans-serif',
      color: TEXT,
      wordBreak: 'break-word'
    }
  }, "7100490_0000_AB_ASM FOAM RSB 40.CATPart"), /*#__PURE__*/React.createElement(DMono, {
    style: {
      color: TEXT_MUTED,
      fontSize: 11,
      marginTop: 2,
      display: 'block'
    }
  }, "3D CAD (CATPART)"))), /*#__PURE__*/React.createElement("dl", {
    style: {
      margin: '10px 0 0 0',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      rowGap: 3,
      columnGap: 10,
      font: '400 11px/14px "DM Sans", sans-serif'
    }
  }, [['Source', 'Teamcenter'], ['Created by', 'Aclient'], ['Created', 'Apr 17, 2025 at 2:37 PM EDT'], ['Size', '16.0 MB']].map(([k, v]) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      color: TEXT_MUTED,
      margin: 0
    }
  }, k), /*#__PURE__*/React.createElement("dd", {
    style: {
      color: TEXT_SECONDARY,
      margin: 0
    }
  }, v))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 14
    }
  }, /*#__PURE__*/React.createElement(DLabelCaps, null, "Assembly tree"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginBottom: 8,
      font: '400 11px/14px "DM Sans", sans-serif'
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      background: 'none',
      border: 0,
      color: DATUM_BLUE,
      padding: 0,
      cursor: 'pointer',
      font: 'inherit'
    }
  }, "Expand all"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: 'none',
      border: 0,
      color: DATUM_BLUE,
      padding: 0,
      cursor: 'pointer',
      font: 'inherit'
    }
  }, "Collapse all")), tree.map(n => renderNode(n))));
}
window.FileTreePanel = FileTreePanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/datum/fileTreePanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/datum/previewPanel.jsx
try { (() => {
// PreviewPanel.jsx — center: 3D model area with viewport toolbar (flat, no step header chrome)
function PreviewPanel({
  model = 0
}) {
  const imgs = ['cad-preview-1.png', 'cad-preview-2.png', 'cad-preview-3.png', 'cad-preview-4.png', 'cad-preview-5.png'];
  const [mode, setMode] = React.useState('Wireframe');
  return /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      background: BG_CARD,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      borderBottom: `1px solid ${BORDER}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: TEXT,
      font: '400 12px/16px "DM Sans", sans-serif'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "file-text",
    style: {
      width: 13,
      height: 13,
      strokeWidth: 1.75,
      color: TEXT_MUTED
    }
  }), "7100490_0000_AB_ASM FOAM RSB 40"), /*#__PURE__*/React.createElement(DIconButton, {
    icon: "maximize-2",
    label: "Expand"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '8px 14px',
      borderBottom: `1px solid ${BORDER}`
    }
  }, ['Shaded', 'Wireframe', 'X-Ray', 'Hidden Line'].map(m => /*#__PURE__*/React.createElement("button", {
    key: m,
    onClick: () => setMode(m),
    style: {
      height: 24,
      padding: '0 10px',
      borderRadius: 5,
      border: 0,
      background: mode === m ? DATUM_BLUE_TINT : 'transparent',
      color: mode === m ? DATUM_BLUE : TEXT_SECONDARY,
      font: `${mode === m ? 500 : 400} 12px/16px "DM Sans", sans-serif`,
      cursor: 'pointer',
      transition: 'background-color 150ms ease'
    }
  }, m)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 14,
      background: BORDER,
      margin: '0 6px'
    }
  }), ['move', 'home', 'maximize', 'camera', 'tag', 'trending-up'].map(i => /*#__PURE__*/React.createElement(DIconButton, {
    key: i,
    icon: i,
    label: i,
    size: 24
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '4px 10px',
      borderBottom: `1px solid ${BORDER}`
    }
  }, ['plus-circle', 'trending-up', 'move-horizontal'].map(i => /*#__PURE__*/React.createElement(DIconButton, {
    key: i,
    icon: i,
    label: i,
    size: 22
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--bg-subtle)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: `../../assets/${imgs[model % imgs.length]}`,
    alt: "",
    style: {
      maxWidth: '70%',
      maxHeight: '78%',
      filter: 'sepia(1) hue-rotate(10deg) saturate(5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 48,
      right: 32,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 8px',
      background: 'var(--bg-card)',
      border: `1px solid ${BORDER_STRONG}`,
      borderRadius: 5,
      font: '500 11px/14px "DM Sans", sans-serif',
      color: TEXT,
      boxShadow: 'none'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "box",
    style: {
      width: 12,
      height: 12,
      strokeWidth: 1.75
    }
  }), " LEFT"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '48%',
      top: '44%'
    }
  }, /*#__PURE__*/React.createElement(DMono, {
    style: {
      background: 'var(--bg-card)',
      border: `1px solid ${BORDER}`,
      padding: '1px 4px',
      borderRadius: 3,
      fontSize: 10
    }
  }, "52.40 mm")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 18,
      bottom: 18,
      font: '400 10px/12px "DM Mono", monospace',
      color: TEXT_SECONDARY
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "52",
    height: "52",
    viewBox: "0 0 52 52",
    fill: "none"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "26",
    y1: "26",
    x2: "26",
    y2: "6",
    stroke: "#1A6B3A",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "26",
    y1: "26",
    x2: "46",
    y2: "26",
    stroke: "#C0392B",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "26",
    y1: "26",
    x2: "12",
    y2: "40",
    stroke: DATUM_BLUE,
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("text", {
    x: "26",
    y: "4",
    fontSize: "9",
    fill: TEXT_SECONDARY,
    textAnchor: "middle"
  }, "z"), /*#__PURE__*/React.createElement("text", {
    x: "50",
    y: "29",
    fontSize: "9",
    fill: TEXT_SECONDARY
  }, "x"), /*#__PURE__*/React.createElement("text", {
    x: "6",
    y: "44",
    fontSize: "9",
    fill: TEXT_SECONDARY
  }, "y")))));
}
window.PreviewPanel = PreviewPanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/datum/previewPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/datum/primitives.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Primitives.jsx — Theme-aware via CSS vars. Works in white / tan / dark modes.

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function DButton({
  variant = 'primary',
  children,
  onClick,
  disabled,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const base = {
    height: 32,
    padding: '0 14px',
    borderRadius: 5,
    font: '500 13px/16px "DM Sans", sans-serif',
    border: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background-color 150ms ease, opacity 150ms ease, border-color 150ms ease',
    whiteSpace: 'nowrap'
  };
  const variants = {
    primary: {
      background: 'var(--btn-primary-bg)',
      color: 'var(--btn-primary-fg)'
    },
    secondary: {
      background: 'var(--bg-card)',
      color: 'var(--fg-primary)',
      border: '1px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--accent)'
    },
    destructive: {
      background: 'transparent',
      color: 'var(--danger)',
      border: '1px solid var(--danger)'
    }
  };
  const hoverBg = !disabled && hover ? {
    primary: {
      background: 'var(--accent-hover)'
    },
    secondary: {
      background: 'var(--fill-hover)'
    },
    ghost: {
      background: 'var(--accent-tint)'
    },
    destructive: {
      background: '#FAE5E3'
    }
  }[variant] : {};
  const dis = disabled ? {
    opacity: 0.45
  } : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...variants[variant],
      ...hoverBg,
      ...dis,
      ...style
    }
  }, rest), children);
}
function DIconButton({
  icon,
  label,
  onClick,
  danger,
  size = 24
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    "aria-label": label,
    title: label,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: size,
      height: size,
      border: 0,
      borderRadius: 5,
      background: hover ? 'var(--fill-hover)' : 'transparent',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: danger ? 'var(--danger)' : 'var(--fg-secondary)',
      cursor: 'pointer',
      transition: 'background-color 150ms ease'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": icon,
    style: {
      width: 14,
      height: 14,
      strokeWidth: 1.75
    }
  }));
}
function DBadge({
  tone = 'type',
  children
}) {
  const tones = {
    type: {
      color: 'var(--fg-primary)',
      background: 'var(--bg-subtle)',
      border: '1px solid var(--border-default)'
    },
    pass: {
      color: '#1A6B3A',
      background: '#E6F4EC'
    },
    warn: {
      color: '#7A4F00',
      background: '#FFF3CD'
    },
    fail: {
      color: '#A8200D',
      background: '#FAE5E3'
    },
    info: {
      color: 'var(--accent)',
      background: 'var(--accent-tint)'
    },
    count: {
      color: 'var(--accent)',
      background: 'var(--accent-tint)',
      border: '1px solid var(--accent-tint)'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '1px 6px',
      borderRadius: 5,
      font: '500 11px/14px "DM Sans", sans-serif',
      whiteSpace: 'nowrap',
      ...tones[tone]
    }
  }, children);
}
function DLabelCaps({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 11px/14px "DM Sans", sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
      color: 'var(--fg-muted)',
      marginBottom: 6
    }
  }, children);
}
function DMono({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px/16px "DM Mono", monospace',
      color: 'var(--fg-primary)',
      ...style
    }
  }, children);
}
function DInput({
  label,
  value,
  onChange,
  placeholder,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '400 11px/14px "DM Sans", sans-serif',
      color: 'var(--fg-secondary)',
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    value: value || '',
    onChange: onChange,
    placeholder: placeholder,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      height: 28,
      width: '100%',
      padding: '0 10px',
      background: 'var(--bg-card)',
      border: `1px solid ${focus ? 'var(--border-focus)' : 'var(--border-strong)'}`,
      borderRadius: 5,
      font: '400 13px/16px "DM Sans", sans-serif',
      color: 'var(--fg-primary)',
      outline: focus ? '1.5px solid var(--border-focus)' : 'none',
      outlineOffset: 1,
      boxSizing: 'border-box',
      transition: 'border-color 150ms ease',
      ...style
    }
  }, rest)));
}

// Back-compat constants (some panels may import them — resolve to CSS var refs)
const DATUM_BLUE = 'var(--accent)';
const DATUM_BLUE_HOVER = 'var(--accent-hover)';
const DATUM_BLUE_TINT = 'var(--accent-tint)';
const BORDER = 'var(--border-default)';
const BORDER_STRONG = 'var(--border-strong)';
const TEXT = 'var(--fg-primary)';
const TEXT_MUTED = 'var(--fg-muted)';
const TEXT_SECONDARY = 'var(--fg-secondary)';
const BG = 'var(--bg-page)';
const BG_CARD = 'var(--bg-card)';
Object.assign(window, {
  DButton,
  DIconButton,
  DBadge,
  DLabelCaps,
  DMono,
  DInput,
  DATUM_BLUE,
  DATUM_BLUE_HOVER,
  DATUM_BLUE_TINT,
  BORDER,
  BORDER_STRONG,
  TEXT,
  TEXT_MUTED,
  TEXT_SECONDARY,
  BG,
  BG_CARD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/datum/primitives.jsx", error: String((e && e.message) || e) }); }

// ui_kits/datum/requirementsPanel.jsx
try { (() => {
// RequirementsPanel.jsx — right panel: Requirements/Measurements tabs + list
function RequirementsPanel({
  requirements,
  onAdd,
  onClear,
  onDelete
}) {
  const [tab, setTab] = React.useState('req');
  const [expanded, setExpanded] = React.useState({});
  const toggle = id => setExpanded({
    ...expanded,
    [id]: !expanded[id]
  });
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 320,
      flexShrink: 0,
      background: BG_CARD,
      borderLeft: `1px solid ${BORDER}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      padding: '8px 14px 0',
      borderBottom: `1px solid ${BORDER}`
    }
  }, [['req', 'Requirements', requirements.length], ['meas', 'Measurements', 1]].map(([k, l, n]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      height: 36,
      border: 0,
      background: 'transparent',
      padding: '0 2px',
      color: tab === k ? DATUM_BLUE : TEXT_SECONDARY,
      font: `${tab === k ? 500 : 400} 13px/16px "DM Sans", sans-serif`,
      borderBottom: tab === k ? `2px solid ${DATUM_BLUE}` : '2px solid transparent',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, l, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: tab === k ? DATUM_BLUE : TEXT_MUTED
    }
  }, "(", n, ")")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderBottom: `1px solid ${BORDER}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px/16px "DM Sans", sans-serif',
      color: TEXT
    }
  }, "Search Requirements"), /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    style: {
      background: 'none',
      border: 0,
      color: DATUM_BLUE,
      padding: 0,
      cursor: 'pointer',
      font: '400 12px/16px "DM Sans", sans-serif'
    }
  }, "Clear")), /*#__PURE__*/React.createElement(DButton, {
    variant: "primary",
    style: {
      justifyContent: 'center',
      width: '100%',
      height: 34
    },
    onClick: onAdd
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus",
    style: {
      width: 14,
      height: 14,
      strokeWidth: 1.75
    }
  }), " Add Requirement"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/14px "DM Sans", sans-serif',
      color: TEXT_MUTED
    }
  }, "Select a face for geometric requirements.")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, requirements.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      padding: '10px 0',
      borderBottom: i < requirements.length - 1 ? `1px solid ${BORDER}` : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer'
    },
    onClick: () => toggle(r.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 13px/16px "DM Sans", sans-serif',
      color: TEXT
    }
  }, r.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/14px "DM Sans", sans-serif',
      color: TEXT_MUTED,
      marginTop: 2
    }
  }, r.subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      alignItems: 'center'
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement(DIconButton, {
    icon: "edit-2",
    label: "Edit"
  }), /*#__PURE__*/React.createElement(DIconButton, {
    icon: "trash-2",
    label: "Delete",
    danger: true,
    onClick: () => onDelete(r.id)
  }), /*#__PURE__*/React.createElement("i", {
    "data-lucide": expanded[r.id] ? 'chevron-up' : 'chevron-down',
    style: {
      width: 14,
      height: 14,
      strokeWidth: 1.75,
      color: TEXT_MUTED,
      marginLeft: 4
    }
  }))), expanded[r.id] && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: 10,
      background: 'var(--bg-subtle)',
      borderRadius: 5,
      font: '400 11px/16px "DM Sans", sans-serif',
      color: TEXT_SECONDARY
    }
  }, r.detail)))));
}
window.RequirementsPanel = RequirementsPanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/datum/requirementsPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/datum/resultsTable.jsx
try { (() => {
// ResultsTable.jsx — dense results table with status badges
function ResultsTable({
  rows
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      background: '#FAF5F3'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      font: '400 11px/16.5px "DM Sans", sans-serif'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['Part ID', 'File', 'Inlet Ø', 'T3 pos', 'Material', 'Match'].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      background: '#E0D6D1',
      padding: '8px 12px',
      textAlign: i === 2 || i === 3 ? 'right' : 'left',
      font: '500 13px/20px "DM Sans", sans-serif',
      color: '#211F1F',
      borderBottom: '1px solid #C0B5B0',
      position: 'sticky',
      top: 0
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.id,
    style: {
      cursor: 'pointer'
    },
    onMouseEnter: e => e.currentTarget.style.background = '#C0DDF0',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '6px 12px',
      borderBottom: '1px solid #E0D6D1'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/16px "DM Sans", sans-serif'
    }
  }, r.partId)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '6px 12px',
      borderBottom: '1px solid #E0D6D1',
      color: '#4A4E57'
    }
  }, /*#__PURE__*/React.createElement(DMono, {
    style: {
      color: '#4A4E57'
    }
  }, r.file)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '6px 12px',
      textAlign: 'right',
      borderBottom: '1px solid #E0D6D1'
    }
  }, /*#__PURE__*/React.createElement(DMono, null, r.inlet)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '6px 12px',
      textAlign: 'right',
      borderBottom: '1px solid #E0D6D1'
    }
  }, /*#__PURE__*/React.createElement(DMono, null, r.t3)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '6px 12px',
      borderBottom: '1px solid #E0D6D1',
      color: '#4A4E57'
    }
  }, r.material), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '6px 12px',
      borderBottom: '1px solid #E0D6D1'
    }
  }, /*#__PURE__*/React.createElement(DBadge, {
    tone: r.status
  }, r.statusLabel)))))));
}
window.ResultsTable = ResultsTable;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/datum/resultsTable.jsx", error: String((e && e.message) || e) }); }

})();
