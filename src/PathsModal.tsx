import { CSSProperties, useEffect, useState } from 'react';
import { AppState, BackupEntry, TargetFile, Tool, api } from './api';
import { OS_TOKENS } from './data';

type Tab = 'paths' | 'history';

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
    padding: '16px 20px 0',
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  } satisfies CSSProperties,
  tabs: {
    display: 'flex',
    gap: 2,
    padding: '10px 20px 0',
    borderBottom: `1px solid ${OS_TOKENS.lineSoft}`,
  } satisfies CSSProperties,
  tab: (active: boolean): CSSProperties => ({
    padding: '8px 12px',
    borderRadius: '6px 6px 0 0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12.5,
    fontWeight: active ? 600 : 500,
    color: active ? OS_TOKENS.ink : OS_TOKENS.inkMute,
    borderBottom: `2px solid ${active ? OS_TOKENS.accent : 'transparent'}`,
    marginBottom: -1,
  }),
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

  historyBody: {
    padding: '14px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  } satisfies CSSProperties,
  historyLead: {
    fontSize: 12.5,
    color: OS_TOKENS.inkSoft,
    lineHeight: 1.5,
    marginBottom: 6,
  } satisfies CSSProperties,
  historyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    border: `1px solid ${OS_TOKENS.line}`,
    borderRadius: 8,
    background: OS_TOKENS.surface,
  } satisfies CSSProperties,
  historyWhen: {
    fontSize: 13,
    fontWeight: 500,
    color: OS_TOKENS.ink,
  } satisfies CSSProperties,
  historyStamp: {
    fontSize: 10.5,
    color: OS_TOKENS.inkMute,
    fontFamily: OS_TOKENS.mono,
    marginTop: 2,
  } satisfies CSSProperties,
  historyFiles: {
    fontSize: 11,
    color: OS_TOKENS.inkMute,
    fontFamily: OS_TOKENS.mono,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } satisfies CSSProperties,
  restoreBtn: {
    marginLeft: 'auto',
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${OS_TOKENS.line}`,
    background: OS_TOKENS.surface,
    cursor: 'pointer',
    fontSize: 12,
    color: OS_TOKENS.ink,
    fontFamily: 'inherit',
    fontWeight: 500,
  } satisfies CSSProperties,
  historyEmpty: {
    padding: '32px 12px',
    textAlign: 'center',
    color: OS_TOKENS.inkMute,
    fontSize: 12.5,
    fontStyle: 'italic',
  } satisfies CSSProperties,
};

interface Props {
  tool: Tool;
  onClose: () => void;
  onSaved: (next: AppState) => void;
  onToast: (msg: string, ok: boolean) => void;
}

function describe(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
}

function fmtBackupWhen(iso: string, stamp: string): string {
  if (iso) {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return stamp;
}

export function PathsModal({ tool, onClose, onSaved, onToast }: Props) {
  const [tab, setTab] = useState<Tab>('paths');
  const [rows, setRows] = useState<TargetFile[]>(() =>
    tool.targets.map((t) => ({ ...t })),
  );
  const [saving, setSaving] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const [backups, setBackups] = useState<BackupEntry[] | null>(null);
  const [historyErr, setHistoryErr] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadBackups = async () => {
    setHistoryErr(null);
    try {
      const list = await api.listBackups(tool.id);
      setBackups(list);
    } catch (e) {
      setHistoryErr(describe(e));
      setBackups([]);
    }
  };

  useEffect(() => {
    if (tab === 'history' && backups === null) {
      loadBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleRestore = async (b: BackupEntry) => {
    if (
      !window.confirm(
        `Restore ${tool.cli} to the state from ${fmtBackupWhen(b.iso, b.stamp)}?\n\nCurrent files are backed up first so the restore can itself be undone.`,
      )
    )
      return;
    setRestoring(b.stamp);
    try {
      await api.restoreBackup(tool.id, b.stamp);
      onToast(`Restored ${tool.cli} from ${fmtBackupWhen(b.iso, b.stamp)}`, true);
      onClose();
    } catch (e) {
      setHistoryErr(describe(e));
    } finally {
      setRestoring(null);
      // The restore itself created a new backup; refresh the list if the
      // user reopens the History tab.
      setBackups(null);
    }
  };

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
      onToast(describe(e), false);
    }
  };

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.sheet} onClick={(ev) => ev.stopPropagation()}>
        <div style={s.head}>
          <h2 style={s.title}>{tool.name}</h2>
          <span style={s.subtitle}>{tool.cli}</span>
        </div>
        <div style={s.tabs}>
          <button style={s.tab(tab === 'paths')} onClick={() => setTab('paths')}>
            Paths
          </button>
          <button
            style={s.tab(tab === 'history')}
            onClick={() => setTab('history')}
          >
            History
          </button>
        </div>

        {tab === 'paths' && (
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
        )}

        {tab === 'paths' && (
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
        )}

        {tab === 'history' && (
          <div style={s.historyBody}>
            <div style={s.historyLead}>
              Each credential activation backs up the previous live config
              here. Restoring copies the backup back over the target — and
              snapshots the <em>current</em> live state first, so a restore
              can itself be undone.
            </div>

            {historyErr && <div style={s.error}>{historyErr}</div>}

            {backups === null && (
              <div style={s.historyEmpty}>Loading…</div>
            )}

            {backups && backups.length === 0 && (
              <div style={s.historyEmpty}>
                No backups yet. They appear here after the first activation
                that overwrites a live {tool.cli} file.
              </div>
            )}

            {backups &&
              backups.map((b) => (
                <div key={b.stamp} style={s.historyRow}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={s.historyWhen}>
                      {fmtBackupWhen(b.iso, b.stamp)}
                    </div>
                    <div style={s.historyStamp}>{b.stamp}</div>
                    <div style={s.historyFiles} title={b.files.join(', ')}>
                      {b.files.join(', ')}
                    </div>
                  </div>
                  <button
                    style={s.restoreBtn}
                    onClick={() => handleRestore(b)}
                    disabled={restoring !== null}
                  >
                    {restoring === b.stamp ? 'Restoring…' : 'Restore'}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
