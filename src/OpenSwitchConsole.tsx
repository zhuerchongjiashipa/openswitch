import { CSSProperties, useEffect, useRef, useState } from 'react';
import {
  Credential,
  OS_ENVS,
  OS_ENVS_BY_ID,
  OS_POOL,
  OS_POOL_BY_ID,
  OS_TOKENS,
  OS_TOOLS,
  OS_TOOLS_BY_ID,
  ToolId,
  osCredsForTool,
  osFmtDate,
} from './data';

type Density = 'compact' | 'comfortable';

const styles = {
  root: {
    width: '100%',
    minHeight: '100vh',
    background: OS_TOKENS.bg,
    color: OS_TOKENS.ink,
    fontFamily: OS_TOKENS.sans,
    fontSize: 13,
    lineHeight: 1.45,
    letterSpacing: '-0.005em',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  } satisfies CSSProperties,

  topbar: {
    height: 52,
    flexShrink: 0,
    borderBottom: `1px solid ${OS_TOKENS.line}`,
    background: OS_TOKENS.surface,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 14,
  } satisfies CSSProperties,

  wsBtn: (open: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '6px 8px 6px 6px',
    borderRadius: 7,
    border: `1px solid ${open ? OS_TOKENS.lineSoft : 'transparent'}`,
    background: open ? OS_TOKENS.sunken : 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: OS_TOKENS.ink,
    fontSize: 13,
    transition: 'background .12s, border-color .12s',
  }),

  wsAvatar: {
    width: 22,
    height: 22,
    borderRadius: 5,
    background: OS_TOKENS.ink,
    color: OS_TOKENS.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  } satisfies CSSProperties,

  wsName: { fontWeight: 500, letterSpacing: '-0.005em' } satisfies CSSProperties,
  wsChevron: { color: OS_TOKENS.inkMute, fontSize: 10, marginLeft: 2 } satisfies CSSProperties,
  wsDivider: { width: 1, height: 20, background: OS_TOKENS.line } satisfies CSSProperties,

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12.5,
    color: OS_TOKENS.inkMute,
    letterSpacing: '-0.005em',
  } satisfies CSSProperties,
  brandLogo: {
    width: 14,
    height: 14,
    borderRadius: 3,
    background: OS_TOKENS.ink,
    position: 'relative',
  } satisfies CSSProperties,
  brandLogoInner: {
    position: 'absolute',
    inset: 3,
    background: OS_TOKENS.bg,
    borderRadius: 1,
  } satisfies CSSProperties,

  search: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    background: OS_TOKENS.sunken,
    border: `1px solid ${OS_TOKENS.lineSoft}`,
    borderRadius: 7,
    fontSize: 12.5,
    color: OS_TOKENS.inkMute,
    minWidth: 260,
    cursor: 'text',
  } satisfies CSSProperties,

  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 17,
    height: 17,
    padding: '0 4px',
    borderRadius: 3,
    background: OS_TOKENS.surface,
    border: `1px solid ${OS_TOKENS.line}`,
    fontSize: 10,
    color: OS_TOKENS.inkSoft,
    fontFamily: OS_TOKENS.mono,
    marginLeft: 2,
  } satisfies CSSProperties,

  topBtn: {
    height: 30,
    padding: '0 12px',
    borderRadius: 6,
    border: `1px solid ${OS_TOKENS.line}`,
    background: OS_TOKENS.surface,
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 500,
    color: OS_TOKENS.ink,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } satisfies CSSProperties,

  wsMenu: {
    position: 'absolute',
    top: 52,
    left: 12,
    zIndex: 30,
    minWidth: 280,
    background: OS_TOKENS.surface,
    border: `1px solid ${OS_TOKENS.line}`,
    borderRadius: 10,
    boxShadow:
      '0 12px 40px -8px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.04)',
    padding: 6,
  } satisfies CSSProperties,
  wsMenuLabel: {
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: OS_TOKENS.inkMute,
    padding: '8px 10px 4px',
  } satisfies CSSProperties,
  wsMenuItem: (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    background: active ? OS_TOKENS.sunken : 'transparent',
  }),
  wsMenuSub: { fontSize: 11.5, color: OS_TOKENS.inkMute } satisfies CSSProperties,
  wsMenuCheck: {
    marginLeft: 'auto',
    color: OS_TOKENS.accent,
    fontSize: 13,
  } satisfies CSSProperties,
  wsMenuSep: {
    height: 1,
    background: OS_TOKENS.line,
    margin: '6px 0',
  } satisfies CSSProperties,

  subbar: {
    flexShrink: 0,
    padding: '18px 24px 8px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: 16,
  } satisfies CSSProperties,
  envTitle: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.015em',
    margin: 0,
  } satisfies CSSProperties,
  envHint: {
    color: OS_TOKENS.inkMute,
    fontSize: 13,
    marginTop: 2,
  } satisfies CSSProperties,
  subMeta: {
    marginLeft: 'auto',
    fontSize: 11.5,
    color: OS_TOKENS.inkMute,
    fontFamily: OS_TOKENS.mono,
    display: 'flex',
    gap: 14,
    alignItems: 'center',
  } satisfies CSSProperties,

  cols: (density: Density): CSSProperties => ({
    flex: 1,
    display: 'grid',
    gridTemplateColumns: `repeat(${OS_TOOLS.length}, minmax(0, 1fr))`,
    gap: density === 'compact' ? 0 : 12,
    padding: density === 'compact' ? '8px 16px 24px' : '12px 20px 28px',
    minHeight: 0,
  }),
  col: (density: Density): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    background: OS_TOKENS.surface,
    border: `1px solid ${OS_TOKENS.line}`,
    borderRadius: density === 'compact' ? 0 : 10,
    overflow: 'hidden',
    minWidth: 0,
  }),
  colHead: {
    padding: '12px 14px 11px',
    borderBottom: `1px solid ${OS_TOKENS.lineSoft}`,
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  } satisfies CSSProperties,
  colGlyph: {
    width: 22,
    height: 22,
    borderRadius: 5,
    background: OS_TOKENS.sunken,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10.5,
    fontFamily: OS_TOKENS.mono,
    color: OS_TOKENS.inkSoft,
    fontWeight: 600,
  } satisfies CSSProperties,
  colName: {
    fontSize: 13.5,
    fontWeight: 600,
    letterSpacing: '-0.005em',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  colCli: {
    fontSize: 10.5,
    color: OS_TOKENS.inkMute,
    fontFamily: OS_TOKENS.mono,
  } satisfies CSSProperties,
  colMenu: {
    width: 22,
    height: 22,
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: OS_TOKENS.inkFaint,
    fontSize: 14,
  } satisfies CSSProperties,

  activeCard: (empty: boolean): CSSProperties => ({
    margin: 10,
    padding: '12px 12px 13px',
    borderRadius: 8,
    background: empty ? OS_TOKENS.sunken : OS_TOKENS.accentSoft,
    border: `1px solid ${empty ? OS_TOKENS.line : 'transparent'}`,
    position: 'relative',
  }),
  activeLabel: {
    fontSize: 9.5,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  } satisfies CSSProperties,
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: OS_TOKENS.accent,
  } satisfies CSSProperties,
  activeAlias: (empty: boolean): CSSProperties => ({
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.015em',
    color: empty ? OS_TOKENS.inkFaint : OS_TOKENS.ink,
    fontStyle: empty ? 'italic' : 'normal',
  }),
  activeMeta: {
    fontSize: 11,
    color: OS_TOKENS.inkMute,
    marginTop: 4,
    fontFamily: OS_TOKENS.mono,
  } satisfies CSSProperties,

  poolHead: {
    padding: '4px 16px 6px',
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: OS_TOKENS.inkMute,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies CSSProperties,
  poolList: {
    padding: '2px 10px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flex: 1,
    overflow: 'auto',
  } satisfies CSSProperties,
  chip: (isActive: boolean, hover: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 9px',
    borderRadius: 6,
    fontSize: 12.5,
    cursor: isActive ? 'default' : 'pointer',
    background: isActive
      ? 'transparent'
      : hover
        ? OS_TOKENS.sunken
        : 'transparent',
    color: isActive ? OS_TOKENS.inkFaint : OS_TOKENS.ink,
    transition: 'background .1s',
    border: '1px solid transparent',
    userSelect: 'none',
  }),
  chipDot: (used: boolean): CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: 999,
    flexShrink: 0,
    background: used ? OS_TOKENS.accent : OS_TOKENS.inkFaint,
    opacity: used ? 1 : 0.5,
  }),
  chipMeta: {
    marginLeft: 'auto',
    fontSize: 10,
    color: OS_TOKENS.inkMute,
    fontFamily: OS_TOKENS.mono,
    opacity: 0.8,
  } satisfies CSSProperties,
  addCred: {
    margin: '4px 10px 10px',
    padding: '7px 10px',
    border: `1px dashed ${OS_TOKENS.line}`,
    borderRadius: 6,
    fontSize: 11.5,
    color: OS_TOKENS.inkMute,
    cursor: 'pointer',
    background: 'transparent',
    fontFamily: 'inherit',
    textAlign: 'left',
  } satisfies CSSProperties,

  drawer: (open: boolean): CSSProperties => ({
    flexShrink: 0,
    borderTop: `1px solid ${OS_TOKENS.line}`,
    background: '#111111',
    color: '#e8e4dc',
    maxHeight: open ? 220 : 38,
    transition: 'max-height .2s cubic-bezier(.2,.7,.3,1)',
    overflow: 'hidden',
    fontFamily: OS_TOKENS.mono,
    fontSize: 12,
  }),
  drawerHead: {
    height: 38,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    borderBottom: `1px solid rgba(255,255,255,0.06)`,
  } satisfies CSSProperties,
  drawerLabel: {
    color: '#a8a198',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: OS_TOKENS.sans,
    fontWeight: 500,
  } satisfies CSSProperties,
  drawerLines: {
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  } satisfies CSSProperties,
  drawerLine: {
    display: 'flex',
    gap: 10,
    alignItems: 'baseline',
  } satisfies CSSProperties,
  drawerPrompt: { color: '#5b8a72', flexShrink: 0 } satisfies CSSProperties,
  drawerComment: { color: '#6b655c' } satisfies CSSProperties,

  tweaks: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex: 40,
    width: 280,
    background: OS_TOKENS.surface,
    border: `1px solid ${OS_TOKENS.line}`,
    borderRadius: 10,
    boxShadow: '0 12px 40px -8px rgba(0,0,0,0.15)',
    fontSize: 12.5,
  } satisfies CSSProperties,
  tweakHead: {
    padding: '10px 14px',
    borderBottom: `1px solid ${OS_TOKENS.lineSoft}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
  } satisfies CSSProperties,
  tweakBody: {
    padding: '10px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  } satisfies CSSProperties,
  tweakRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  } satisfies CSSProperties,
  tweakLabel: { color: OS_TOKENS.inkSoft } satisfies CSSProperties,
  seg: {
    display: 'inline-flex',
    background: OS_TOKENS.sunken,
    borderRadius: 6,
    padding: 2,
    border: `1px solid ${OS_TOKENS.lineSoft}`,
  } satisfies CSSProperties,
  segBtn: (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11.5,
    background: active ? OS_TOKENS.surface : 'transparent',
    border: `1px solid ${active ? OS_TOKENS.line : 'transparent'}`,
    color: active ? OS_TOKENS.ink : OS_TOKENS.inkMute,
    fontFamily: 'inherit',
    fontWeight: active ? 500 : 400,
  }),
  toggle: (on: boolean): CSSProperties => ({
    width: 28,
    height: 16,
    borderRadius: 999,
    padding: 2,
    cursor: 'pointer',
    background: on ? OS_TOKENS.accent : OS_TOKENS.inkFaint,
    transition: 'background .15s',
    position: 'relative',
    border: 'none',
  }),
  toggleKnob: (on: boolean): CSSProperties => ({
    width: 12,
    height: 12,
    borderRadius: 999,
    background: '#fff',
    transform: `translateX(${on ? 12 : 0}px)`,
    transition: 'transform .15s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  }),

  toast: {
    position: 'fixed',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    background: OS_TOKENS.ink,
    color: OS_TOKENS.bg,
    fontSize: 12.5,
    padding: '8px 14px',
    borderRadius: 999,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 50,
    fontFamily: OS_TOKENS.sans,
  } satisfies CSSProperties,
  toastDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: OS_TOKENS.ok,
  } satisfies CSSProperties,
};

type BindingsByEnv = Record<string, Record<string, string | undefined>>;

const INITIAL_BINDINGS: BindingsByEnv = Object.fromEntries(
  OS_ENVS.map((e) => [e.id, { ...e.bindings }]),
);

interface CliLine {
  prompt: string;
  text: string;
  comment?: boolean;
}

function cliCommandFor(tool: ToolId, cred: Credential): string {
  switch (tool) {
    case 'git':
      return `git config --global credential.helper "${cred.alias}"`;
    case 'wrangler':
      return `wrangler whoami --profile ${cred.alias}`;
    case 'codex':
      return `codex auth use ${cred.alias}`;
    case 'claude':
      return `claude auth use ${cred.alias}`;
    case 'npm':
      return `npm config set _authToken $(os-keyring get ${cred.alias})`;
    case 'aws':
      return `export AWS_PROFILE=${cred.alias}`;
    case 'docker':
      return `docker login --username ${cred.alias}`;
  }
}

export function OpenSwitchConsole() {
  const [activeEnv, setActiveEnv] = useState('personal');
  const [wsOpen, setWsOpen] = useState(false);
  const [bindings, setBindings] = useState<BindingsByEnv>(INITIAL_BINDINGS);
  const [toast, setToast] = useState<string | null>(null);
  const [hoverChip, setHoverChip] = useState<string | null>(null);

  const [density, setDensity] = useState<Density>('comfortable');
  const [cliOpen, setCliOpen] = useState(true);
  const [tweaksVisible, setTweaksVisible] = useState(false);

  const toastTimer = useRef<number | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode') setTweaksVisible(true);
      if (d.type === '__deactivate_edit_mode') setTweaksVisible(false);
    };
    window.addEventListener('message', onMsg);
    try {
      window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    } catch {
      /* noop */
    }
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const env = OS_ENVS_BY_ID[activeEnv];
  const envBindings = bindings[activeEnv];
  const boundCount = Object.values(envBindings).filter(Boolean).length;

  const activateCred = (toolId: ToolId, credId: string) => {
    setBindings((prev) => ({
      ...prev,
      [activeEnv]: { ...prev[activeEnv], [toolId]: credId },
    }));
    const cred = OS_POOL_BY_ID[credId];
    const tool = OS_TOOLS_BY_ID[toolId];
    showToast(`${tool.cli} → ${cred.alias}`);
  };

  const switchEnv = (envId: string) => {
    setActiveEnv(envId);
    setWsOpen(false);
    const e = OS_ENVS_BY_ID[envId];
    const n = Object.values(bindings[envId]).filter(Boolean).length;
    showToast(`Switched to ${e.name} · ${n} tools`);
  };

  const cliLines: CliLine[] = OS_TOOLS.map((t) => {
    const credId = envBindings[t.id];
    const cred = credId ? OS_POOL_BY_ID[credId] : null;
    if (!cred) {
      return { prompt: '#', text: `${t.cli} — unbound`, comment: true };
    }
    return { prompt: '$', text: cliCommandFor(t.id, cred) };
  });

  return (
    <div style={styles.root} onClick={() => setWsOpen(false)}>
      {/* Topbar */}
      <div style={styles.topbar} onClick={(e) => e.stopPropagation()}>
        <button style={styles.wsBtn(wsOpen)} onClick={() => setWsOpen((v) => !v)}>
          <span style={styles.wsAvatar}>{env.name[0]}</span>
          <span style={styles.wsName}>{env.name}</span>
          <span style={styles.wsChevron}>▾</span>
        </button>
        <span style={styles.wsDivider} />
        <div style={styles.brand}>
          <span style={styles.brandLogo}>
            <span style={styles.brandLogoInner} />
          </span>
          OpenSwitch
        </div>

        <div style={styles.search}>
          <span style={{ opacity: 0.6 }}>⌕</span>
          <span>Search credentials or tools</span>
          <span
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
          >
            <span style={styles.kbd}>⌘</span>
            <span style={styles.kbd}>K</span>
          </span>
        </div>
        <button style={styles.topBtn}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          Add credential
        </button>
      </div>

      {/* Workspace dropdown */}
      {wsOpen && (
        <div style={styles.wsMenu} onClick={(e) => e.stopPropagation()}>
          <div style={styles.wsMenuLabel}>Switch environment</div>
          {OS_ENVS.map((e) => {
            const isActive = e.id === activeEnv;
            const n = Object.values(bindings[e.id]).filter(Boolean).length;
            return (
              <div
                key={e.id}
                style={styles.wsMenuItem(isActive)}
                onClick={() => switchEnv(e.id)}
              >
                <span
                  style={{
                    ...styles.wsAvatar,
                    width: 20,
                    height: 20,
                    fontSize: 10,
                    background: isActive ? OS_TOKENS.accent : OS_TOKENS.sunken,
                    color: isActive ? '#fff' : OS_TOKENS.inkSoft,
                    border: isActive ? 'none' : `1px solid ${OS_TOKENS.line}`,
                  }}
                >
                  {e.name[0]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{e.name}</div>
                  <div style={styles.wsMenuSub}>
                    {e.hint} · {n} tools
                  </div>
                </div>
                {isActive && <span style={styles.wsMenuCheck}>✓</span>}
              </div>
            );
          })}
          <div style={styles.wsMenuSep} />
          <div
            style={{ ...styles.wsMenuItem(false), color: OS_TOKENS.inkSoft }}
          >
            <span
              style={{
                ...styles.wsAvatar,
                width: 20,
                height: 20,
                background: OS_TOKENS.sunken,
                color: OS_TOKENS.inkSoft,
                fontSize: 12,
              }}
            >
              +
            </span>
            <span>New environment…</span>
          </div>
          <div
            style={{ ...styles.wsMenuItem(false), color: OS_TOKENS.inkSoft }}
          >
            <span
              style={{
                ...styles.wsAvatar,
                width: 20,
                height: 20,
                background: OS_TOKENS.sunken,
                color: OS_TOKENS.inkSoft,
                fontSize: 11,
              }}
            >
              ⚙
            </span>
            <span>Manage environments</span>
          </div>
        </div>
      )}

      {/* Sub header */}
      <div style={styles.subbar}>
        <div>
          <h1 style={styles.envTitle}>{env.name}</h1>
          <div style={styles.envHint}>{env.hint}</div>
        </div>
        <div style={styles.subMeta}>
          <span>
            {boundCount}/{OS_TOOLS.length} tools bound
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{OS_POOL.length} credentials in pool</span>
        </div>
      </div>

      {/* Tool columns */}
      <div style={styles.cols(density)}>
        {OS_TOOLS.map((t) => {
          const creds = osCredsForTool(t.id);
          const activeCredId = envBindings[t.id];
          const activeCred = activeCredId ? OS_POOL_BY_ID[activeCredId] : null;
          return (
            <div key={t.id} style={styles.col(density)}>
              <div style={styles.colHead}>
                <span style={styles.colGlyph}>{t.glyph}</span>
                <span style={styles.colName}>{t.name}</span>
                <span style={styles.colCli}>{t.cli}</span>
                <span style={styles.colMenu}>⋯</span>
              </div>

              <div style={styles.activeCard(!activeCred)}>
                <div
                  style={{
                    ...styles.activeLabel,
                    color: activeCred ? OS_TOKENS.accentInk : OS_TOKENS.inkMute,
                  }}
                >
                  {activeCred && <span style={styles.activeDot} />}
                  {activeCred ? 'Active' : 'Unbound'}
                </div>
                <div style={styles.activeAlias(!activeCred)}>
                  {activeCred ? activeCred.alias : 'no credential'}
                </div>
                {activeCred && (
                  <div style={styles.activeMeta}>
                    added {osFmtDate(activeCred.addedISO)}
                  </div>
                )}
              </div>

              <div style={styles.poolHead}>
                <span>Pool</span>
                <span
                  style={{
                    fontFamily: OS_TOKENS.mono,
                    letterSpacing: 0,
                    textTransform: 'none',
                    fontSize: 10.5,
                  }}
                >
                  {creds.length}
                </span>
              </div>
              <div style={styles.poolList}>
                {creds.map((c) => {
                  const isActive = c.id === activeCredId;
                  const hoverKey = `${t.id}:${c.id}`;
                  const usedInEnvs = OS_ENVS.filter(
                    (e) => bindings[e.id][t.id] === c.id,
                  ).length;
                  return (
                    <div
                      key={c.id}
                      style={styles.chip(isActive, hoverChip === hoverKey)}
                      onMouseEnter={() => setHoverChip(hoverKey)}
                      onMouseLeave={() => setHoverChip(null)}
                      onClick={() => !isActive && activateCred(t.id, c.id)}
                      title={
                        isActive
                          ? 'Currently active'
                          : `Activate ${c.alias} for ${env.name}`
                      }
                    >
                      <span style={styles.chipDot(usedInEnvs > 0)} />
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.alias}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            fontSize: 10,
                            color: OS_TOKENS.accent,
                            fontFamily: OS_TOKENS.mono,
                          }}
                        >
                          active
                        </span>
                      )}
                      {!isActive && usedInEnvs > 0 && (
                        <span style={styles.chipMeta}>in {usedInEnvs}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button style={styles.addCred}>+ add {t.name}</button>
            </div>
          );
        })}
      </div>

      {/* CLI preview drawer */}
      <div style={styles.drawer(cliOpen)}>
        <div
          style={styles.drawerHead}
          onClick={() => setCliOpen((v) => !v)}
        >
          <span style={{ color: '#5b8a72' }}>›</span>
          <span style={styles.drawerLabel}>
            CLI preview — commands run on switch
          </span>
          <span
            style={{
              marginLeft: 'auto',
              color: '#6b655c',
              fontSize: 11,
              fontFamily: OS_TOKENS.sans,
            }}
          >
            {cliOpen ? 'hide' : 'show'} ⌘J
          </span>
        </div>
        {cliOpen && (
          <div style={styles.drawerLines}>
            <div style={styles.drawerLine}>
              <span style={styles.drawerComment}>
                # Switching to {env.name}
              </span>
            </div>
            {cliLines.map((l, i) => (
              <div key={i} style={styles.drawerLine}>
                <span
                  style={l.comment ? styles.drawerComment : styles.drawerPrompt}
                >
                  {l.prompt}
                </span>
                <span style={l.comment ? styles.drawerComment : undefined}>
                  {l.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tweaks panel */}
      {tweaksVisible && (
        <div style={styles.tweaks}>
          <div style={styles.tweakHead}>
            <span style={{ fontSize: 13 }}>Tweaks</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10.5,
                color: OS_TOKENS.inkMute,
                fontFamily: OS_TOKENS.mono,
              }}
            >
              OpenSwitch
            </span>
          </div>
          <div style={styles.tweakBody}>
            <div style={styles.tweakRow}>
              <span style={styles.tweakLabel}>Density</span>
              <div style={styles.seg}>
                {(['compact', 'comfortable'] as const).map((d) => (
                  <button
                    key={d}
                    style={styles.segBtn(density === d)}
                    onClick={() => setDensity(d)}
                  >
                    {d === 'compact' ? 'Compact' : 'Comfortable'}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.tweakRow}>
              <span style={styles.tweakLabel}>CLI preview</span>
              <button
                style={styles.toggle(cliOpen)}
                onClick={() => setCliOpen((v) => !v)}
              >
                <span style={styles.toggleKnob(cliOpen)} />
              </button>
            </div>
            <div
              style={{
                fontSize: 11,
                color: OS_TOKENS.inkMute,
                lineHeight: 1.5,
                marginTop: 4,
                borderTop: `1px solid ${OS_TOKENS.lineSoft}`,
                paddingTop: 8,
              }}
            >
              Click any chip in a tool's pool to activate it for{' '}
              <b>{env.name}</b>. Use the workspace switcher (top-left) to flip
              the whole environment.
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={styles.toast}>
          <span style={styles.toastDot} />
          {toast}
        </div>
      )}
    </div>
  );
}
