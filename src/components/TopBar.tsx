import { CSSProperties } from 'react';
import { OS_TOKENS } from '../data';
import { Environment } from '../api';

const s = {
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
  } satisfies CSSProperties,
  wsName: { fontWeight: 500 } satisfies CSSProperties,
  wsChevron: { color: OS_TOKENS.inkMute, fontSize: 10, marginLeft: 2 } satisfies CSSProperties,
  wsDivider: { width: 1, height: 20, background: OS_TOKENS.line } satisfies CSSProperties,
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12.5,
    color: OS_TOKENS.inkMute,
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
    minWidth: 260,
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
};

interface TopBarProps {
  env: Environment;
  wsOpen: boolean;
  search: string;
  onToggleWorkspace: () => void;
  onSearchChange: (value: string) => void;
  onAddCredential: () => void;
}

export function TopBar({
  env,
  wsOpen,
  search,
  onToggleWorkspace,
  onSearchChange,
  onAddCredential,
}: TopBarProps) {
  return (
    <div style={s.topbar} onClick={(e) => e.stopPropagation()}>
      <button style={s.wsBtn(wsOpen)} onClick={onToggleWorkspace}>
        <span style={s.wsAvatar}>{env.name[0]}</span>
        <span style={s.wsName}>{env.name}</span>
        <span style={s.wsChevron}>▾</span>
      </button>
      <span style={s.wsDivider} />
      <div style={s.brand}>
        <span style={s.brandLogo}>
          <span style={s.brandLogoInner} />
        </span>
        OpenSwitch
      </div>

      <div style={s.search}>
        <span style={{ opacity: 0.6 }}>⌕</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search credentials or tools"
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            flex: 1,
            minWidth: 0,
            fontFamily: 'inherit',
            fontSize: 12.5,
            color: OS_TOKENS.ink,
          }}
        />
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span style={s.kbd}>⌘</span>
          <span style={s.kbd}>K</span>
        </span>
      </div>
      <button style={s.topBtn} onClick={onAddCredential}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
        Add credential
      </button>
    </div>
  );
}
