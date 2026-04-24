# OpenSwitch — Development Plan

A Tauri 2 + React + Rust desktop app that swaps per-tool CLI credentials
(git, aws, npm, docker, wrangler, codex, claude) by copying files from a
local "pool" onto each tool's live config path. Inspired by `cc-switch`,
extended with environment groups.

Design origin: handoff bundle from Claude Design
(`/tmp/design/openswitch/` snapshot; key files were `README.md`,
`chats/chat1.md`, `project/OpenSwitch.html`, `project/shared.jsx`,
`project/option-console.jsx`).

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│ React frontend (src/)                                │
│   OpenSwitchConsole.tsx  — main UI                   │
│   PathsModal.tsx         — per-tool path editor      │
│   api.ts                 — invoke() wrappers + types │
│   data.ts                — design tokens             │
└──────────────────────────────────────────────────────┘
                         │ tauri invoke
                         ▼
┌──────────────────────────────────────────────────────┐
│ Rust backend (src-tauri/src/)                        │
│   lib.rs        — Tauri setup, command registration  │
│   model.rs      — Tool / Credential / Environment    │
│                   / AppState / platform defaults     │
│   state.rs      — Store: in-mem + atomic JSON write  │
│   paths.rs      — AppPaths + ~ expansion             │
│   switcher.rs   — activate / import_live / validate  │
│   commands.rs   — Tauri commands                     │
│   error.rs      — AppError + serde-friendly display  │
└──────────────────────────────────────────────────────┘
                         │ fs
                         ▼
  <app_data>/state.json
  <app_data>/pool/<tool>/<alias>/<file…>
  <app_data>/backups/<tool>/<yyyymmddThhmmssZ>/<file…>
```

**Activation flow:** click a pool chip →
`activate_credential(env_id, tool, cred_id)` → resolve tool/alias under
lock → `switcher::activate(paths, tool, alias)` copies each
`pool/<tool>/<alias>/<pool_name>` over its declared `target`, stashing
previous contents under `backups/<tool>/<stamp>/` → update `env.bindings`
→ atomic write of `state.json`.

**Import flow:** "+ add <tool>" → prompt for alias →
`import_credential(tool, alias)` → `switcher::import_live` copies each
declared target that exists on disk into a new pool folder → pool entry
registered in `state.json`.

---

## Status

### Completed

- [x] **Vite + React + TypeScript scaffold** (`ce1d341`)
  - `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`
  - Inter + JetBrains Mono via Google Fonts
  - Design tokens in `src/data.ts` (OS_TOKENS)
  - `src/OpenSwitchConsole.tsx` ported from the design prototype

- [x] **Tauri 2 shell** (`7b89894`)
  - `src-tauri/Cargo.toml` (tauri 2, tauri-plugin-opener, serde,
    thiserror, chrono, dirs, parking_lot)
  - `src-tauri/tauri.conf.json`, `build.rs`,
    `capabilities/default.json`
  - Placeholder PNG icons (32/128/256); empty `.icns` / `.ico`
    placeholders — replace before bundling for macOS/Windows
  - Dev window: 1280×820, min 980×600
  - `npm run tauri:dev` / `npm run tauri:build` scripts

- [x] **State + persistence** (`7b89894`)
  - `AppState { tools, pool, envs, active_env, version }`
  - `Store` (parking_lot Mutex) with atomic write via tmp+rename
  - Loads from `<app_data>/state.json`, creates fresh on first run
  - Fresh = tool catalogue + one empty "Personal" env, no fake data

- [x] **Real file-swap switcher** (`7b89894`, evolved in `2cb4f53`)
  - `switcher::activate(paths, &Tool, alias)` — copy pool →
    target, backup previous contents
  - `switcher::import_live` — snapshot live config into pool
  - `switcher::remove_pool_entry` — rm pool folder
  - `switcher::validate_targets` — reject empty/duplicate/slashed names
  - Backups go to `<app_data>/backups/<tool>/<stamp>/<filename>`

- [x] **Tauri commands** (`7b89894`, extended in `2cb4f53`)
  - `get_state`
  - `add_environment(id, name, hint)` / `remove_environment(id)` /
    `set_active_environment(id)`
  - `import_credential(tool, alias)` / `remove_credential(id)`
  - `activate_credential(env_id, tool, cred_id)` →
    `SwitchOutcome { tool, alias, written, state }`
  - `switch_environment(env_id)` →
    `EnvSwitchOutcome { env, outcomes, state }` (per-tool best-effort,
    surfaces errors without aborting)
  - `update_tool_paths(tool, targets)` / `reset_tool_paths(tool)`

- [x] **Frontend ↔ Rust wiring** (`7b89894`)
  - `src/api.ts` — typed `invoke` wrappers, `AppState` / `Tool` /
    `Credential` / `Environment` / `TargetFile` / outcomes
  - Console fetches state on mount; all mutations go through `api.*`
  - Graceful fallback screen when backend isn't reachable (i.e. when
    opened under plain `vite` without the Tauri shell)

- [x] **Credential CRUD UI** (`2447261`)
  - "+ add &lt;tool&gt;" button on each column → prompt → `import_credential`
  - × button on pool chip hover → confirm → `remove_credential`
    (unbinds from every environment automatically)

- [x] **Environment CRUD UI** (`2447261`)
  - Workspace dropdown top-left
  - Clicking an env → `switch_environment` (swaps all bound tools at
    once; toast summarises success / partial failure)
  - "New environment…" → prompts for name + optional hint, slugifies,
    calls `add_environment`
  - × button on non-active env row → confirm → `remove_environment`
  - Last environment cannot be deleted (UI hides ×; backend also
    rejects)

- [x] **Configurable target paths** (`2cb4f53`)
  - `Tool.targets: Vec<TargetFile>` stored in `state.json`
  - `platform_default_targets(tool_id)` with `#[cfg(windows)]` /
    `#[cfg(not(windows))]` — wrangler currently has a real split
    (Unix `~/.wrangler/…` vs Windows `~/AppData/Roaming/.wrangler/…`)
  - `fill_missing_targets()` backfills defaults on load (forward-compat
    for new tools without schema migration)
  - `PathsModal` (click ⋯ on a column): grid of (pool_name, target)
    rows, add/remove per row, Save / Cancel / Reset-to-defaults
  - Validation in Rust: non-empty, unique pool_names, no `/` or `\`
    inside pool_name (prevents escaping the pool dir)

- [x] **Build hygiene**
  - `cargo check` / `cargo build --bin openswitch` clean on Linux
    (webkit2gtk-4.1-dev, javascriptcoregtk-4.1-dev, libsoup-3.0-dev
    required)
  - `tsc -b && vite build` clean (strict mode, noUnusedLocals,
    noUnusedParameters)

- [x] **Backup restoration** (`13c9241`)
  - `switcher::list_backups(paths, tool) -> Vec<BackupEntry { stamp,
    iso, files }>` walks `<app_data>/backups/<tool>/` and parses each
    stamp back into an ISO-8601 display string.
  - `switcher::restore_backup(paths, &Tool, stamp)` matches each
    backup file against the tool's current targets by basename, takes
    a fresh backup of the current live state first (so the restore
    itself can be undone), then copies back.
  - Tauri commands: `list_backups(tool)`, `restore_backup(tool,
    stamp) -> RestoreOutcome`.
  - UI: `PathsModal` now has `Paths` / `History` tabs. History lazy-
    loads on first open; each row shows a localized date + raw stamp
    + file list + a Restore button. Restore prompts for confirmation
    before running.
  - `PathsModal` prop renamed: `onError` → `onToast(msg, ok)` so the
    same channel can carry success + failure messages.

### Not yet implemented

- [ ] **Per-environment tool selection**
  - Right now `switch_environment` touches every bound tool. Some
    users want an env that e.g. doesn't clobber AWS.
  - Data: either (a) make `bindings[tool]` a sentinel like `null` vs
    absent, and teach the switcher to skip absent keys (already happens)
    but add UI to remove a binding without deleting the credential, or
    (b) add a per-env `enabled_tools: Set<ToolId>` mask.
  - UI: ability to "unbind" a tool from a specific env (currently
    activating sets it; there's no "clear" on the chip).

- [ ] **Working search (⌘K)**
  - Topbar shows a fake search pill today. Implement a command palette
    that filters across credential aliases and tool names, with
    keyboard nav. Keep it client-side over `AppState`.

- [ ] **Environment editing**
  - Rename / edit hint: add `update_environment(id, name, hint)`
    command and a small inline edit UI.
  - Duplicate env: copy another env's bindings as a starting point.

- [ ] **Tweaks panel parity with the prototype**
  - The original design exposed `density` (compact / comfortable) and
    `cliPreviewOpen` via an edit-mode postMessage protocol. Ported code
    kept `density` as a const; surface density + CLI drawer toggle in
    a proper settings affordance (sidebar or Preferences window).

- [ ] **Real icons**
  - Replace `src-tauri/icons/*.png` placeholders (solid ink squares)
    and the zero-byte `.icns` / `.ico`. Use `cargo tauri icon
    path/to/source.png` once an asset exists.

- [ ] **Packaging**
  - CI job (GitHub Actions) that runs `cargo test`, `npm run build`,
    and produces signed bundles for macOS / Windows / Linux.
  - Auto-update config (tauri-plugin-updater) if desired.

- [ ] **Tests**
  - Rust unit tests for `switcher::{activate, import_live,
    validate_targets}` using a temp dir.
  - Rust integration test for one command (e.g. `activate_credential`)
    via `Store` in a tempdir.
  - Frontend: none yet; consider vitest + React Testing Library for
    `PathsModal` validation paths.

- [ ] **Windows coverage**
  - Currently only built on Linux. The `#[cfg(windows)]` arm for
    wrangler exists but hasn't been validated on a real Windows host.
  - Verify `dirs::home_dir()` semantics and that
    `fs::copy` handles reparse points / symlinks the way we expect.

- [ ] **Error ergonomics**
  - `AppError` renders as plain strings to the frontend; consider a
    structured `{ code, message, details }` so the UI can show
    different affordances for "conflict" vs "not found" vs "io".
  - Toasts truncate long paths; show full path on hover.

- [ ] **Import from cc-switch**
  - Optional one-shot command that reads `~/.cc-switch/` (or similar)
    and materializes its Claude Code aliases into our pool.

- [ ] **Atomic full-env swap**
  - `switch_environment` is best-effort; failures leave a partial
    state. Either all-or-nothing (stage writes to tmp, commit at end)
    or record each outcome and offer an undo that restores from the
    shared backup stamp.

---

## Key files (quick reference)

### Rust

| File                              | Purpose                                     |
|-----------------------------------|---------------------------------------------|
| `src-tauri/Cargo.toml`            | Crate + feature flags                       |
| `src-tauri/tauri.conf.json`       | App identity, window, bundle config         |
| `src-tauri/capabilities/default.json` | Permission ACL                          |
| `src-tauri/src/main.rs`           | Binary entry (calls `run()`)                |
| `src-tauri/src/lib.rs`            | Tauri Builder, command registration         |
| `src-tauri/src/model.rs`          | Types + `platform_default_targets`          |
| `src-tauri/src/state.rs`          | `Store`, atomic JSON persistence            |
| `src-tauri/src/paths.rs`          | `AppPaths`, `expand_home`, `home_dir`       |
| `src-tauri/src/switcher.rs`       | File-swap implementation                    |
| `src-tauri/src/commands.rs`       | All `#[tauri::command]` functions           |
| `src-tauri/src/error.rs`          | `AppError` + `Result<T>`                    |

### Frontend

| File                             | Purpose                              |
|----------------------------------|--------------------------------------|
| `src/main.tsx`                   | React root                           |
| `src/OpenSwitchConsole.tsx`      | Main screen                          |
| `src/PathsModal.tsx`             | Per-tool path editor                 |
| `src/api.ts`                     | `invoke` wrappers + shared types     |
| `src/data.ts`                    | `OS_TOKENS` design tokens            |
| `src/styles.css`                 | Global resets, scrollbar, fonts      |
| `index.html`                     | Vite entry                           |
| `vite.config.ts`                 | Fixed port 1420, Tauri env vars      |

---

## On-disk layout (per-OS `<app_data>`)

- macOS: `~/Library/Application Support/com.openswitch.app/`
- Linux: `~/.local/share/com.openswitch.app/`
- Windows: `%APPDATA%\com.openswitch.app\`

```
<app_data>/
  state.json                      # full AppState (pretty)
  pool/<tool>/<alias>/<file…>     # per-credential snapshots
  backups/<tool>/<stamp>/<file…>  # previous live contents
```

---

## Commit log

```
13c9241  Add backup history + restore
f56addf  Add plan.md for handoff
2cb4f53  Make tool target paths configurable + platform-aware
2447261  Wire credential + environment CRUD UI
7b89894  Add Tauri Rust backend for real CLI auth switching
ce1d341  Scaffold OpenSwitch Console as Vite + React + TS app
```

---

## Continuing development

### Build

```sh
# one-time host setup (Linux)
sudo apt-get install -y libwebkit2gtk-4.1-dev \
                        libjavascriptcoregtk-4.1-dev \
                        libsoup-3.0-dev

npm install
npm run tauri:dev          # dev shell
npm run tauri:build        # production bundle

# sanity checks
npm run build              # tsc + vite
( cd src-tauri && cargo check )
```

### Adding a new tool

1. Append an entry in `model::default_tools()` (id, name, cli, glyph).
2. Add a match arm in `model::platform_default_targets(tool_id)`
   returning the default `TargetFile`s.
3. Add a `cliCommandFor(tool, alias)` arm in
   `src/OpenSwitchConsole.tsx` for the CLI-preview drawer.
4. Existing state files auto-backfill via `fill_missing_targets()` on
   load — no migration needed.

### Adding a new Tauri command

1. Write the function in `src-tauri/src/commands.rs` with
   `#[tauri::command]`; take `State<'_, Store>` if it touches state.
2. Register it in `src-tauri/src/lib.rs` inside
   `tauri::generate_handler![…]`.
3. Add a typed wrapper in `src/api.ts`.
4. Capabilities in `capabilities/default.json` don't need changes for
   in-app commands (only plugin APIs).

### State migrations

`AppState.version` is serialized. When making a breaking change:

- Bump the default in `model::default_version` and any fresh-install
  code paths.
- In `state::read_or_init`, branch on the loaded `version` before
  deserializing into the current shape (consider deserializing into a
  `serde_json::Value` first for complex migrations).

### Design reference

`/tmp/design/openswitch/project/OpenSwitch.html` (if still available in
the session) is the canonical visual spec. The tokens in
`src/data.ts::OS_TOKENS` mirror it 1:1.
