use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// Stable identifier for a supported CLI tool.
pub type ToolId = String;

/// Stable identifier for a credential (opaque, we generate it).
pub type CredId = String;

/// Stable identifier for an environment.
pub type EnvId = String;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tool {
    pub id: ToolId,
    pub name: String,
    pub cli: String,
    pub glyph: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credential {
    pub id: CredId,
    pub tool: ToolId,
    pub alias: String,
    /// ISO-8601 date (yyyy-mm-dd) when the credential was added.
    #[serde(rename = "addedISO")]
    pub added_iso: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Environment {
    pub id: EnvId,
    pub name: String,
    pub hint: String,
    /// tool id → credential id (only bound tools appear).
    #[serde(default)]
    pub bindings: BTreeMap<ToolId, CredId>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub tools: Vec<Tool>,
    pub pool: Vec<Credential>,
    pub envs: Vec<Environment>,
    pub active_env: EnvId,
    /// Schema version for forward-compat migrations.
    #[serde(default = "default_version")]
    pub version: u32,
}

fn default_version() -> u32 {
    1
}

impl AppState {
    /// Fresh install: the supported tool catalogue + one empty "Personal"
    /// environment. No fake credentials.
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

    pub fn find_env(&self, id: &str) -> Option<&Environment> {
        self.envs.iter().find(|e| e.id == id)
    }

    pub fn find_env_mut(&mut self, id: &str) -> Option<&mut Environment> {
        self.envs.iter_mut().find(|e| e.id == id)
    }

    pub fn find_cred(&self, id: &str) -> Option<&Credential> {
        self.pool.iter().find(|c| c.id == id)
    }
}

pub fn default_tools() -> Vec<Tool> {
    vec![
        tool("git", "Git", "git", "G"),
        tool("wrangler", "Wrangler", "wrangler", "W"),
        tool("codex", "Codex CLI", "codex", "Cx"),
        tool("claude", "Claude Code", "claude", "Cl"),
        tool("npm", "npm / pnpm", "npm", "N"),
        tool("aws", "AWS CLI", "aws", "A"),
        tool("docker", "Docker Registry", "docker", "D"),
    ]
}

fn tool(id: &str, name: &str, cli: &str, glyph: &str) -> Tool {
    Tool {
        id: id.into(),
        name: name.into(),
        cli: cli.into(),
        glyph: glyph.into(),
    }
}
