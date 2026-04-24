use std::fs;
use std::path::Path;

use parking_lot::Mutex;

use crate::error::Result;
use crate::model::AppState;
use crate::paths::AppPaths;

/// In-memory state wrapper. Persists to disk on every mutation via
/// [`Store::mutate`].
pub struct Store {
    pub paths: AppPaths,
    inner: Mutex<AppState>,
}

impl Store {
    pub fn load(paths: AppPaths) -> Result<Self> {
        paths.ensure_dirs()?;
        let state = read_or_init(&paths.state_file())?;
        Ok(Self {
            paths,
            inner: Mutex::new(state),
        })
    }

    /// Read-only snapshot for returning to the frontend.
    pub fn snapshot(&self) -> AppState {
        self.inner.lock().clone()
    }

    /// Mutate the state, persist, and return a fresh snapshot.
    pub fn mutate<F, T>(&self, f: F) -> Result<(T, AppState)>
    where
        F: FnOnce(&mut AppState) -> Result<T>,
    {
        let mut guard = self.inner.lock();
        let out = f(&mut guard)?;
        write_atomic(&self.paths.state_file(), &*guard)?;
        Ok((out, guard.clone()))
    }
}

fn read_or_init(file: &Path) -> Result<AppState> {
    if !file.exists() {
        let s = AppState::fresh();
        write_atomic(file, &s)?;
        return Ok(s);
    }
    let raw = fs::read(file)?;
    let mut state: AppState = serde_json::from_slice(&raw)?;
    // Forward-compat: newly-added tools or fresh installs on a different
    // platform get their default target paths filled in automatically.
    state.fill_missing_targets();
    Ok(state)
}

fn write_atomic(file: &Path, state: &AppState) -> Result<()> {
    let parent = file.parent().expect("state file has a parent dir");
    fs::create_dir_all(parent)?;
    let tmp = parent.join(format!(
        ".state.{}.tmp",
        std::process::id()
    ));
    let json = serde_json::to_vec_pretty(state)?;
    fs::write(&tmp, json)?;
    fs::rename(&tmp, file)?;
    Ok(())
}
