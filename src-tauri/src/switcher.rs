//! Per-tool switching logic.
//!
//! Each tool carries a list of `TargetFile`s on `AppState::tools`.
//! Activating a credential copies its pool files onto those targets,
//! backing up whatever was there first. Importing does the reverse:
//! snapshots the live targets into a new pool folder.

use std::fs;
use std::path::{Path, PathBuf};

use chrono::Utc;

use crate::error::{AppError, Result};
use crate::model::{TargetFile, Tool};
use crate::paths::{expand_home, AppPaths};

/// Activate `alias` for `tool`: copy pool files onto live targets.
pub fn activate(paths: &AppPaths, tool: &Tool, alias: &str) -> Result<Vec<PathBuf>> {
    if tool.targets.is_empty() {
        return Err(AppError::Invalid(format!(
            "no targets configured for tool {}",
            tool.id
        )));
    }
    let pool_dir = paths.pool_dir(&tool.id, alias);
    if !pool_dir.exists() {
        return Err(AppError::NotFound(format!(
            "pool dir for {}/{} not found",
            tool.id, alias
        )));
    }

    let stamp = Utc::now().format("%Y%m%dT%H%M%SZ").to_string();
    let mut written = Vec::new();

    for t in &tool.targets {
        let src = pool_dir.join(&t.pool_name);
        if !src.exists() {
            continue;
        }
        let dst = expand_home(&t.target)?;
        backup_if_present(paths, &tool.id, &dst, &stamp)?;
        copy_file(&src, &dst)?;
        written.push(dst);
    }

    Ok(written)
}

/// Import the tool's current live configuration into the pool as `alias`.
pub fn import_live(paths: &AppPaths, tool: &Tool, alias: &str) -> Result<Vec<PathBuf>> {
    if tool.targets.is_empty() {
        return Err(AppError::Invalid(format!(
            "no targets configured for tool {}",
            tool.id
        )));
    }

    let pool_dir = paths.pool_dir(&tool.id, alias);
    if pool_dir.exists() {
        return Err(AppError::Conflict(format!(
            "pool entry already exists: {}/{}",
            tool.id, alias
        )));
    }
    fs::create_dir_all(&pool_dir)?;

    let mut imported = Vec::new();
    for t in &tool.targets {
        let src = expand_home(&t.target)?;
        if !src.exists() {
            continue;
        }
        let dst = pool_dir.join(&t.pool_name);
        copy_file(&src, &dst)?;
        imported.push(dst);
    }

    if imported.is_empty() {
        let _ = fs::remove_dir_all(&pool_dir);
        return Err(AppError::NotFound(format!(
            "no live configuration found for {}",
            tool.id
        )));
    }

    Ok(imported)
}

pub fn remove_pool_entry(paths: &AppPaths, tool: &str, alias: &str) -> Result<()> {
    let pool_dir = paths.pool_dir(tool, alias);
    if pool_dir.exists() {
        fs::remove_dir_all(pool_dir)?;
    }
    Ok(())
}

/// Validation used by `update_tool_paths`: reject empty names, duplicates,
/// and any slashes inside `pool_name` (which would escape the pool dir).
pub fn validate_targets(targets: &[TargetFile]) -> Result<()> {
    use std::collections::HashSet;
    let mut seen = HashSet::new();
    for t in targets {
        if t.pool_name.trim().is_empty() {
            return Err(AppError::Invalid("pool_name must not be empty".into()));
        }
        if t.target.trim().is_empty() {
            return Err(AppError::Invalid("target must not be empty".into()));
        }
        if t.pool_name.contains('/') || t.pool_name.contains('\\') {
            return Err(AppError::Invalid(format!(
                "pool_name must be a plain file name, got: {}",
                t.pool_name
            )));
        }
        if !seen.insert(t.pool_name.clone()) {
            return Err(AppError::Invalid(format!(
                "duplicate pool_name: {}",
                t.pool_name
            )));
        }
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
