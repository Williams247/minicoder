# NOTE: BEFORE YOU START ANY DEVELOPMENT WITH THIS SAMPLE PROJECT AND THE README GUIDE, PLEASE LOOK AT THE [tauri-project-desktop-app](https://github.com/Williams247/tauri-project-desktop-app) REPO AT GITHUB, LOOK AT THE STEPS THERE, THEN WHEN YOU HAVE DONE IT, PLEASE COME BACK HERE AND TRY THIS OTHER STEPS.

## Install react-ace text editor:

### pnpm add react-ace ace-builds

## Install highlight.js to enable the text editor to auto detect language:

### pnpm add highlight.js

## Install tauri file system library to enable tauri to get access to the file system:

### pnpm tauri add fs

## Install tauri app dialog

### pnpm add @tauri-apps/plugin-dialog

## Add the tauri dialog to rust "Cargo.toml", the file location is "/your-project-name/src-tauri/Cargo.toml":

[dependencies]

tauri-plugin-dialog = "2"

## Here's an example below:

```toml
[package]
name = "app"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
license = ""
repository = ""
edition = "2021"
rust-version = "1.77.2"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.5.3", features = [] }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.9.5", features = [] }
tauri-plugin-log = "2"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
```

## Add the following rust script below in "/your-project-name/src-tauri/src/lib.rs":

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 1. Initialize the File System plugin
        .plugin(tauri_plugin_fs::init())
        // 2. Initialize the Dialog plugin (This was missing!)
        .plugin(tauri_plugin_dialog::init())
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
```

## Add permissions your dialog module, the location of this file can be found in "/your-project-name/src-tauri/main.json", when you check the file location and it is not there, you can simply create a new main.json file then add the following commands below:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "dialog:allow-message"
  ]
}
```

## Add tailwind css, to do so run the following command below:

### pnpm add tailwindcss @tailwindcss/vite

### After installation run the command below to install configure tailwind css:

```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```
