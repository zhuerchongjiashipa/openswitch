//! Per-tool switching logic.
//!
//! Each tool carries a list of `TargetFile`s on `AppState::tools`.
//! Activating a credential copies its pool files onto those targets,
//! backing up whatever was there first. Importing does the reverse:
//! snapshots the live targets into a new pool folder.

use std::fs;
use std::path::{Path, PathBuf};

use chrono::{NaiveDateTime, TimeZone, Utc};
use serde::Serialize;

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

#[derive(Serialize, Clone)]
pub struct BackupEntry {
    /// Raw folder name under `<app_data>/backups/<tool>/`. Pass this to
    /// [`restore_backup`].
    pub stamp: String,
    /// ISO-8601 form of `stamp`, for display (`""` if the stamp is
    /// unparseable, e.g. a folder written by a future schema).
    pub iso: String,
    pub files: Vec<String>,
}

pub fn list_backups(paths: &AppPaths, tool: &str) -> Result<Vec<BackupEntry>> {
    let dir = paths.backups_root().join(tool);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut entries = Vec::new();
    for rd in fs::read_dir(&dir)? {
        let rd = rd?;
        if !rd.file_type()?.is_dir() {
            continue;
        }
        let stamp = rd.file_name().to_string_lossy().to_string();
        let iso = NaiveDateTime::parse_from_str(&stamp, "%Y%m%dT%H%M%SZ")
            .ok()
            .map(|ndt| Utc.from_utc_datetime(&ndt).to_rfc3339())
            .unwrap_or_default();

        let mut files = Vec::new();
        for f in fs::read_dir(rd.path())? {
            let f = f?;
            if f.file_type()?.is_file() {
                files.push(f.file_name().to_string_lossy().to_string());
            }
        }
        files.sort();

        entries.push(BackupEntry { stamp, iso, files });
    }

    // Newest first (lexicographic order on the timestamp is correct because
    // the format is fixed-width).
    entries.sort_by(|a, b| b.stamp.cmp(&a.stamp));
    Ok(entries)
}

/// Restore a backup by copying each file in the backup folder over the
/// current target that has the matching basename. The current live state
/// is itself backed up first so the restore can be undone.
pub fn restore_backup(paths: &AppPaths, tool: &Tool, stamp: &str) -> Result<Vec<PathBuf>> {
    let backup_dir = paths.backups_root().join(&tool.id).join(stamp);
    if !backup_dir.exists() {
        return Err(AppError::NotFound(format!(
            "backup {}/{}",
            tool.id, stamp
        )));
    }

    let pre_stamp = Utc::now().format("%Y%m%dT%H%M%SZ").to_string();
    let mut written = Vec::new();

    for t in &tool.targets {
        let target_path = expand_home(&t.target)?;
        let basename = match target_path.file_name() {
            Some(n) => n.to_os_string(),
            None => continue,
        };
        let backup_file = backup_dir.join(&basename);
        if !backup_file.exists() {
            continue;
        }
        backup_if_present(paths, &tool.id, &target_path, &pre_stamp)?;
        copy_file(&backup_file, &target_path)?;
        written.push(target_path);
    }

    if written.is_empty() {
        return Err(AppError::NotFound(format!(
            "backup {}/{} has no files matching the current targets",
            tool.id, stamp
        )));
    }

    Ok(written)
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
