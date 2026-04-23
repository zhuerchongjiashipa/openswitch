use std::path::{Path, PathBuf};

use crate::error::{AppError, Result};

/// Root of OpenSwitch's on-disk data: state.json + pool/.
pub struct AppPaths {
    pub root: PathBuf,
}

impl AppPaths {
    pub fn resolve(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn state_file(&self) -> PathBuf {
        self.root.join("state.json")
    }

    pub fn pool_root(&self) -> PathBuf {
        self.root.join("pool")
    }

    pub fn backups_root(&self) -> PathBuf {
        self.root.join("backups")
    }

    /// `<root>/pool/<tool>/<alias>/`
    pub fn pool_dir(&self, tool: &str, alias: &str) -> PathBuf {
        self.pool_root().join(tool).join(alias)
    }

    pub fn ensure_dirs(&self) -> Result<()> {
        std::fs::create_dir_all(&self.root)?;
        std::fs::create_dir_all(self.pool_root())?;
        std::fs::create_dir_all(self.backups_root())?;
        Ok(())
    }
}

/// User home directory; errors if unavailable.
pub fn home_dir() -> Result<PathBuf> {
    dirs::home_dir().ok_or(AppError::NoHome)
}

/// Expand a leading `~` against the user's home directory.
pub fn expand_home(p: impl AsRef<Path>) -> Result<PathBuf> {
    let p = p.as_ref();
    if let Ok(stripped) = p.strip_prefix("~") {
        Ok(home_dir()?.join(stripped))
    } else {
        Ok(p.to_path_buf())
    }
}
