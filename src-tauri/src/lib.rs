mod commands;
mod error;
mod model;
mod paths;
mod state;
mod switcher;

use tauri::Manager;

use crate::paths::AppPaths;
use crate::state::Store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let root = app
                .path()
                .app_data_dir()
                .expect("app_data_dir should resolve");
            let store = Store::load(AppPaths::resolve(root))
                .expect("failed to load/initialize OpenSwitch state");
            app.manage(store);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_state,
            commands::add_environment,
            commands::remove_environment,
            commands::set_active_environment,
            commands::import_credential,
            commands::remove_credential,
            commands::activate_credential,
            commands::switch_environment,
            commands::update_tool_paths,
            commands::reset_tool_paths,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
