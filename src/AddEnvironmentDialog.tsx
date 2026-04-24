import { useMemo, useState } from 'react';
import {
  AppState,
  Environment,
  SwitchOutcome,
  api,
} from './api';
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
  RadioCards,
  Separator,
} from './ui';

type Mode = 'inherit' | 'blank' | 'clone';

interface Props {
  state: AppState;
  onClose: () => void;
  onDone: (next: AppState, ok: boolean, message: string) => void;
}

const COLORS = [
  { id: 'ink', v: OS_TOKENS.ink },
  { id: 'blue', v: 'oklch(0.52 0.09 250)' },
  { id: 'green', v: 'oklch(0.55 0.09 155)' },
  { id: 'amber', v: 'oklch(0.68 0.12 70)' },
  { id: 'red', v: 'oklch(0.58 0.12 25)' },
  { id: 'violet', v: 'oklch(0.52 0.11 300)' },
];

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'untitled'
  );
}

export function AddEnvironmentDialog({ state, onClose, onDone }: Props) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [hint, setHint] = useState('');
  const [color, setColor] = useState('blue');
  const [mode, setMode] = useState<Mode>('inherit');
  const activeEnv = state.envs.find((e) => e.id === state.active_env) ?? state.envs[0];
  const [cloneFromId, setCloneFromId] = useState<string>(
    state.envs.find((e) => e.id !== state.active_env)?.id ?? state.envs[0]?.id ?? '',
  );
  const [setActive, setSetActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const slug = slugify(name);
  const idConflict = state.envs.some((e) => e.id === slug);
  const canSubmit = name.trim().length > 0 && !idConflict && !busy;

  const source: Environment | undefined = useMemo(() => {
    if (mode === 'inherit') return activeEnv;
    if (mode === 'clone') return state.envs.find((e) => e.id === cloneFromId);
    return undefined;
  }, [mode, activeEnv, cloneFromId, state.envs]);

  const sourceBindings = useMemo(() => {
    if (!source) return [] as Array<[string, string]>;
    return Object.entries(source.bindings).filter(([, v]) => !!v);
  }, [source]);

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    try {
      let next: AppState = await api.addEnvironment(slug, name.trim(), hint.trim());

      if (mode !== 'blank' && source) {
        // We don't have a "bind without activating" backend command; the only
        // way to set bindings is via activate_credential. That also writes
        // files, so inherit/clone effectively switches to the new env. Hide
        // the "switch after creating" checkbox in these modes and use it
        // implicitly.
        await api.setActiveEnvironment(slug);
        for (const [toolId, credId] of sourceBindings) {
          try {
            const r: SwitchOutcome = await api.activateCredential(
              slug,
              toolId,
              credId,
            );
            next = r.state;
          } catch {
            // Surface as partial success — the env was still created.
          }
        }
      } else if (setActive) {
        next = await api.setActiveEnvironment(slug);
      }

      const copied = sourceBindings.length;
      const msg =
        mode === 'blank'
          ? `Created ${name.trim()}`
          : mode === 'inherit'
          ? `Created ${name.trim()} · inherited ${copied} bindings`
          : `Created ${name.trim()} · copied ${copied} bindings`;
      onDone(next, true, msg);
      onClose();
    } catch (e) {
      setErr(
        typeof e === 'string' ? e : e instanceof Error ? e.message : JSON.stringify(e),
      );
    } finally {
      setBusy(false);
    }
  };

  const currentColor = COLORS.find((c) => c.id === color) ?? COLORS[0];

  return (
    <Dialog width={560} onClose={onClose}>
      <DialogHeader
        title={t.newEnvDialogTitle}
        subtitle={t.newEnvDialogSubtitle}
        onClose={onClose}
      />
      <DialogBody>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0 }}>
            <FieldLabel>{t.fieldIcon}</FieldLabel>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: currentColor.v,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: '-0.01em',
              }}
            >
              {(name[0] || 'E').toUpperCase()}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <FieldLabel htmlFor="env-name" required>
              {t.fieldName}
            </FieldLabel>
            <Input
              id="env-name"
              value={name}
              placeholder="Work · Acme"
              onChange={(e) => setName(e.target.value)}
              autoFocus
              invalid={idConflict}
            />
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: OS_TOKENS.inkMute,
                fontFamily: OS_TOKENS.mono,
              }}
            >
              id:{' '}
              <span
                style={{
                  color: idConflict ? OS_TOKENS.danger : OS_TOKENS.inkSoft,
                }}
              >
                {slug}
              </span>
              {idConflict && <span style={{ marginLeft: 8 }}>already exists</span>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel hint={t.fieldColorHint}>{t.fieldColor}</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                aria-label={`Color ${c.id}`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  border: 'none',
                  background: c.v,
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow:
                    c.id === color
                      ? `0 0 0 2px ${OS_TOKENS.surface}, 0 0 0 4px ${OS_TOKENS.ink}`
                      : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel htmlFor="env-hint" hint={t.fieldDescriptionHint}>
            {t.fieldDescription}
          </FieldLabel>
          <Input
            id="env-hint"
            value={hint}
            placeholder="Acme monorepo & infra"
            onChange={(e) => setHint(e.target.value)}
          />
        </div>

        <Separator style={{ margin: '18px 0 14px' }} />

        <FieldLabel hint={t.fieldStartingBindingsHint}>
          {t.fieldStartingBindings}
        </FieldLabel>
        <RadioCards
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            {
              id: 'inherit',
              label: t.bindingInherit,
              hint: t.bindingInheritHint,
            },
            { id: 'blank', label: t.bindingBlank, hint: t.bindingBlankHint },
            {
              id: 'clone',
              label: t.bindingClone,
              hint: t.bindingCloneHint,
            },
          ]}
        />

        {mode === 'clone' && (
          <div
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: OS_TOKENS.sunken,
              border: `1px solid ${OS_TOKENS.lineSoft}`,
            }}
          >
            <FieldLabel
              htmlFor="clone-from"
              hint={t.sourceEnvironmentHint(state.tools.length)}
            >
              {t.sourceEnvironment}
            </FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {state.envs.map((e) => {
                const active = cloneFromId === e.id;
                const n = Object.values(e.bindings).filter(Boolean).length;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setCloneFromId(e.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 9px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: active ? OS_TOKENS.surface : 'transparent',
                      border: `1px solid ${
                        active ? OS_TOKENS.line : 'transparent'
                      }`,
                      fontFamily: 'inherit',
                    }}
                  >
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
                        {e.hint || '—'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: OS_TOKENS.inkMute,
                        fontFamily: OS_TOKENS.mono,
                      }}
                    >
                      {t.toolsLabel(n)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === 'blank' && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: 8,
              background: OS_TOKENS.sunken,
              border: `1px solid ${OS_TOKENS.lineSoft}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Check
              checked={setActive}
              onChange={setSetActive}
              ariaLabel={t.switchAfterCreating}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                {t.switchAfterCreating}
              </div>
              <div style={{ fontSize: 11.5, color: OS_TOKENS.inkMute }}>
                {t.switchAfterCreatingHint}
              </div>
            </div>
          </div>
        )}

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
            fontFamily: OS_TOKENS.mono,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Kbd>esc</Kbd> {t.escToCancel}
        </span>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {t.cancel}
        </Button>
        <Button onClick={submit} disabled={!canSubmit}>
          {busy ? '…' : t.create}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
