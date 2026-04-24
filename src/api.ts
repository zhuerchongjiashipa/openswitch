import { invoke } from '@tauri-apps/api/core';

export type ToolId = string;
export type CredId = string;
export type EnvId = string;

export interface TargetFile {
  pool_name: string;
  target: string;
}

export interface Tool {
  id: ToolId;
  name: string;
  cli: string;
  glyph: string;
  targets: TargetFile[];
}

export interface Credential {
  id: CredId;
  tool: ToolId;
  alias: string;
  addedISO: string;
}

export interface Environment {
  id: EnvId;
  name: string;
  hint: string;
  bindings: Record<ToolId, CredId>;
}

export interface AppState {
  tools: Tool[];
  pool: Credential[];
  envs: Environment[];
  active_env: EnvId;
  version: number;
}

export interface SwitchOutcome {
  tool: string;
  alias: string;
  written: string[];
  state: AppState;
}

export interface EnvSwitchOutcome {
  env: string;
  outcomes: SwitchOutcome[];
  state: AppState;
}

export const api = {
  getState: () => invoke<AppState>('get_state'),
  addEnvironment: (id: string, name: string, hint: string) =>
    invoke<AppState>('add_environment', { id, name, hint }),
  removeEnvironment: (id: string) =>
    invoke<AppState>('remove_environment', { id }),
  setActiveEnvironment: (id: string) =>
    invoke<AppState>('set_active_environment', { id }),
  importCredential: (tool: string, alias: string) =>
    invoke<AppState>('import_credential', { tool, alias }),
  removeCredential: (id: string) =>
    invoke<AppState>('remove_credential', { id }),
  activateCredential: (envId: string, tool: string, credId: string) =>
    invoke<SwitchOutcome>('activate_credential', { envId, tool, credId }),
  switchEnvironment: (envId: string) =>
    invoke<EnvSwitchOutcome>('switch_environment', { envId }),
  updateToolPaths: (tool: string, targets: TargetFile[]) =>
    invoke<AppState>('update_tool_paths', { tool, targets }),
  resetToolPaths: (tool: string) =>
    invoke<AppState>('reset_tool_paths', { tool }),
};

export function credsForTool(state: AppState, toolId: ToolId): Credential[] {
  return state.pool.filter((c) => c.tool === toolId);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
