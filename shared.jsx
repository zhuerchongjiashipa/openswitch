// Shared data & tokens for OpenSwitch explorations.
// Everything here is mock data — authorizations are stored as short opaque
// strings; nothing is ever sent anywhere.

const OS_TOKENS = {
  // Warm neutral whites / grays — subtle, not clinical blue-white
  bg:        '#fbfaf8',
  surface:   '#ffffff',
  sunken:    '#f5f3ef',
  line:      '#e7e3dc',
  lineSoft:  '#eee9e1',
  ink:       '#1c1a17',
  inkSoft:   '#55504a',
  inkMute:   '#8a8279',
  inkFaint:  '#b7afa4',
  // Single accent — muted graphite-blue
  accent:    'oklch(0.52 0.09 250)',
  accentSoft:'oklch(0.92 0.025 250)',
  accentInk: 'oklch(0.38 0.08 250)',
  // State colors (desaturated to match the neutral register)
  ok:        'oklch(0.58 0.09 155)',
  okSoft:    'oklch(0.94 0.03 155)',
  warn:      'oklch(0.70 0.10 70)',
  warnSoft:  'oklch(0.95 0.04 70)',
  danger:    'oklch(0.58 0.12 25)',
  dangerSoft:'oklch(0.95 0.04 25)',
  // Fonts
  sans:      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono:      '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// ─── Tools ─────────────────────────────────────────────────────────────
// id, name, cli command, minimal monogram glyph
const OS_TOOLS = [
  { id: 'git',      name: 'Git',             cli: 'git',       glyph: 'G'  },
  { id: 'wrangler', name: 'Wrangler',        cli: 'wrangler',  glyph: 'W'  },
  { id: 'codex',    name: 'Codex CLI',       cli: 'codex',     glyph: 'Cx' },
  { id: 'claude',   name: 'Claude Code',     cli: 'claude',    glyph: 'Cl' },
  { id: 'npm',      name: 'npm / pnpm',      cli: 'npm',       glyph: 'N'  },
  { id: 'aws',      name: 'AWS CLI',         cli: 'aws',       glyph: 'A'  },
  { id: 'docker',   name: 'Docker Registry', cli: 'docker',    glyph: 'D'  },
];

const OS_TOOLS_BY_ID = Object.fromEntries(OS_TOOLS.map(t => [t.id, t]));

// ─── Authorization pool (aliases only, per user spec) ──────────────────
// Each credential: { id, tool, alias, addedISO }
const OS_POOL = [
  // Git
  { id: 'c1',  tool: 'git',      alias: 'personal'        , addedISO: '2025-11-08' },
  { id: 'c2',  tool: 'git',      alias: 'work-monorepo'   , addedISO: '2026-01-14' },
  { id: 'c3',  tool: 'git',      alias: 'open-source'     , addedISO: '2025-06-02' },
  { id: 'c4',  tool: 'git',      alias: 'client-northwind', addedISO: '2026-03-21' },
  // Wrangler
  { id: 'c5',  tool: 'wrangler', alias: 'personal-zone'   , addedISO: '2025-09-11' },
  { id: 'c6',  tool: 'wrangler', alias: 'acme-prod'       , addedISO: '2026-02-02' },
  { id: 'c7',  tool: 'wrangler', alias: 'acme-staging'    , addedISO: '2026-02-02' },
  // Codex
  { id: 'c8',  tool: 'codex',    alias: 'personal-plus'   , addedISO: '2026-01-30' },
  { id: 'c9',  tool: 'codex',    alias: 'team-pool'       , addedISO: '2026-02-18' },
  // Claude Code
  { id: 'c10', tool: 'claude',   alias: 'personal'        , addedISO: '2025-12-04' },
  { id: 'c11', tool: 'claude',   alias: 'work-seat'       , addedISO: '2026-03-02' },
  // npm
  { id: 'c12', tool: 'npm',      alias: 'personal'        , addedISO: '2024-11-19' },
  { id: 'c13', tool: 'npm',      alias: 'acme-private'    , addedISO: '2026-01-05' },
  // AWS
  { id: 'c14', tool: 'aws',      alias: 'acme-prod-admin' , addedISO: '2025-10-10' },
  { id: 'c15', tool: 'aws',      alias: 'acme-sandbox'    , addedISO: '2026-03-28' },
  { id: 'c16', tool: 'aws',      alias: 'personal-lab'    , addedISO: '2025-04-22' },
  // Docker
  { id: 'c17', tool: 'docker',   alias: 'ghcr-personal'   , addedISO: '2025-07-11' },
  { id: 'c18', tool: 'docker',   alias: 'acme-ecr'        , addedISO: '2026-02-12' },
];

// ─── Environments ──────────────────────────────────────────────────────
// Each env binds at most one credential per tool (by credential id).
// Unbound tool = inherit from system default / leave as-is.
const OS_ENVS = [
  {
    id: 'personal',
    name: 'Personal',
    hint: 'Side projects, OSS',
    bindings: {
      git:      'c1',
      wrangler: 'c5',
      codex:    'c8',
      claude:   'c10',
      npm:      'c12',
      aws:      'c16',
      docker:   'c17',
    },
  },
  {
    id: 'work',
    name: 'Work · Acme',
    hint: 'Acme monorepo & infra',
    bindings: {
      git:      'c2',
      wrangler: 'c6',
      codex:    'c9',
      claude:   'c11',
      npm:      'c13',
      aws:      'c14',
      docker:   'c18',
    },
  },
  {
    id: 'staging',
    name: 'Work · Staging',
    hint: 'Acme staging envs only',
    bindings: {
      git:      'c2',
      wrangler: 'c7',
      aws:      'c15',
      docker:   'c18',
      npm:      'c13',
      claude:   'c11',
      codex:    'c9',
    },
  },
  {
    id: 'oss',
    name: 'Open source',
    hint: 'Contributing to public repos',
    bindings: {
      git:      'c3',
      npm:      'c12',
      claude:   'c10',
      codex:    'c8',
    },
  },
  {
    id: 'client',
    name: 'Client · Northwind',
    hint: 'Short-term client work',
    bindings: {
      git:      'c4',
      claude:   'c11',
      codex:    'c9',
    },
  },
];

const OS_ENVS_BY_ID = Object.fromEntries(OS_ENVS.map(e => [e.id, e]));
const OS_POOL_BY_ID = Object.fromEntries(OS_POOL.map(c => [c.id, c]));

// Small helpers
function osCredsForTool(toolId) {
  return OS_POOL.filter(c => c.tool === toolId);
}
function osFmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

Object.assign(window, {
  OS_TOKENS, OS_TOOLS, OS_TOOLS_BY_ID,
  OS_POOL, OS_POOL_BY_ID, osCredsForTool,
  OS_ENVS, OS_ENVS_BY_ID, osFmtDate,
});
