use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub type ToolId = String;
pub type CredId = String;
pub type EnvId = String;

/// One file to swap when activating a credential.
///
/// * `pool_name` — file name inside the pool folder for the credential.
/// * `target` — absolute path (may start with `~`) to copy to when the
///   credential is activated.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TargetFile {
    pub pool_name: String,
    pub target: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tool {
    pub id: ToolId,
    pub name: String,
    pub cli: String,
    pub glyph: String,
    /// Target files for this tool. Defaults seeded on first run; the user
    /// can edit them from the UI and the changes persist in `state.json`.
    #[serde(default)]
    pub targets: Vec<TargetFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credential {
    pub id: CredId,
    pub tool: ToolId,
    pub alias: String,
    #[serde(rename = "addedISO")]
    pub added_iso: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Environment {
    pub id: EnvId,
    pub name: String,
    pub hint: String,
    #[serde(default)]
    pub bindings: BTreeMap<ToolId, CredId>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub tools: Vec<Tool>,
    pub pool: Vec<Credential>,
    pub envs: Vec<Environment>,
    pub active_env: EnvId,
    #[serde(default = "default_version")]
    pub version: u32,
}

fn default_version() -> u32 {
    1
}

impl AppState {
    pub fn fresh() -> Self {
        Self {
            tools: default_tools(),
            pool: Vec::new(),
            envs: vec![Environment {
                id: "personal".into(),
                name: "Personal".into(),
                hint: "Default environment".into(),
                bindings: BTreeMap::new(),
            }],
            active_env: "personal".into(),
            version: 1,
        }
    }

    /// Fill in platform-default `targets` for any tool that currently has
    /// none (fresh install, forward migration, etc.). Preserves any
    /// user-customised overrides that are already present.
    pub fn fill_missing_targets(&mut self) {
        for t in &mut self.tools {
            if t.targets.is_empty() {
                t.targets = platform_default_targets(&t.id);
            }
        }
    }

    pub fn find_env(&self, id: &str) -> Option<&Environment> {
        self.envs.iter().find(|e| e.id == id)
    }

    pub fn find_env_mut(&mut self, id: &str) -> Option<&mut Environment> {
        self.envs.iter_mut().find(|e| e.id == id)
    }

    pub fn find_cred(&self, id: &str) -> Option<&Credential> {
        self.pool.iter().find(|c| c.id == id)
    }

    pub fn find_tool(&self, id: &str) -> Option<&Tool> {
        self.tools.iter().find(|t| t.id == id)
    }

    pub fn find_tool_mut(&mut self, id: &str) -> Option<&mut Tool> {
        self.tools.iter_mut().find(|t| t.id == id)
    }
}

pub fn default_tools() -> Vec<Tool> {
    [
        ("git", "Git", "git", "G"),
        ("wrangler", "Wrangler", "wrangler", "W"),
        ("codex", "Codex CLI", "codex", "Cx"),
        ("claude", "Claude Code", "claude", "Cl"),
        ("npm", "npm / pnpm", "npm", "N"),
        ("aws", "AWS CLI", "aws", "A"),
        ("docker", "Docker Registry", "docker", "D"),
    ]
    .into_iter()
    .map(|(id, name, cli, glyph)| Tool {
        id: id.into(),
        name: name.into(),
        cli: cli.into(),
        glyph: glyph.into(),
        targets: platform_default_targets(id),
    })
    .collect()
}

fn tf(pool_name: &str, target: &str) -> TargetFile {
    TargetFile {
        pool_name: pool_name.into(),
        target: target.into(),
    }
}

/// Reasonable platform defaults for where each supported CLI stores its
/// credentials. Most paths happen to be the same across platforms because
/// these tools all resolve `~` / `%USERPROFILE%` themselves; the
/// `#[cfg]` branching is in place for future-proofing and for the few
/// tools where Windows diverges.
pub fn platform_default_targets(tool_id: &str) -> Vec<TargetFile> {
    match tool_id {
        "git" => vec![
            tf(".gitconfig", "~/.gitconfig"),
            tf(".git-credentials", "~/.git-credentials"),
        ],

        "wrangler" => {
            #[cfg(windows)]
            {
                vec![tf(
                    "config.toml",
                    "~/AppData/Roaming/.wrangler/config/default.toml",
                )]
            }
            #[cfg(not(windows))]
            {
                vec![tf("config.toml", "~/.wrangler/config/default.toml")]
            }
        }

        "codex" => vec![tf("auth.json", "~/.codex/auth.json")],

        "claude" => vec![tf(".claude.json", "~/.claude.json")],

        "npm" => vec![tf(".npmrc", "~/.npmrc")],

        "aws" => vec![
            tf("credentials", "~/.aws/credentials"),
            tf("config", "~/.aws/config"),
        ],

        "docker" => {
            // Docker Desktop on Windows still keeps per-user config here;
            // the native `docker` CLI on WSL/Linux/macOS does too.
            vec![tf("config.json", "~/.docker/config.json")]
        }

        _ => vec![],
    }
}
