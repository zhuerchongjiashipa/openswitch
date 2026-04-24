import { CSSProperties } from 'react';
import { OS_TOKENS } from '../data';

interface Line {
  prompt: string;
  text: string;
  comment?: boolean;
}

const s = {
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
};

interface Props {
  open: boolean;
  envName: string;
  lines: Line[];
  onToggle: () => void;
}

export function CliPreviewDrawer({ open, envName, lines, onToggle }: Props) {
  return (
    <div style={s.drawer(open)}>
      <div style={s.drawerHead} onClick={onToggle}>
        <span style={{ color: '#5b8a72' }}>›</span>
        <span style={s.drawerLabel}>CLI preview — commands that the switch maps to</span>
        <span style={{ marginLeft: 'auto', color: '#6b655c', fontSize: 11, fontFamily: OS_TOKENS.sans }}>
          {open ? 'hide' : 'show'} ⌘J
        </span>
      </div>
      {open && (
        <div style={s.drawerLines}>
          <div style={s.drawerLine}>
            <span style={s.drawerComment}># Switching to {envName}</span>
          </div>
          {lines.map((l, i) => (
            <div key={i} style={s.drawerLine}>
              <span style={l.comment ? s.drawerComment : s.drawerPrompt}>{l.prompt}</span>
              <span style={l.comment ? s.drawerComment : undefined}>{l.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
