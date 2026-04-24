import { useEffect, useMemo, useState } from 'react';
import { AppState, SwitchOutcome, Tool, api } from './api';
import { BrandTile } from './BrandTile';
import { OS_TOKENS } from './data';
import { useLang } from './i18n';
import {
  Button,
  Check,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  FieldLabel,
  Input,
  Kbd,
  Separator,
} from './ui';

interface Props {
  state: AppState;
  initialToolId?: string;
  onClose: () => void;
  onDone: (next: AppState, ok: boolean, message: string) => void;
}

function aliasSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 48);
}

function describe(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
}

export function AddCredentialDialog({
  state,
  initialToolId,
  onClose,
  onDone,
}: Props) {
  const { t } = useLang();
  const [toolId, setToolId] = useState<string>(
    initialToolId ?? state.tools[0]?.id ?? '',
  );
  const [alias, setAliasRaw] = useState('');
  const [bindTo, setBindTo] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tool: Tool | undefined = useMemo(
    () => state.tools.find((t) => t.id === toolId),
    [state.tools, toolId],
  );

  const aliasClean = aliasSlug(alias);
  const aliasConflict = useMemo(() => {
    if (!aliasClean || !tool) return false;
    return state.pool.some(
      (c) => c.tool === tool.id && c.alias.toLowerCase() === aliasClean,
    );
  }, [aliasClean, tool, state.pool]);
  const canSubmit = !!tool && aliasClean.length > 0 && !aliasConflict && !busy;

  // Reset bind-to when tool changes — the alias binding only makes sense for
  // the currently chosen tool.
  useEffect(() => {
    setBindTo(new Set());
  }, [toolId]);

  const toggleBind = (envId: string) => {
    setBindTo((prev) => {
      const next = new Set(prev);
      if (next.has(envId)) next.delete(envId);
      else next.add(envId);
      return next;
    });
  };

  const submit = async () => {
    if (!canSubmit || !tool) return;
    setBusy(true);
    setErr(null);
    try {
      let next: AppState = await api.importCredential(tool.id, aliasClean);
      const created = next.pool.find(
        (c) => c.tool === tool.id && c.alias === aliasClean,
      );
      const envs = Array.from(bindTo);
      let failed = 0;
      if (created) {
        for (const envId of envs) {
          try {
            const r: SwitchOutcome = await api.activateCredential(
              envId,
              tool.id,
              created.id,
            );
            next = r.state;
          } catch {
            failed += 1;
          }
        }
      }
      const msg =
        envs.length === 0
          ? `Imported ${tool.cli} → ${aliasClean}`
          : failed === 0
          ? `Imported ${tool.cli} → ${aliasClean} · bound in ${envs.length}`
          : `Imported ${tool.cli} → ${aliasClean} · ${
              envs.length - failed
            }/${envs.length} bound`;
      onDone(next, failed === 0, msg);
      onClose();
    } catch (e) {
      setErr(describe(e));
    } finally {
      setBusy(false);
    }
  };

  if (!tool) {
    return (
      <Dialog width={480} onClose={onClose}>
        <DialogHeader title={t.addCredentialDialogTitle} onClose={onClose} />
        <DialogBody>
          <div style={{ fontSize: 12.5, color: OS_TOKENS.inkMute }}>
            No tools available.
          </div>
        </DialogBody>
        <DialogFooter>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
        </DialogFooter>
      </Dialog>
    );
  }

  return (
    <Dialog width={580} onClose={onClose}>
      <DialogHeader
        title={t.addCredentialDialogTitle}
        subtitle={t.addCredentialDialogSubtitle}
        onClose={onClose}
      />
      <DialogBody>
        <FieldLabel required>{t.fieldTool}</FieldLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${state.tools.length}, 1fr)`,
            gap: 6,
            padding: 4,
            borderRadius: 8,
            background: OS_TOKENS.sunken,
            border: `1px solid ${OS_TOKENS.lineSoft}`,
          }}
        >
          {state.tools.map((tl) => {
            const active = tl.id === toolId;
            return (
              <button
                key={tl.id}
                type="button"
                onClick={() => setToolId(tl.id)}
                style={{
                  padding: '8px 6px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: active ? OS_TOKENS.surface : 'transparent',
                  border: `1px solid ${active ? OS_TOKENS.line : 'transparent'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'inherit',
                }}
              >
                <BrandTile
                  toolId={tl.id}
                  fallbackGlyph={tl.glyph}
                  size={26}
                  radius={6}
                />
                <span
                  style={{
                    fontSize: 10.5,
                    color: active ? OS_TOKENS.ink : OS_TOKENS.inkMute,
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {tl.cli}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel htmlFor="cred-alias" hint={t.fieldAliasHint} required>
            {t.fieldAlias}
          </FieldLabel>
          <Input
            id="cred-alias"
            mono
            value={alias}
            placeholder="work-monorepo"
            autoFocus
            invalid={aliasConflict}
            leading={
              <BrandTile
                toolId={tool.id}
                fallbackGlyph={tool.glyph}
                size={18}
                radius={4}
              />
            }
            onChange={(e) => setAliasRaw(e.target.value)}
          />
          {aliasConflict && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: OS_TOKENS.danger,
                fontFamily: OS_TOKENS.mono,
              }}
            >
              {tool.cli} → {aliasClean} already exists in the pool
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel hint={t.credInputHint}>{t.credInputLabel}</FieldLabel>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 8,
              background: OS_TOKENS.sunken,
              border: `1px dashed ${OS_TOKENS.line}`,
            }}
          >
            <BrandTile
              toolId={tool.id}
              fallbackGlyph={tool.glyph}
              size={32}
              radius={7}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                {tool.name} · live config snapshot
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: OS_TOKENS.inkMute,
                  fontFamily: OS_TOKENS.mono,
                  marginTop: 3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={tool.targets.map((t) => t.target).join(' · ')}
              >
                {tool.targets.length > 0
                  ? tool.targets.map((t) => t.target).join(' · ')
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        <Separator style={{ margin: '18px 0 14px' }} />

        <FieldLabel hint={t.bindImmediatelyHint}>{t.bindImmediately}</FieldLabel>
        <div
          style={{
            border: `1px solid ${OS_TOKENS.line}`,
            borderRadius: 8,
            overflow: 'hidden',
            background: OS_TOKENS.surface,
          }}
        >
          {state.envs.map((e, i) => {
            const checked = bindTo.has(e.id);
            const n = Object.values(e.bindings).filter(Boolean).length;
            return (
              <div
                key={e.id}
                onClick={() => toggleBind(e.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderTop: i === 0 ? 'none' : `1px solid ${OS_TOKENS.lineSoft}`,
                  cursor: 'pointer',
                  background: checked ? OS_TOKENS.accentSoft : 'transparent',
                }}
              >
                <Check
                  checked={checked}
                  onChange={() => toggleBind(e.id)}
                  ariaLabel={`Bind to ${e.name}`}
                />
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: OS_TOKENS.ink,
                    color: OS_TOKENS.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10.5,
                    fontWeight: 600,
                  }}
                >
                  {e.name[0]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: OS_TOKENS.inkMute }}>
                    {e.hint || '—'} · {n} tools
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    color: OS_TOKENS.inkMute,
                    fontFamily: OS_TOKENS.mono,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {checked ? `${tool.cli} → ${aliasClean || '…'}` : ''}
                </span>
              </div>
            );
          })}
        </div>

        {err && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 6,
              background: OS_TOKENS.dangerSoft,
              color: OS_TOKENS.danger,
              fontSize: 12,
            }}
          >
            {err}
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <span
          style={{
            fontSize: 11.5,
            color: OS_TOKENS.inkMute,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: OS_TOKENS.ok,
            }}
          />
          {t.noteSnapshot}
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 11,
            color: OS_TOKENS.inkMute,
            fontFamily: OS_TOKENS.mono,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Kbd>esc</Kbd>
        </span>
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {t.cancel}
        </Button>
        <Button onClick={submit} disabled={!canSubmit}>
          {busy ? '…' : t.addToPool}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
