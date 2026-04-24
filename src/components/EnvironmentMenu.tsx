import { CSSProperties } from 'react';
import { Environment } from '../api';
import { OS_TOKENS } from '../data';

const s = {
  wsMenu: {
    position: 'absolute',
    top: 52,
    left: 12,
    zIndex: 30,
    minWidth: 280,
    background: OS_TOKENS.surface,
    border: `1px solid ${OS_TOKENS.line}`,
    borderRadius: 10,
    boxShadow: '0 12px 40px -8px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.04)',
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
  wsAvatar: {
    width: 20,
    height: 20,
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
  } satisfies CSSProperties,
  wsMenuSub: { fontSize: 11.5, color: OS_TOKENS.inkMute } satisfies CSSProperties,
  wsMenuCheck: { marginLeft: 'auto', color: OS_TOKENS.accent, fontSize: 13 } satisfies CSSProperties,
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: OS_TOKENS.inkMute,
    fontSize: 13,
    background: 'transparent',
    border: 'none',
    fontFamily: 'inherit',
    marginLeft: 4,
    padding: 0,
  } satisfies CSSProperties,
  wsMenuSep: { height: 1, background: OS_TOKENS.line, margin: '6px 0' } satisfies CSSProperties,
};

interface Props {
  envs: Environment[];
  activeEnvId: string;
  onSwitchEnv: (envId: string) => void;
  onDeleteEnv: (envId: string, envName: string) => void;
  onNewEnv: () => void;
}

export function EnvironmentMenu({ envs, activeEnvId, onSwitchEnv, onDeleteEnv, onNewEnv }: Props) {
  return (
    <div style={s.wsMenu} onClick={(e) => e.stopPropagation()}>
      <div style={s.wsMenuLabel}>Switch environment</div>
      {envs.map((e) => {
        const isActive = e.id === activeEnvId;
        const n = Object.values(e.bindings).filter(Boolean).length;
        const canDelete = envs.length > 1;
        return (
          <div key={e.id} style={s.wsMenuItem(isActive)} onClick={() => onSwitchEnv(e.id)}>
            <span
              style={{
                ...s.wsAvatar,
                background: isActive ? OS_TOKENS.accent : OS_TOKENS.sunken,
                color: isActive ? '#fff' : OS_TOKENS.inkSoft,
                border: isActive ? 'none' : `1px solid ${OS_TOKENS.line}`,
              }}
            >
              {e.name[0]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{e.name}</div>
              <div style={s.wsMenuSub}>{e.hint || '—'} · {n} tools</div>
            </div>
            {isActive && <span style={s.wsMenuCheck}>✓</span>}
            {canDelete && !isActive && (
              <button
                style={s.chipRemove}
                aria-label={`Delete ${e.name}`}
                title="Delete environment"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onDeleteEnv(e.id, e.name);
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <div style={s.wsMenuSep} />
      <div style={{ ...s.wsMenuItem(false), color: OS_TOKENS.inkSoft }} onClick={onNewEnv}>
        <span style={{ ...s.wsAvatar, background: OS_TOKENS.sunken, color: OS_TOKENS.inkSoft, fontSize: 12 }}>+</span>
        <span>New environment…</span>
      </div>
    </div>
  );
}
