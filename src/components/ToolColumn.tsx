import { CSSProperties } from 'react';
import { AppState, Credential, Tool, credsForTool, fmtDate } from '../api';
import { OS_TOKENS } from '../data';

type Density = 'compact' | 'comfortable';

const s = {
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
  colName: { fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } satisfies CSSProperties,
  colCli: { fontSize: 10.5, color: OS_TOKENS.inkMute, fontFamily: OS_TOKENS.mono } satisfies CSSProperties,
  colMenu: (hover: boolean): CSSProperties => ({
    width: 22, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: hover ? OS_TOKENS.ink : OS_TOKENS.inkFaint, background: hover ? OS_TOKENS.sunken : 'transparent',
    fontSize: 14, border: 'none', padding: 0,
  }),
  activeCard: (empty: boolean): CSSProperties => ({ margin: 10, padding: '12px 12px 13px', borderRadius: 8, background: empty ? OS_TOKENS.sunken : OS_TOKENS.accentSoft, border: `1px solid ${empty ? OS_TOKENS.line : 'transparent'}` }),
  activeLabel: { fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } satisfies CSSProperties,
  activeDot: { width: 6, height: 6, borderRadius: 999, background: OS_TOKENS.accent } satisfies CSSProperties,
  activeAlias: (empty: boolean): CSSProperties => ({ fontSize: 15, fontWeight: 600, color: empty ? OS_TOKENS.inkFaint : OS_TOKENS.ink, fontStyle: empty ? 'italic' : 'normal' }),
  activeMeta: { fontSize: 11, color: OS_TOKENS.inkMute, marginTop: 4, fontFamily: OS_TOKENS.mono } satisfies CSSProperties,
  poolHead: { padding: '4px 16px 6px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: OS_TOKENS.inkMute, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } satisfies CSSProperties,
  poolList: { padding: '2px 10px 10px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'auto' } satisfies CSSProperties,
  chip: (isActive: boolean, hover: boolean): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 6, fontSize: 12.5, cursor: isActive ? 'default' : 'pointer', background: isActive ? 'transparent' : hover ? OS_TOKENS.sunken : 'transparent', color: isActive ? OS_TOKENS.inkFaint : OS_TOKENS.ink, border: '1px solid transparent' }),
  chipDot: (used: boolean): CSSProperties => ({ width: 6, height: 6, borderRadius: 999, flexShrink: 0, background: used ? OS_TOKENS.accent : OS_TOKENS.inkFaint, opacity: used ? 1 : 0.5 }),
  chipMeta: { marginLeft: 'auto', fontSize: 10, color: OS_TOKENS.inkMute, fontFamily: OS_TOKENS.mono, opacity: 0.8 } satisfies CSSProperties,
  chipRemove: (visible: boolean): CSSProperties => ({ width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: OS_TOKENS.inkMute, fontSize: 13, background: 'transparent', border: 'none', opacity: visible ? 1 : 0, marginLeft: 4, padding: 0 }),
  poolEmpty: { padding: '14px 12px', fontSize: 11.5, color: OS_TOKENS.inkMute, fontStyle: 'italic', textAlign: 'center' } satisfies CSSProperties,
  addCred: { margin: '4px 10px 10px', padding: '7px 10px', border: `1px dashed ${OS_TOKENS.line}`, borderRadius: 6, fontSize: 11.5, color: OS_TOKENS.inkMute, cursor: 'pointer', background: 'transparent', textAlign: 'left' } satisfies CSSProperties,
};

interface Props {
  tool: Tool;
  state: AppState;
  envName: string;
  activeCredId?: string;
  search: string;
  hoverChip: string | null;
  hoverMenu: string | null;
  density: Density;
  onHoverChip: (key: string | null) => void;
  onHoverMenu: (toolId: string | null) => void;
  onActivate: (tool: Tool, cred: Credential) => void;
  onEditPaths: (tool: Tool) => void;
  onRemoveCred: (tool: Tool, cred: Credential) => void;
  onAddCred: (tool: Tool) => void;
}

export function ToolColumn({ tool, state, envName, activeCredId, search, hoverChip, hoverMenu, density, onHoverChip, onHoverMenu, onActivate, onEditPaths, onRemoveCred, onAddCred }: Props) {
  const q = search.trim().toLowerCase();
  const creds = credsForTool(state, tool.id).filter((c) => !q || c.alias.toLowerCase().includes(q) || tool.name.toLowerCase().includes(q) || tool.cli.toLowerCase().includes(q));
  const activeCred = activeCredId ? state.pool.find((c) => c.id === activeCredId) : null;

  return (
    <div style={s.col(density)}>
      <div style={s.colHead}>
        <span style={s.colGlyph}>{tool.glyph}</span>
        <span style={s.colName}>{tool.name}</span>
        <span style={s.colCli}>{tool.cli}</span>
        <button
          style={s.colMenu(hoverMenu === tool.id)}
          onMouseEnter={() => onHoverMenu(tool.id)}
          onMouseLeave={() => onHoverMenu(null)}
          onClick={() => onEditPaths(tool)}
          title={`Edit target paths for ${tool.cli}`}
          aria-label={`Edit ${tool.name} paths`}
        >
          ⋯
        </button>
      </div>

      <div style={s.activeCard(!activeCred)}>
        <div style={{ ...s.activeLabel, color: activeCred ? OS_TOKENS.accentInk : OS_TOKENS.inkMute }}>
          {activeCred && <span style={s.activeDot} />}
          {activeCred ? 'Active' : 'Unbound'}
        </div>
        <div style={s.activeAlias(!activeCred)}>{activeCred ? activeCred.alias : 'no credential'}</div>
        {activeCred && <div style={s.activeMeta}>added {fmtDate(activeCred.addedISO)}</div>}
      </div>

      <div style={s.poolHead}>
        <span>Pool</span>
        <span style={{ fontFamily: OS_TOKENS.mono, letterSpacing: 0, textTransform: 'none', fontSize: 10.5 }}>{creds.length}</span>
      </div>
      <div style={s.poolList}>
        {creds.length === 0 ? (
          <div style={s.poolEmpty}>no credentials yet — use “+ add {tool.name}” to import the live config</div>
        ) : (
          creds.map((c) => {
            const isActive = c.id === activeCredId;
            const hoverKey = `${tool.id}:${c.id}`;
            const isHovered = hoverChip === hoverKey;
            const usedInEnvs = state.envs.filter((e) => e.bindings[tool.id] === c.id).length;
            return (
              <div key={c.id} style={s.chip(isActive, isHovered)} onMouseEnter={() => onHoverChip(hoverKey)} onMouseLeave={() => onHoverChip(null)} onClick={() => !isActive && onActivate(tool, c)} title={isActive ? 'Currently active' : `Activate ${c.alias} for ${envName}`}>
                <span style={s.chipDot(usedInEnvs > 0)} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.alias}</span>
                {isActive && <span style={{ fontSize: 10, color: OS_TOKENS.accent, fontFamily: OS_TOKENS.mono }}>active</span>}
                {!isActive && usedInEnvs > 0 && <span style={s.chipMeta}>in {usedInEnvs}</span>}
                <button
                  style={s.chipRemove(isHovered)}
                  aria-label={`Delete ${c.alias}`}
                  title="Delete credential"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onRemoveCred(tool, c);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
      <button style={s.addCred} onClick={() => onAddCred(tool)}>+ add {tool.name}</button>
    </div>
  );
}
