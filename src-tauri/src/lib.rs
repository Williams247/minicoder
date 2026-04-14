mod lint;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 1. Initialize the File System plugin
        .plugin(tauri_plugin_fs::init())
        // 2. Initialize the Dialog plugin (This was missing!)
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![lint::lint_php])
        // 3. Setup other plugins or app logic
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}