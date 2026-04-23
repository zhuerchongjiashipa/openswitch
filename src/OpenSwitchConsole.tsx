import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Credential,
  EnvSwitchOutcome,
  SwitchOutcome,
  Tool,
  ToolId,
  api,
  credsForTool,
  fmtDate,
} from './api';
import { OS_TOKENS } from './data';

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
  wsMenuCheck: { marginLeft: 'auto', color: OS_TOKENS.accent, fontSize: 13 } satisfies CSSProperties,
  wsMenuSep: { height: 1, background: OS_TOKENS.line, margin: '6px 0' } satisfies CSSProperties,

  subbar: {
    flexShrink: 0,
    padding: '18px 24px 8px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: 16,
  } satisfies CSSProperties,
  envTitle: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 } satisfies CSSProperties,
  envHint: { color: OS_TOKENS.inkMute, fontSize: 13, marginTop: 2 } satisfies CSSProperties,
  subMeta: {
    marginLeft: 'auto',
    fontSize: 11.5,
    color: OS_TOKENS.inkMute,
    fontFamily: OS_TOKENS.mono,
    display: 'flex',
    gap: 14,
    alignItems: 'center',
  } satisfies CSSProperties,

  cols: (density: Density, n: number): CSSProperties => ({
    flex: 1,
    display: 'grid',
    gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
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
  colCli: { fontSize: 10.5, color: OS_TOKENS.inkMute, fontFamily: OS_TOKENS.mono } satisfies CSSProperties,
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
  activeDot: { width: 6, height: 6, borderRadius: 999, background: OS_TOKENS.accent } satisfies CSSProperties,
  activeAlias: (empty: boolean): CSSProperties => ({
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.015em',
    color: empty ? OS_TOKENS.inkFaint : OS_TOKENS.ink,
    fontStyle: empty ? 'italic' : 'normal',
  }),
  activeMeta: { fontSize: 11, color: OS_TOKENS.inkMute, marginTop: 4, fontFamily: OS_TOKENS.mono } satisfies CSSProperties,

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
    background: isActive ? 'transparent' : hover ? OS_TOKENS.sunken : 'transparent',
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
  poolEmpty: {
    padding: '14px 12px',
    fontSize: 11.5,
    color: OS_TOKENS.inkMute,
    fontStyle: 'italic',
    textAlign: 'center',
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
  drawerLines: { padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 4 } satisfies CSSProperties,
  drawerLine: { display: 'flex', gap: 10, alignItems: 'baseline' } satisfies CSSProperties,
  drawerPrompt: { color: '#5b8a72', flexShrink: 0 } satisfies CSSProperties,
  drawerComment: { color: '#6b655c' } satisfies CSSProperties,

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
    maxWidth: '80vw',
  } satisfies CSSProperties,
  toastDot: (ok: boolean): CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: 999,
    background: ok ? OS_TOKENS.ok : OS_TOKENS.danger,
  }),

  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: OS_TOKENS.inkMute,
    fontSize: 13,
  } satisfies CSSProperties,
  errorPane: {
    margin: 24,
    padding: 20,
    border: `1px solid ${OS_TOKENS.line}`,
    borderRadius: 10,
    background: OS_TOKENS.surface,
    color: OS_TOKENS.ink,
    maxWidth: 720,
  } satisfies CSSProperties,
};

interface Toast {
  text: string;
  ok: boolean;
}

function describe(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
}

function cliCommandFor(tool: ToolId, alias: string): string {
  switch (tool) {
    case 'git':
      return `git config --global credential.helper "${alias}"`;
    case 'wrangler':
      return `wrangler whoami --profile ${alias}`;
    case 'codex':
      return `codex auth use ${alias}`;
    case 'claude':
      return `claude auth use ${alias}`;
    case 'npm':
      return `npm config set _authToken $(os-keyring get ${alias})`;
    case 'aws':
      return `export AWS_PROFILE=${alias}`;
    case 'docker':
      return `docker login --username ${alias}`;
    default:
      return `${tool} use ${alias}`;
  }
}

export function OpenSwitchConsole() {
  const [state, setState] = useState<AppState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wsOpen, setWsOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [hoverChip, setHoverChip] = useState<string | null>(null);
  const [cliOpen, setCliOpen] = useState(true);
  const density: Density = 'comfortable';

  const toastTimer = useRef<number | null>(null);
  const showToast = useCallback((text: string, ok = true) => {
    setToast({ text, ok });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  // Initial load.
  useEffect(() => {
    api
      .getState()
      .then(setState)
      .catch((e) => setLoadError(describe(e)));
  }, []);

  if (loadError) {
    return (
      <div style={styles.root}>
        <div style={styles.errorPane}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Couldn't reach the OpenSwitch backend.
          </div>
          <div style={{ color: OS_TOKENS.inkMute, marginBottom: 12 }}>
            This UI runs inside the Tauri shell — start it with{' '}
            <code style={{ fontFamily: OS_TOKENS.mono }}>npm run tauri:dev</code>.
            Plain <code style={{ fontFamily: OS_TOKENS.mono }}>vite</code>{' '}
            won't have the Rust commands available.
          </div>
          <pre
            style={{
              fontFamily: OS_TOKENS.mono,
              fontSize: 11.5,
              background: OS_TOKENS.sunken,
              padding: 10,
              borderRadius: 6,
              overflow: 'auto',
              margin: 0,
            }}
          >
            {loadError}
          </pre>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={styles.root}>
        <div style={styles.loading}>Loading…</div>
      </div>
    );
  }

  const env =
    state.envs.find((e) => e.id === state.active_env) ?? state.envs[0];
  const envBindings = env?.bindings ?? {};
  const boundCount = Object.values(envBindings).filter(Boolean).length;

  const handleActivate = async (tool: Tool, cred: Credential) => {
    try {
      const r: SwitchOutcome = await api.activateCredential(
        env.id,
        tool.id,
        cred.id,
      );
      setState(r.state);
      showToast(`${tool.cli} → ${cred.alias}`);
    } catch (e) {
      showToast(`${tool.cli}: ${describe(e)}`, false);
    }
  };

  const handleSwitchEnv = async (envId: string) => {
    setWsOpen(false);
    try {
      const r: EnvSwitchOutcome = await api.switchEnvironment(envId);
      setState(r.state);
      const target = r.state.envs.find((e) => e.id === envId);
      const errs = r.outcomes.filter((o) => o.alias.startsWith('ERROR:'));
      if (errs.length === 0) {
        showToast(
          `Switched to ${target?.name ?? envId} · ${r.outcomes.length} tools`,
        );
      } else {
        showToast(
          `Switched to ${target?.name ?? envId}, ${errs.length} tool(s) failed`,
          false,
        );
      }
    } catch (e) {
      showToast(describe(e), false);
    }
  };

  const handleAdd = async (tool: Tool) => {
    const alias = window.prompt(
      `Snapshot the current ${tool.cli} config into the pool. Alias?`,
    );
    if (!alias) return;
    try {
      const next = await api.importCredential(tool.id, alias.trim());
      setState(next);
      showToast(`Imported ${tool.cli} → ${alias.trim()}`);
    } catch (e) {
      showToast(`Import ${tool.cli}: ${describe(e)}`, false);
    }
  };

  const cliLines = state.tools.map((t) => {
    const credId = envBindings[t.id];
    const cred = credId ? state.pool.find((c) => c.id === credId) : null;
    if (!cred) return { prompt: '#', text: `${t.cli} — unbound`, comment: true };
    return { prompt: '$', text: cliCommandFor(t.id, cred.alias) };
  });

  return (
    <div style={styles.root} onClick={() => setWsOpen(false)}>
      <div style={styles.topbar} onClick={(e) => e.stopPropagation()}>
        <button
          style={styles.wsBtn(wsOpen)}
          onClick={() => setWsOpen((v) => !v)}
        >
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
        <button
          style={styles.topBtn}
          onClick={() =>
            showToast(
              'Use the “+ add <tool>” button in any column to import its current config.',
            )
          }
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          Add credential
        </button>
      </div>

      {wsOpen && (
        <div style={styles.wsMenu} onClick={(e) => e.stopPropagation()}>
          <div style={styles.wsMenuLabel}>Switch environment</div>
          {state.envs.map((e) => {
            const isActive = e.id === env.id;
            const n = Object.values(e.bindings).filter(Boolean).length;
            return (
              <div
                key={e.id}
                style={styles.wsMenuItem(isActive)}
                onClick={() => handleSwitchEnv(e.id)}
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
          <div style={{ ...styles.wsMenuItem(false), color: OS_TOKENS.inkSoft }}>
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
          <div style={{ ...styles.wsMenuItem(false), color: OS_TOKENS.inkSoft }}>
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

      <div style={styles.subbar}>
        <div>
          <h1 style={styles.envTitle}>{env.name}</h1>
          <div style={styles.envHint}>{env.hint}</div>
        </div>
        <div style={styles.subMeta}>
          <span>
            {boundCount}/{state.tools.length} tools bound
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{state.pool.length} credentials in pool</span>
        </div>
      </div>

      <div style={styles.cols(density, state.tools.length)}>
        {state.tools.map((t) => {
          const creds = credsForTool(state, t.id);
          const activeCredId = envBindings[t.id];
          const activeCred = activeCredId
            ? state.pool.find((c) => c.id === activeCredId)
            : null;
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
                    added {fmtDate(activeCred.addedISO)}
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
                {creds.length === 0 ? (
                  <div style={styles.poolEmpty}>
                    no credentials yet — use “+ add {t.name}” to import the live
                    config
                  </div>
                ) : (
                  creds.map((c) => {
                    const isActive = c.id === activeCredId;
                    const hoverKey = `${t.id}:${c.id}`;
                    const usedInEnvs = state.envs.filter(
                      (e) => e.bindings[t.id] === c.id,
                    ).length;
                    return (
                      <div
                        key={c.id}
                        style={styles.chip(isActive, hoverChip === hoverKey)}
                        onMouseEnter={() => setHoverChip(hoverKey)}
                        onMouseLeave={() => setHoverChip(null)}
                        onClick={() => !isActive && handleActivate(t, c)}
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
                  })
                )}
              </div>
              <button style={styles.addCred} onClick={() => handleAdd(t)}>
                + add {t.name}
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.drawer(cliOpen)}>
        <div style={styles.drawerHead} onClick={() => setCliOpen((v) => !v)}>
          <span style={{ color: '#5b8a72' }}>›</span>
          <span style={styles.drawerLabel}>
            CLI preview — commands that the switch maps to
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

      {toast && (
        <div style={styles.toast}>
          <span style={styles.toastDot(toast.ok)} />
          {toast.text}
        </div>
      )}
    </div>
  );
}
