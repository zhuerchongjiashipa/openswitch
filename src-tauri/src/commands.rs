use chrono::Utc;
use serde::Serialize;
use tauri::State;

use crate::error::{AppError, Result};
use crate::model::{AppState, Credential, Environment, TargetFile};
use crate::state::Store;
use crate::switcher;

#[derive(Serialize, Clone)]
pub struct SwitchOutcome {
    pub tool: String,
    pub alias: String,
    pub written: Vec<String>,
    pub state: AppState,
}

#[derive(Serialize, Clone)]
pub struct EnvSwitchOutcome {
    pub env: String,
    pub outcomes: Vec<SwitchOutcome>,
    pub state: AppState,
}

#[tauri::command]
pub fn get_state(store: State<'_, Store>) -> AppState {
    store.snapshot()
}

#[tauri::command]
pub fn add_environment(
    store: State<'_, Store>,
    id: String,
    name: String,
    hint: String,
) -> Result<AppState> {
    let (_, snap) = store.mutate(|s| {
        if s.envs.iter().any(|e| e.id == id) {
            return Err(AppError::Conflict(format!("env {id} already exists")));
        }
        s.envs.push(Environment {
            id,
            name,
            hint,
            bindings: Default::default(),
        });
        Ok(())
    })?;
    Ok(snap)
}

#[tauri::command]
pub fn remove_environment(
    store: State<'_, Store>,
    id: String,
) -> Result<AppState> {
    let (_, snap) = store.mutate(|s| {
        if s.envs.len() <= 1 {
            return Err(AppError::Invalid(
                "cannot remove the last environment".into(),
            ));
        }
        let before = s.envs.len();
        s.envs.retain(|e| e.id != id);
        if s.envs.len() == before {
            return Err(AppError::NotFound(format!("env {id}")));
        }
        if s.active_env == id {
            s.active_env = s.envs[0].id.clone();
        }
        Ok(())
    })?;
    Ok(snap)
}

#[tauri::command]
pub fn set_active_environment(
    store: State<'_, Store>,
    id: String,
) -> Result<AppState> {
    let (_, snap) = store.mutate(|s| {
        if s.find_env(&id).is_none() {
            return Err(AppError::NotFound(format!("env {id}")));
        }
        s.active_env = id;
        Ok(())
    })?;
    Ok(snap)
}

#[tauri::command]
pub fn import_credential(
    store: State<'_, Store>,
    tool: String,
    alias: String,
) -> Result<AppState> {
    // Pull a snapshot of the tool record for the IO side effects.
    let tool_rec = store
        .snapshot()
        .find_tool(&tool)
        .cloned()
        .ok_or_else(|| AppError::Invalid(format!("unknown tool: {tool}")))?;

    switcher::import_live(&store.paths, &tool_rec, &alias)?;

    let (_, snap) = store.mutate(|s| {
        if s.pool
            .iter()
            .any(|c| c.tool == tool && c.alias == alias)
        {
            return Err(AppError::Conflict(format!(
                "{tool}/{alias} already in pool"
            )));
        }
        let id = next_cred_id(s);
        s.pool.push(Credential {
            id,
            tool,
            alias,
            added_iso: Utc::now().format("%Y-%m-%d").to_string(),
        });
        Ok(())
    })?;
    Ok(snap)
}

#[tauri::command]
pub fn remove_credential(
    store: State<'_, Store>,
    id: String,
) -> Result<AppState> {
    let Some(cred) = store.snapshot().find_cred(&id).cloned() else {
        return Err(AppError::NotFound(format!("credential {id}")));
    };

    let (_, snap) = store.mutate(|s| {
        for env in s.envs.iter_mut() {
            env.bindings.retain(|_, v| v != &id);
        }
        s.pool.retain(|c| c.id != id);
        Ok(())
    })?;

    let _ = switcher::remove_pool_entry(&store.paths, &cred.tool, &cred.alias);

    Ok(snap)
}

#[tauri::command]
pub fn activate_credential(
    store: State<'_, Store>,
    env_id: String,
    tool: String,
    cred_id: String,
) -> Result<SwitchOutcome> {
    // Resolve credential + tool under the lock, then do IO without it held.
    let (tool_rec, alias) = {
        let snap = store.snapshot();
        let cred = snap
            .find_cred(&cred_id)
            .ok_or_else(|| AppError::NotFound(format!("credential {cred_id}")))?;
        if cred.tool != tool {
            return Err(AppError::Invalid(format!(
                "credential {} is for tool {}, not {}",
                cred_id, cred.tool, tool
            )));
        }
        if snap.find_env(&env_id).is_none() {
            return Err(AppError::NotFound(format!("env {env_id}")));
        }
        let tool_rec = snap
            .find_tool(&tool)
            .cloned()
            .ok_or_else(|| AppError::Invalid(format!("unknown tool: {tool}")))?;
        (tool_rec, cred.alias.clone())
    };

    let written = switcher::activate(&store.paths, &tool_rec, &alias)?;

    let (_, snap) = store.mutate(|s| {
        if let Some(env) = s.find_env_mut(&env_id) {
            env.bindings.insert(tool_rec.id.clone(), cred_id.clone());
        }
        Ok(())
    })?;

    Ok(SwitchOutcome {
        tool: tool_rec.id,
        alias,
        written: written
            .into_iter()
            .map(|p| p.to_string_lossy().into_owned())
            .collect(),
        state: snap,
    })
}

#[tauri::command]
pub fn switch_environment(
    store: State<'_, Store>,
    env_id: String,
) -> Result<EnvSwitchOutcome> {
    let snap = store.snapshot();
    let env = snap
        .find_env(&env_id)
        .ok_or_else(|| AppError::NotFound(format!("env {env_id}")))?
        .clone();

    let mut outcomes = Vec::new();
    for (tool_id, cred_id) in env.bindings.iter() {
        let cred = match snap.find_cred(cred_id) {
            Some(c) => c.clone(),
            None => continue,
        };
        let tool_rec = match snap.find_tool(tool_id) {
            Some(t) => t.clone(),
            None => continue,
        };
        match switcher::activate(&store.paths, &tool_rec, &cred.alias) {
            Ok(written) => outcomes.push(SwitchOutcome {
                tool: tool_id.clone(),
                alias: cred.alias.clone(),
                written: written
                    .into_iter()
                    .map(|p| p.to_string_lossy().into_owned())
                    .collect(),
                state: snap.clone(),
            }),
            Err(e) => outcomes.push(SwitchOutcome {
                tool: tool_id.clone(),
                alias: format!("ERROR: {e}"),
                written: vec![],
                state: snap.clone(),
            }),
        }
    }

    let (_, snap) = store.mutate(|s| {
        s.active_env = env_id.clone();
        Ok(())
    })?;

    Ok(EnvSwitchOutcome {
        env: env_id,
        outcomes,
        state: snap,
    })
}

/// Replace the target-file list for a tool. Used by the "edit paths" UI.
/// Empty `targets` is allowed and resets the tool to platform defaults on
/// the next load.
#[tauri::command]
pub fn update_tool_paths(
    store: State<'_, Store>,
    tool: String,
    targets: Vec<TargetFile>,
) -> Result<AppState> {
    switcher::validate_targets(&targets)?;
    let (_, snap) = store.mutate(|s| {
        let t = s
            .find_tool_mut(&tool)
            .ok_or_else(|| AppError::NotFound(format!("tool {tool}")))?;
        t.targets = targets;
        Ok(())
    })?;
    Ok(snap)
}

/// Reset a tool's targets to the platform default for the current OS.
#[tauri::command]
pub fn reset_tool_paths(
    store: State<'_, Store>,
    tool: String,
) -> Result<AppState> {
    let (_, snap) = store.mutate(|s| {
        let defaults = crate::model::platform_default_targets(&tool);
        let t = s
            .find_tool_mut(&tool)
            .ok_or_else(|| AppError::NotFound(format!("tool {tool}")))?;
        t.targets = defaults;
        Ok(())
    })?;
    Ok(snap)
}

fn next_cred_id(s: &AppState) -> String {
    let mut max = 0u32;
    for c in &s.pool {
        if let Some(rest) = c.id.strip_prefix('c') {
            if let Ok(n) = rest.parse::<u32>() {
                if n > max {
                    max = n;
                }
            }
        }
    }
    format!("c{}", max + 1)
}
