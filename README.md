# minicoder

A small **desktop code editor** inspired by Visual Studio Code, built with **[Tauri 2](https://v2.tauri.app/)**, **React 19**, **Vite**, and **[Ace](https://ace.c9.io/)** via `react-ace`. It runs as a native app on macOS, Windows, and Linux and is meant for editing text and source files in a local folder or standalone files.

## What it does

- **Workbench UI** — Activity bar, sidebar (Explorer / workspace search), tabbed editor, and status bar with line/column, language label, and line count.
- **Files** — Open files or an entire folder; browse the tree; open multiple **tabs**; save; keyboard shortcuts for new file, open, open folder, save, and close tab.
- **Editing** — Syntax highlighting for common languages (JavaScript, TypeScript, JSX/TSX, PHP, Python, Rust, HTML, CSS, Markdown, C/C++, and more), with optional language detection via highlight.js when no filename is available.
- **Workspace search** — After opening a folder, search file names across the project from the sidebar.
- **PHP diagnostics** — When the [PHP CLI](https://www.php.net/) is on your `PATH`, parse errors are surfaced in the editor using `php -l` (see annotations in the gutter).

For step-by-step setup notes used while building this kind of app (dependencies, Tauri plugins, Tailwind), see **[instruction.md](./instruction.md)**.

## Screenshots

Explorer with a Laravel project open, tabbed editor (`User.php` active), and the Minicoder actions menu (New File, Open File, Open Folder, Save).

<p align="center">
  <img src="docs/screenshots/Screenshot_2026-04-14_at_5.26.21_AM-9161b977-933c-4791-b02e-057d1e582d24.png" alt="minicoder — Laravel API folder tree and User.php in the editor" width="780" />
</p>

Environment file editing with multiple tabs (`.env`, `User.php`, `UserFactory.php`).

<p align="center">
  <img src="docs/screenshots/Screenshot_2026-04-14_at_5.26.29_AM-90e67dfa-64c3-4a01-b94c-ea1c452d261a.png" alt="minicoder — .env file in the editor with sidebar and status bar" width="780" />
</p>

`UserFactory.php` open with PHP syntax highlighting and the status bar showing language and line count.

<p align="center">
  <img src="docs/screenshots/Screenshot_2026-04-14_at_5.26.37_AM-064cb013-966f-45ef-b0e0-3de5d4d33063.png" alt="minicoder — UserFactory.php with Laravel factory code" width="780" />
</p>

## Development

```bash
pnpm install
pnpm tauri dev
```

Build a release binary:

```bash
pnpm tauri build
```

## License

See the repository license file if present; otherwise treat as private or add a license as needed.
