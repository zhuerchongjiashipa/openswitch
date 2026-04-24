import { CSSProperties, useState } from 'react';
import { AppState, TargetFile, Tool, api } from './api';
import { OS_TOKENS } from './data';

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 12, 8, 0.32)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } satisfies CSSProperties,
  sheet: {
    width: 560,
    maxWidth: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    background: OS_TOKENS.surface,
    border: `1px solid ${OS_TOKENS.line}`,
    borderRadius: 12,
    boxShadow: '0 24px 60px -12px rgba(0,0,0,0.25)',
    fontFamily: OS_TOKENS.sans,
    color: OS_TOKENS.ink,
  } satisfies CSSProperties,
  head: {
    padding: '16px 20px',
    borderBottom: `1px solid ${OS_TOKENS.lineSoft}`,
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  } satisfies CSSProperties,
  title: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    margin: 0,
  } satisfies CSSProperties,
  subtitle: {
    fontSize: 12,
    color: OS_TOKENS.inkMute,
    marginLeft: 'auto',
    fontFamily: OS_TOKENS.mono,
  } satisfies CSSProperties,
  body: {
    padding: '14px 20px 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  } satisfies CSSProperties,
  lead: {
    fontSize: 12.5,
    color: OS_TOKENS.inkSoft,
    lineHeight: 1.5,
    marginBottom: 6,
  } satisfies CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 28px',
    gap: 8,
    alignItems: 'center',
  } satisfies CSSProperties,
  labelRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 28px',
    gap: 8,
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: OS_TOKENS.inkMute,
    paddingLeft: 2,
  } satisfies CSSProperties,
  input: {
    height: 30,
    padding: '0 10px',
    border: `1px solid ${OS_TOKENS.line}`,
    borderRadius: 6,
    background: OS_TOKENS.surface,
    fontFamily: OS_TOKENS.mono,
    fontSize: 12,
    color: OS_TOKENS.ink,
    outline: 'none',
    minWidth: 0,
  } satisfies CSSProperties,
  remove: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: OS_TOKENS.inkMute,
    fontSize: 14,
    lineHeight: 1,
  } satisfies CSSProperties,
  addBtn: {
    marginTop: 4,
    padding: '7px 10px',
    border: `1px dashed ${OS_TOKENS.line}`,
    borderRadius: 6,
    fontSize: 12,
    color: OS_TOKENS.inkMute,
    cursor: 'pointer',
    background: 'transparent',
    fontFamily: 'inherit',
    textAlign: 'left',
  } satisfies CSSProperties,
  footer: {
    padding: '12px 20px 16px',
    borderTop: `1px solid ${OS_TOKENS.lineSoft}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  } satisfies CSSProperties,
  reset: {
    padding: '7px 12px',
    borderRadius: 6,
    border: `1px solid ${OS_TOKENS.line}`,
    background: OS_TOKENS.surface,
    cursor: 'pointer',
    fontSize: 12,
    color: OS_TOKENS.inkSoft,
    fontFamily: 'inherit',
  } satisfies CSSProperties,
  cancel: {
    marginLeft: 'auto',
    padding: '7px 12px',
    borderRadius: 6,
    border: `1px solid ${OS_TOKENS.line}`,
    background: OS_TOKENS.surface,
    cursor: 'pointer',
    fontSize: 12,
    color: OS_TOKENS.ink,
    fontFamily: 'inherit',
  } satisfies CSSProperties,
  save: {
    padding: '7px 14px',
    borderRadius: 6,
    border: `1px solid ${OS_TOKENS.accent}`,
    background: OS_TOKENS.accent,
    cursor: 'pointer',
    fontSize: 12,
    color: '#fff',
    fontFamily: 'inherit',
    fontWeight: 500,
  } satisfies CSSProperties,
  error: {
    padding: '8px 12px',
    borderRadius: 6,
    background: OS_TOKENS.dangerSoft,
    color: OS_TOKENS.danger,
    fontSize: 12,
    marginBottom: 4,
  } satisfies CSSProperties,
};

interface Props {
  tool: Tool;
  onClose: () => void;
  onSaved: (next: AppState) => void;
  onError: (msg: string) => void;
}

function describe(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
}

export function PathsModal({ tool, onClose, onSaved, onError }: Props) {
  const [rows, setRows] = useState<TargetFile[]>(() =>
    tool.targets.map((t) => ({ ...t })),
  );
  const [saving, setSaving] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const setRow = (i: number, patch: Partial<TargetFile>) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRow = () =>
    setRows((rs) => [...rs, { pool_name: '', target: '' }]);
  const removeRow = (i: number) =>
    setRows((rs) => rs.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    setLocalErr(null);
    try {
      const cleaned = rows.map((r) => ({
        pool_name: r.pool_name.trim(),
        target: r.target.trim(),
      }));
      const next = await api.updateToolPaths(tool.id, cleaned);
      onSaved(next);
      onClose();
    } catch (e) {
      setLocalErr(describe(e));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (
      !window.confirm(
        `Reset ${tool.name} paths to the platform default for this OS?`,
      )
    )
      return;
    try {
      const next = await api.resetToolPaths(tool.id);
      onSaved(next);
      onClose();
    } catch (e) {
      onError(describe(e));
    }
  };

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.sheet} onClick={(ev) => ev.stopPropagation()}>
        <div style={s.head}>
          <h2 style={s.title}>{tool.name} — target paths</h2>
          <span style={s.subtitle}>{tool.cli}</span>
        </div>

        <div style={s.body}>
          <div style={s.lead}>
            When a credential is activated, each pool file is copied to its
            target path. <code style={{ fontFamily: OS_TOKENS.mono }}>~</code>{' '}
            expands to your home directory. Keep pool file names stable —
            existing pool entries store files under those names.
          </div>

          {localErr && <div style={s.error}>{localErr}</div>}

          <div style={s.labelRow}>
            <span>Pool file</span>
            <span>Target path</span>
            <span />
          </div>

          {rows.map((r, i) => (
            <div key={i} style={s.row}>
              <input
                style={s.input}
                value={r.pool_name}
                placeholder=".config"
                spellCheck={false}
                onChange={(ev) => setRow(i, { pool_name: ev.target.value })}
              />
              <input
                style={s.input}
                value={r.target}
                placeholder="~/.tool/config"
                spellCheck={false}
                onChange={(ev) => setRow(i, { target: ev.target.value })}
              />
              <button
                style={s.remove}
                title="Remove this target"
                aria-label="Remove target"
                onClick={() => removeRow(i)}
              >
                ×
              </button>
            </div>
          ))}

          <button style={s.addBtn} onClick={addRow}>
            + add target
          </button>
        </div>

        <div style={s.footer}>
          <button style={s.reset} onClick={reset} disabled={saving}>
            Reset to defaults
          </button>
          <button style={s.cancel} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button style={s.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
