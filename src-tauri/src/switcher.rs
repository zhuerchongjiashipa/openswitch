//! Per-tool switching logic.
//!
//! Model: for each tool we declare a list of target paths (e.g. git →
//! `~/.gitconfig` + `~/.git-credentials`). Each credential owns a folder
//! under `<app_data>/pool/<tool>/<alias>/` that mirrors the *file names* of
//! those targets. Activating a credential copies each present pool file
//! over its corresponding target, backing up the previous target first.
//!
//! The `import` direction goes the other way: pull the live config into
//! the pool folder so the user can snapshot their current setup.

use std::fs;
use std::path::{Path, PathBuf};

use chrono::Utc;

use crate::error::{AppError, Result};
use crate::paths::{expand_home, AppPaths};

/// A single file that participates in switching for a tool.
#[derive(Debug, Clone)]
pub struct TargetFile {
    /// File name inside the pool folder, e.g. `.gitconfig`.
    pub pool_name: &'static str,
    /// Absolute target path (may start with `~`).
    pub target: &'static str,
}

pub fn targets_for(tool: &str) -> &'static [TargetFile] {
    match tool {
        "git" => &[
            TargetFile { pool_name: ".gitconfig",       target: "~/.gitconfig" },
            TargetFile { pool_name: ".git-credentials", target: "~/.git-credentials" },
        ],
        "wrangler" => &[
            TargetFile { pool_name: "config.toml", target: "~/.wrangler/config/default.toml" },
        ],
        "codex" => &[
            TargetFile { pool_name: "auth.json", target: "~/.codex/auth.json" },
        ],
        "claude" => &[
            TargetFile { pool_name: ".claude.json", target: "~/.claude.json" },
        ],
        "npm" => &[
            TargetFile { pool_name: ".npmrc", target: "~/.npmrc" },
        ],
        "aws" => &[
            TargetFile { pool_name: "credentials", target: "~/.aws/credentials" },
            TargetFile { pool_name: "config",      target: "~/.aws/config" },
        ],
        "docker" => &[
            TargetFile { pool_name: "config.json", target: "~/.docker/config.json" },
        ],
        _ => &[],
    }
}

/// Activate a credential: copy its pool files onto the live targets.
/// Previous target contents are backed up to `<app_data>/backups/...`.
pub fn activate(paths: &AppPaths, tool: &str, alias: &str) -> Result<Vec<PathBuf>> {
    let pool_dir = paths.pool_dir(tool, alias);
    if !pool_dir.exists() {
        return Err(AppError::NotFound(format!(
            "pool dir for {tool}/{alias} not found"
        )));
    }

    let targets = targets_for(tool);
    if targets.is_empty() {
        return Err(AppError::Invalid(format!("unknown tool: {tool}")));
    }

    let stamp = Utc::now().format("%Y%m%dT%H%M%SZ").to_string();
    let mut written = Vec::new();

    for t in targets {
        let src = pool_dir.join(t.pool_name);
        if !src.exists() {
            continue;
        }
        let dst = expand_home(t.target)?;
        backup_if_present(paths, tool, &dst, &stamp)?;
        if let Some(parent) = dst.parent() {
            fs::create_dir_all(parent)?;
        }
        copy_file(&src, &dst)?;
        written.push(dst);
    }

    Ok(written)
}

/// Import the tool's current live configuration into the pool as `alias`.
/// Returns the list of files imported.
pub fn import_live(paths: &AppPaths, tool: &str, alias: &str) -> Result<Vec<PathBuf>> {
    let targets = targets_for(tool);
    if targets.is_empty() {
        return Err(AppError::Invalid(format!("unknown tool: {tool}")));
    }

    let pool_dir = paths.pool_dir(tool, alias);
    if pool_dir.exists() {
        return Err(AppError::Conflict(format!(
            "pool entry already exists: {tool}/{alias}"
        )));
    }
    fs::create_dir_all(&pool_dir)?;

    let mut imported = Vec::new();
    for t in targets {
        let src = expand_home(t.target)?;
        if !src.exists() {
            continue;
        }
        let dst = pool_dir.join(t.pool_name);
        copy_file(&src, &dst)?;
        imported.push(dst);
    }

    if imported.is_empty() {
        // Nothing was actually on disk; rollback so we don't leave an empty shell.
        let _ = fs::remove_dir_all(&pool_dir);
        return Err(AppError::NotFound(format!(
            "no live configuration found for {tool}"
        )));
    }

    Ok(imported)
}

/// Remove a pool entry's folder.
pub fn remove_pool_entry(paths: &AppPaths, tool: &str, alias: &str) -> Result<()> {
    let pool_dir = paths.pool_dir(tool, alias);
    if pool_dir.exists() {
        fs::remove_dir_all(pool_dir)?;
    }
    Ok(())
}

fn backup_if_present(paths: &AppPaths, tool: &str, target: &Path, stamp: &str) -> Result<()> {
    if !target.exists() {
        return Ok(());
    }
    let backup_dir = paths.backups_root().join(tool).join(stamp);
    fs::create_dir_all(&backup_dir)?;
    let name = target
        .file_name()
        .map(|n| n.to_os_string())
        .unwrap_or_else(|| std::ffi::OsString::from("file"));
    copy_file(target, &backup_dir.join(name))?;
    Ok(())
}

fn copy_file(src: &Path, dst: &Path) -> Result<()> {
    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::copy(src, dst)?;
    Ok(())
}
